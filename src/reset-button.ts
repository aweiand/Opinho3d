import * as ecs from '@8thwall/ecs'
import {Logo} from './logo'

const logoQuery = ecs.defineQuery([Logo])
export const RESET_EVENT = 'objects-reset'

export function resetModels(world: ecs.World) {
  // Stop action UI state before deleting the animated entities.
  world.events.dispatch(world.events.globalId, RESET_EVENT)
  logoQuery(world).forEach(eid => world.deleteEntity(eid))
}
