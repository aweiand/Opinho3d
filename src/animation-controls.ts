import * as ecs from '@8thwall/ecs'
import actions from './animation-actions.json'
import {OBJECT_PLACED_EVENT} from './tap-to-place'
import {RESET_EVENT, resetModels} from './reset-button'
import {ACTION_STARTED_EVENT, ACTION_FINISHED_EVENT} from './animation-events'
import {capturePhoto} from './photo-button'
import {createVideoRecorder} from './video-recorder'
import {cameraMode} from './camera-mode'
import {icon, labelButton} from './icons'
import {t} from './i18n'

// Camera.set restarts the ECS camera pipeline. Await its startup before placing selfie content.
function startCamera(world: ecs.World, selfie: boolean) {
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timeout)
      window.removeEventListener('opinho-camera-ready', ready)
      window.removeEventListener('opinho-camera-error', failed)
      error ? reject(error) : resolve()
    }
    const ready = () => finish()
    const failed = () => finish(new Error('Camera pipeline failed'))
    const timeout = window.setTimeout(() => finish(new Error('Camera startup timed out')), 20000)
    window.addEventListener('opinho-camera-ready', ready, {once: true})
    window.addEventListener('opinho-camera-error', failed, {once: true})
    try {
      ecs.Camera.set(world, world.camera.getActiveEid(), {
        // The face pipeline supports front camera selection in the bundled ECS runtime.
        // No face attachment is used: Opinho remains beside the viewer in camera space.
        xrCameraType: selfie ? 'face' : 'world',
        direction: selfie ? 'front' : 'back',
        disableWorldTracking: selfie,
        mirroredDisplay: selfie,
      })
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

ecs.registerComponent({
  name: 'animation-controls',
  schema: {prefab: 'eid', ground: 'eid', hider: 'eid'},
  stateMachine: ({world, eid, schemaAttribute, defineState}) => {
    const ui = document.getElementById('ar-interface')!
    const controls = document.getElementById('animation-controls')!
    const menu = document.getElementById('action-menu')!
    const prompt = document.getElementById('tap-prompt')!
    const status = document.getElementById('camera-status')!
    const toggle = document.getElementById('actions-toggle') as HTMLButtonElement
    const camera = document.getElementById('camera-switch') as HTMLButtonElement
    const reset = document.getElementById('reset-model') as HTMLButtonElement
    const photo = document.getElementById('take-photo') as HTMLButtonElement
    const video = document.getElementById('record-video') as HTMLButtonElement
    const recorder = createVideoRecorder(world, () => refresh())
    let placed = false
    let playing = false
    let takingPhoto = false
    const closeMenu = () => {
      menu.hidden = true
      toggle.setAttribute('aria-expanded', 'false')
      toggle.innerHTML = icon('actions')
      labelButton(toggle, t('actions'))
    }
    const refresh = () => {
      reset.hidden = !placed
      controls.hidden = !placed
      reset.disabled = playing || cameraMode.switching || takingPhoto || recorder.active
      camera.disabled = playing || cameraMode.switching || takingPhoto || recorder.active
      photo.disabled = cameraMode.switching || takingPhoto || recorder.active
      video.disabled = cameraMode.switching || takingPhoto || recorder.active
      controls.querySelectorAll('button').forEach(button => { button.disabled = cameraMode.switching || takingPhoto || recorder.transitioning })
      labelButton(camera, t(cameraMode.selfie ? 'back' : 'front'))
    }
    controls.replaceChildren()
    for (const {clip} of actions) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.clip = clip
      button.innerHTML = icon(clip)
      labelButton(button, t(clip as Parameters<typeof t>[0]))
      button.onclick = () => {
        if (!placed || cameraMode.switching || takingPhoto || recorder.transitioning) return
        world.events.dispatch(world.events.globalId, `opinho-play-${clip}`)
        closeMenu()
        toggle.focus()
      }
      controls.appendChild(button)
    }
    for (const [button, name, label] of [[camera, 'camera', 'front'], [reset, 'reset', 'reset'], [photo, 'photo', 'photo'], [video, 'video', 'video']] as const) {
      button.innerHTML = icon(name)
      labelButton(button, t(label))
    }
    closeMenu()
    // UI touches must never place a model on the ground behind the menu.
    for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
      ui.addEventListener(event, e => e.stopPropagation())
    }
    toggle.onclick = () => {
      const opening = menu.hidden
      menu.hidden = !opening
      toggle.setAttribute('aria-expanded', String(opening))
      toggle.innerHTML = icon(opening ? 'close' : 'actions')
      labelButton(toggle, t(opening ? 'closeActions' : 'actions'))
    }
    ui.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeMenu(); toggle.focus() }
    })
    document.addEventListener('pointerdown', e => {
      if ((e.target as HTMLElement).tagName === 'CANVAS') {
        prompt.hidden = true
        closeMenu()
      }
    })
    const createSelfie = () => {
      const {prefab} = schemaAttribute.get(eid)
      const model = world.createEntity(prefab)
      world.setParent(model, world.camera.getActiveEid())
      // ECS cameras look along local +Z; the character looks back toward the viewer.
      world.transform.setLocalPosition(model, {x: -0.38, y: -0.65, z: 1.5})
      ecs.Quaternion.set(world, model, {x: 0, y: 1, z: 0, w: 0})
      ecs.Scale.set(world, model, {x: 1.3, y: 1.3, z: 1.3})
      world.events.dispatch(world.events.globalId, OBJECT_PLACED_EVENT)
      prompt.hidden = true
    }
    const updateGround = () => {
      const {ground, hider} = schemaAttribute.get(eid)
      for (const entity of [ground, hider]) {
        cameraMode.selfie ? ecs.Hidden.set(world, entity) : ecs.Hidden.remove(world, entity)
      }
    }
    camera.onclick = async () => {
      if (camera.disabled) return
      const previous = cameraMode.selfie
      cameraMode.switching = true
      refresh()
      closeMenu()
      status.textContent = t('switching')
      status.hidden = false
      prompt.hidden = true
      resetModels(world)
      try {
        await startCamera(world, !previous)
        cameraMode.selfie = !previous
        status.hidden = true
      } catch (error) {
        console.error('Camera switch failed:', error)
        status.textContent = t('cameraError')
        // Restore the previous pipeline if access fails or the device lacks a front camera.
        try { await startCamera(world, previous) } catch (restoreError) { console.error('Camera recovery failed:', restoreError) }
      } finally {
        cameraMode.switching = false
        updateGround()
        if (cameraMode.selfie) createSelfie()
        else prompt.hidden = false
        refresh()
      }
    }
    reset.onclick = () => {
      if (reset.disabled) return
      resetModels(world)
      closeMenu()
      if (cameraMode.selfie) createSelfie()
      else prompt.hidden = false
      toggle.focus()
    }
    photo.onclick = async () => {
      if (photo.disabled) return
      takingPhoto = true
      refresh()
      closeMenu()
      try { await capturePhoto(world) } finally { takingPhoto = false; refresh() }
    }
    video.onclick = async () => {
      if (video.disabled) return
      closeMenu()
      await recorder.start()
    }
    defineState('loading').initial()
      .onEvent(ecs.events.REALITY_READY, 'ready', {target: world.events.globalId})
    defineState('ready')
      .onEnter(() => { ui.hidden = false; refresh() })
      .listen(world.events.globalId, ecs.events.RECORDER_VIDEO_STARTED, () => recorder.started())
      .listen(world.events.globalId, ecs.events.RECORDER_VIDEO_STOPPED, () => recorder.stopped())
      .listen(world.events.globalId, ecs.events.RECORDER_VIDEO_READY, event => recorder.ready(event.data.videoBlob))
      .listen(world.events.globalId, ecs.events.RECORDER_VIDEO_ERROR, event => recorder.error(event.data))
      .listen(world.events.globalId, OBJECT_PLACED_EVENT, () => { placed = true; prompt.hidden = true; refresh() })
      .listen(world.events.globalId, RESET_EVENT, () => { placed = false; playing = false; refresh() })
      .listen(world.events.globalId, ACTION_STARTED_EVENT, () => { playing = true; refresh() })
      .listen(world.events.globalId, ACTION_FINISHED_EVENT, () => { playing = false; refresh() })
  },
})
