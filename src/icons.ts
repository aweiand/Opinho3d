// Inline SVGs stay sharp on mobile and need no external font or image downloads.
const paths: Record<string, string> = {
  actions: '<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8Z"/><path d="m20 3 .5 1.5L22 5l-1.5.5L20 7l-.5-1.5L18 5l1.5-.5Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  video: '<rect x="3" y="5" width="12" height="14" rx="2"/><path d="m15 10 6-4v12l-6-4Z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  photo: '<path d="M8 5 6 8H3v12h18V8h-3l-2-3Z"/><circle cx="12" cy="13" r="4"/>',
  camera: '<path d="M4 8a9 9 0 0 1 15-3l2 2M21 2v5h-5M20 16a9 9 0 0 1-15 3l-2-2M3 22v-5h5"/><circle cx="12" cy="12" r="3"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  idle: '<path d="M9 5v14M15 5v14"/>',
  agree: '<path d="m5 12 4 4L19 6"/>',
  dive: '<path d="M5 16a7 7 0 1 1 11 2M16 13v5h5"/><circle cx="10" cy="11" r="2"/>',
  heart_pose: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  flip: '<circle cx="12" cy="11" r="2"/><path d="m4 3 8 5 8-5M12 13l-7 8M12 13l7 8"/>',
  angry_02: '<circle cx="14" cy="4" r="2"/><path d="m7 12 4-5 5 5h4M12 8l-2 7-5 6M10 15l6 2v4"/>',
}
export function icon(name: string) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.actions}</svg>`
}
export function labelButton(button: HTMLButtonElement, label: string) {
  button.setAttribute('aria-label', label)
  button.title = label
}
