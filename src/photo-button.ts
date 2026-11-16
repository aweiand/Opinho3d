import * as ecs from '@8thwall/ecs'
import {t} from './i18n'

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

// Keep preview interactions from reaching the AR scene underneath.
const preview = document.getElementById('photo-preview')!
for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
  preview.addEventListener(event, e => e.stopPropagation())
}

let capturing = false
export async function capturePhoto(world: ecs.World) {
  if (capturing) return
  capturing = true
  const controls = document.getElementById('ar-interface')!
  const controlsVisibility = controls.style.visibility
  let url: string | undefined
  const releasePhoto = () => {
    if (url) URL.revokeObjectURL(url)
    url = undefined
  }
  try {
    controls.style.visibility = 'hidden'
    await nextFrame()
    await nextFrame()
    const photo = await world.xr.takeScreenshot()
    const dialog = document.getElementById('photo-preview') as HTMLDialogElement
    const image = document.getElementById('photo-image') as HTMLImageElement
    const save = document.getElementById('photo-save') as HTMLAnchorElement
    const close = document.getElementById('photo-close') as HTMLButtonElement
    url = URL.createObjectURL(photo)
    image.src = url
    save.href = url
    save.download = `opinho-ar-${Date.now()}.jpg`
    dialog.addEventListener('close', () => {
      image.removeAttribute('src')
      save.removeAttribute('href')
      releasePhoto()
      document.getElementById('actions-toggle')?.focus()
    }, {once: true})
    close.onclick = () => dialog.close()
    dialog.showModal()
    close.focus()
  } catch (error) {
    releasePhoto()
    console.error('Photo capture failed:', error)
    window.alert(t('photoError'))
  } finally {
    controls.style.visibility = controlsVisibility
    capturing = false
  }
}
