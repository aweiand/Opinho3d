import * as ecs from '@8thwall/ecs'
import {Logo} from './logo'

const OBJECT_PLACED_EVENT = 'object-placed'
const placedObjects = ecs.defineQuery([Logo])

ecs.registerComponent({
  name: 'tap-to-place',
  schema: {
    prefab: 'eid'
  },
  stateMachine: ({world, eid, schemaAttribute, defineState}) => {
    defineState('initial').initial().listen(eid,  ecs.input.SCREEN_TOUCH_START, (e) => {
      // Keep placement blocked until Reset has finished removing the current model.
      if (!e.data.worldPosition || placedObjects(world).length > 0) {
        return
      }
      const newEid = world.createEntity(schemaAttribute.get(eid).prefab)
      const position = e.data.worldPosition
      const cameraPosition = world.transform.getWorldPosition(world.camera.getActiveEid())
      // Opinho faces +Z. Rotate only around Y so he stays upright on the ground.
      const yaw = Math.atan2(cameraPosition.x - position.x, cameraPosition.z - position.z)
      world.transform.setWorldPosition(newEid, position)
      world.transform.setWorldQuaternion(newEid, ecs.math.quat.yRadians(yaw))
      world.events.dispatch(eid, OBJECT_PLACED_EVENT)
    })
  }
})

export {
  OBJECT_PLACED_EVENT,
}
