import motion from './walking-motion.json'

// Sample the movement curve without wrapping the character back to the start.
export const sampleWalkingMotion = (elapsed: number, repetitions: number) => {
  const end = motion.positions[motion.positions.length - 1]
  const time = Math.max(0, Math.min(elapsed, motion.duration * repetitions))
  if (time >= motion.duration * repetitions) {
    return {x: end[0] * repetitions, z: end[1] * repetitions}
  }
  const cycles = Math.floor(time / motion.duration)
  const localTime = time - cycles * motion.duration
  let index = 0
  while (index < motion.times.length - 2 && motion.times[index + 1] <= localTime) index++
  const fraction = (localTime - motion.times[index]) / (motion.times[index + 1] - motion.times[index])
  const from = motion.positions[index]
  const to = motion.positions[index + 1]
  return {
    x: end[0] * cycles + from[0] + (to[0] - from[0]) * fraction,
    z: end[1] * cycles + from[1] + (to[1] - from[1]) * fraction,
  }
}

export const walkingMotion = motion
