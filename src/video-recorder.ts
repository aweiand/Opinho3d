import * as ecs from '@8thwall/ecs'
import {icon, labelButton} from './icons'
import {t} from './i18n'

type RecordingState = 'idle' | 'starting' | 'recording' | 'processing'

export function createVideoRecorder(world: ecs.World, onChange: () => void) {
  const bar = document.getElementById('recording-bar')!
  const status = document.getElementById('recording-status')!
  const timer = document.getElementById('recording-time')!
  const stopButton = document.getElementById('stop-recording') as HTMLButtonElement
  const dialog = document.getElementById('video-preview') as HTMLDialogElement
  const player = document.getElementById('video-player') as HTMLVideoElement
  const save = document.getElementById('video-save') as HTMLAnchorElement
  const close = document.getElementById('video-close') as HTMLButtonElement
  let state: RecordingState = 'idle'
  let startedAt = 0
  let clock: number | undefined
  let watchdog: number | undefined
  let url: string | undefined
  let stopWhenStarted = false

  stopButton.innerHTML = icon('stop')
  labelButton(stopButton, t('stopVideo'))
  for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
    dialog.addEventListener(event, e => e.stopPropagation())
  }
  const clearTimers = () => {
    window.clearInterval(clock)
    window.clearTimeout(watchdog)
    clock = undefined
    watchdog = undefined
  }
  const updateClock = () => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    timer.textContent = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`
  }
  const update = (next: RecordingState) => {
    state = next
    bar.hidden = state === 'idle'
    bar.dataset.recording = String(state === 'recording')
    stopButton.hidden = state !== 'recording'
    timer.hidden = state !== 'recording'
    status.textContent = state === 'idle' ? '' : t(state === 'recording' ? 'recording' : state === 'starting' ? 'videoStarting' : 'videoProcessing')
    onChange()
  }
  const fail = (error: unknown) => {
    if (state === 'idle') return
    clearTimers()
    update('idle')
    console.error('Video recording failed:', error)
    window.alert(t('videoError'))
  }
  const processing = () => {
    clearTimers()
    update('processing')
    watchdog = window.setTimeout(() => fail(new Error('Video export timed out')), 120000)
  }
  const stop = () => {
    if (state === 'starting') { stopWhenStarted = true; return }
    if (state !== 'recording') return
    processing()
    try { world.xr.stopMediaRecorder() } catch (error) { fail(error) }
  }
  stopButton.onclick = stop
  close.onclick = () => dialog.close()
  dialog.addEventListener('close', () => {
    player.pause()
    player.removeAttribute('src')
    player.load()
    save.removeAttribute('href')
    if (url) URL.revokeObjectURL(url)
    url = undefined
    document.getElementById('actions-toggle')?.focus()
  })
  // Backgrounding a mobile browser can interrupt camera frames; finalize the current clip.
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop() })

  return {
    get active() { return state !== 'idle' },
    get transitioning() { return state === 'starting' || state === 'processing' },
    async start() {
      if (state !== 'idle' || dialog.open) return
      stopWhenStarted = false
      update('starting')
      watchdog = window.setTimeout(() => {
        try { world.xr.stopMediaRecorder() } catch (error) { console.error(error) }
        fail(new Error('Recorder startup timed out'))
      }, 30000)
      try {
        // The bundled ECS implementation returns a Promise even though its type says void.
        await world.xr.startMediaRecorder()
      } catch (error) { fail(error) }
    },
    started() {
      if (state !== 'starting') {
        // A delayed startup after timeout must not keep recording invisibly.
        if (state === 'idle') {
          try { world.xr.stopMediaRecorder() } catch (error) { console.error(error) }
        }
        return
      }
      clearTimers()
      startedAt = Date.now()
      updateClock()
      update('recording')
      clock = window.setInterval(updateClock, 250)
      if (stopWhenStarted || document.hidden) stop()
    },
    stopped() {
      // Also handles the recorder's automatic duration limit.
      if (state === 'recording' || state === 'starting') processing()
    },
    ready(blob: Blob) {
      if (state === 'idle') return
      clearTimers()
      try {
        if (!blob || !blob.size) throw new Error('Empty video')
        url = URL.createObjectURL(blob)
        player.src = url
        save.href = url
        const extension = blob.type.includes('webm') ? 'webm' : blob.type.includes('quicktime') ? 'mov' : 'mp4'
        save.download = `opinho-ar-${Date.now()}.${extension}`
        dialog.showModal()
        close.focus()
        update('idle')
      } catch (error) {
        if (url) URL.revokeObjectURL(url)
        url = undefined
        player.removeAttribute('src')
        save.removeAttribute('href')
        fail(error)
      }
    },
    error: fail,
  }
}
