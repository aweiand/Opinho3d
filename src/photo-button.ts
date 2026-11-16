import * as ecs from '@8thwall/ecs'

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

// Keep preview interactions from reaching the AR scene underneath.
const preview = document.getElementById('photo-preview')!
for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
  preview.addEventListener(event, e => e.stopPropagation())
}

ecs.registerComponent({
  name: 'photo-button',
  schema: {overlay: 'eid'},
  stateMachine: ({world, entity, eid, schemaAttribute, defineState}) => {
    let capturing = false

    defineState('loading')
      .initial()
      .onEnter(() => entity.hide())
      .onExit(() => entity.show())
      .onEvent(ecs.events.REALITY_READY, 'ready', {target: world.events.globalId})

    defineState('ready').listen(eid, ecs.input.UI_CLICK, async () => {
      if (capturing) return
      capturing = true
      const {overlay} = schemaAttribute.get(eid)
      const wasHidden = ecs.Hidden.has(world, overlay)
      const controls = document.getElementById('animation-controls')!
      const controlsWereHidden = controls.hidden
      try {
        // Wait for the controls to disappear from the rendered frame.
        ecs.Hidden.set(world, overlay)
        controls.hidden = true
        await nextFrame()
        await nextFrame()
        const photo = await world.xr.takeScreenshot()
        const dialog = document.getElementById('photo-preview') as HTMLDialogElement
        const image = document.getElementById('photo-image') as HTMLImageElement
        const save = document.getElementById('photo-save') as HTMLAnchorElement
        const close = document.getElementById('photo-close') as HTMLButtonElement
        const url = URL.createObjectURL(photo)
        image.src = url
        save.href = url
        save.download = `opinho-ar-${Date.now()}.jpg`
        dialog.addEventListener('close', () => {
          image.removeAttribute('src')
          save.removeAttribute('href')
          URL.revokeObjectURL(url)
        }, {once: true})
        close.onclick = () => dialog.close()
        dialog.showModal()
        close.focus()
      } catch (error) {
        console.error('Falha ao capturar foto:', error)
        window.alert('Não foi possível capturar a foto. Tente novamente.')
      } finally {
        if (!wasHidden) ecs.Hidden.remove(world, overlay)
        controls.hidden = controlsWereHidden
        capturing = false
      }
    })
  },
})
