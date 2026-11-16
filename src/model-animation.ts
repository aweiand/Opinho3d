import * as ecs from '@8thwall/ecs'
import {OBJECT_PLACED_EVENT} from './tap-to-place'
import {RESET_EVENT} from './reset-button'
import actions from './animation-actions.json'

const playEvent = (clip: string) => `opinho-play-${clip}`

ecs.registerComponent({
  name: 'model-animation',
  stateMachine: ({world, eid, defineState}) => {
    for (const {clip} of actions) {
      const state = defineState(clip)
      if (clip === 'idle') state.initial()
      state.onEnter(() => {
        ecs.GltfModel.set(world, eid, {
          animationClip: clip,
          paused: false,
          loop: clip === 'idle',
          repetitions: clip === 'idle' ? -1 : 0,
          time: 0,
          crossFadeDuration: 0.15,
        })
      })
      if (clip !== 'idle') {
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

