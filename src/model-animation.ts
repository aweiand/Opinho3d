import * as ecs from '@8thwall/ecs'
import actions from './animation-actions.json'
import {cameraMode} from './camera-mode'
import {sampleRootMotion, rootMotions} from './root-motion'
import {ACTION_STARTED_EVENT, ACTION_FINISHED_EVENT} from './animation-events'

const playEvent = (clip: string) => `opinho-play-${clip}`

ecs.registerComponent({
  name: 'model-animation',
  stateMachine: ({world, eid, defineState}) => {
    for (const {clip, repetitions = 1} of actions) {
      const motion = rootMotions[clip]
      let elapsed = 0
      let offset = {x: 0, z: 0}
      const moveTo = (time: number) => {
        if (cameraMode.selfie) return
        const next = sampleRootMotion(motion, time, repetitions)
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
        world.events.dispatch(world.events.globalId,
          clip === 'idle' ? ACTION_FINISHED_EVENT : ACTION_STARTED_EVENT)
      })
      if (motion) {
        state.onTick(() => {
          elapsed += world.time.delta / 1000
          moveTo(elapsed)
        })
        // Commit the last fraction even if the finish event arrives before tick.
        const finished = `${clip}-finished`
        state.onEvent(ecs.events.GLTF_ANIMATION_FINISHED, finished)
        defineState(finished)
          .onEnter(() => moveTo(motion.duration * repetitions))
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

