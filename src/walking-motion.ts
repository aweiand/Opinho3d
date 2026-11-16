import {rootMotions, sampleRootMotion} from './root-motion'

// Compatibility for development sessions that still cache the previous entry.
export const walkingMotion = {clip: 'angry_02', ...rootMotions.angry_02}
export const sampleWalkingMotion = (elapsed: number, repetitions: number) =>
  sampleRootMotion(walkingMotion, elapsed, repetitions)
