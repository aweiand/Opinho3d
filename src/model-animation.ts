import * as ecs from '@8thwall/ecs'
import {OBJECT_PLACED_EVENT} from './tap-to-place'
import {RESET_EVENT} from './reset-button'
import actions from './animation-actions.json'
import {sampleWalkingMotion, walkingMotion} from './walking-motion'

const playEvent = (clip: string) => `opinho-play-${clip}`

ecs.registerComponent({
  name: 'model-animation',
  stateMachine: ({world, eid, defineState}) => {
    for (const {clip, repetitions = 1} of actions) {
      let elapsed = 0
      let offset = {x: 0, z: 0}
      const moveTo = (time: number) => {
        const next = sampleWalkingMotion(time, repetitions)
        world.transform.translateSelf(eid, {x: next.x - offset.x, y: 0, z: next.z - offset.z})
        offset = next
      }
      const state = defineState(clip)
      if (clip === 'idle') state.initial()
      state.onEnter(() => {
        elapsed = 0
        offset = {x: 0, z: 0}
        ecs.GltfModel.set(world, eid, {
          animationClip: clip,
          paused: false,
          loop: clip === 'idle' || repetitions > 1,
          repetitions: clip === 'idle' ? -1 : repetitions,
          time: 0,
          crossFadeDuration: 0.15,
        })
      })
      if (clip === walkingMotion.clip) {
        state.onTick(() => {
          elapsed += world.time.delta / 1000
          moveTo(elapsed)
        })
        // Commit the last fraction even if the finish event arrives before tick.
        const finished = `${clip}-finished`
        state.onEvent(ecs.events.GLTF_ANIMATION_FINISHED, finished)
        defineState(finished)
          .onEnter(() => moveTo(walkingMotion.duration * repetitions))
          .wait(1, 'idle')
      } else if (clip !== 'idle') {
        state.onEvent(ecs.events.GLTF_ANIMATION_FINISHED, 'idle')
      }
      // Another action can interrupt this one; repeated taps keep it playing.
      for (const action of actions) {
        if (action.clip !== clip) {
          state.onEvent(playEvent(action.clip), action.clip, {target: world.events.globalId})
        }
      }
    }
  },
})

ecs.registerComponent({
  name: 'animation-controls',
  stateMachine: ({world, defineState}) => {
    const controls = document.getElementById('animation-controls')!
    controls.replaceChildren()
    for (const {clip, label} of actions) {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      button.dataset.clip = clip
      button.onclick = () => {
        world.events.dispatch(world.events.globalId, playEvent(clip))
      }
      controls.appendChild(button)
    }
    // Prevent button touches from placing content or interacting with the AR scene.
    for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
      controls.addEventListener(event, e => e.stopPropagation())
    }

    defineState('waiting')
      .initial()
      .onEnter(() => { controls.hidden = true })
      .onExit(() => { controls.hidden = false })
      .onEvent(OBJECT_PLACED_EVENT, 'ready', {target: world.events.globalId})

    defineState('ready')
      .onEvent(RESET_EVENT, 'waiting', {target: world.events.globalId})
  },
})

