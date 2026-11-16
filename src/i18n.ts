const messages = {
  pt: {
    video: 'Gravar vídeo', stopVideo: 'Parar gravação', recording: 'Gravando', videoStarting: 'Preparando gravação...', videoProcessing: 'Preparando vídeo...', videoPreview: 'Vídeo gravado', saveVideo: 'Salvar vídeo', videoError: 'Não foi possível gravar o vídeo. Tente novamente.', videoHint: 'Use Salvar vídeo para baixar a gravação no seu celular.',
    loading: 'Carregando...', actions: 'Ações do Opinho', closeActions: 'Fechar ações',
    tap: 'Toque na tela para colocar o Opinho', photo: 'Tirar foto', reset: 'Reposicionar Opinho',
    front: 'Câmera frontal', back: 'Câmera traseira', switching: 'Trocando câmera...',
    cameraError: 'Não foi possível trocar a câmera. Tente novamente.',
    photoError: 'Não foi possível capturar a foto. Tente novamente.',
    preview: 'Foto capturada', image: 'Foto com o Opinho em realidade aumentada', save: 'Salvar foto', close: 'Voltar',
    saveHint: 'Você também pode manter a imagem pressionada para salvá-la no celular.',
    prefix: 'Escaneie o QR Code com a câmera do celular ou acesse',
    suffix: 'no celular para abrir o Opinho em realidade aumentada.',
    description: 'Interaja com o Opinho, mascote da JGB Patinação Artística, na sua própria casa!',
    idle: 'Parado', agree: 'Concordar', dive: 'Cambalhota', heart_pose: 'Coração', flip: 'Estrelinha', angry_02: 'Caminhar',
  },
  en: {
    video: 'Record video', stopVideo: 'Stop recording', recording: 'Recording', videoStarting: 'Preparing recording...', videoProcessing: 'Preparing video...', videoPreview: 'Recorded video', saveVideo: 'Save video', videoError: 'Could not record the video. Please try again.', videoHint: 'Use Save video to download the recording to your phone.',
    loading: 'Loading...', actions: 'Opinho actions', closeActions: 'Close actions',
    tap: 'Tap the screen to place Opinho', photo: 'Take photo', reset: 'Reposition Opinho',
    front: 'Front camera', back: 'Rear camera', switching: 'Switching camera...',
    cameraError: 'Could not switch cameras. Please try again.', photoError: 'Could not take the photo. Please try again.',
    preview: 'Captured photo', image: 'Augmented reality photo with Opinho', save: 'Save photo', close: 'Back',
    saveHint: 'You can also touch and hold the image to save it on your phone.',
    prefix: 'Scan the QR code with your phone camera or visit', suffix: 'on your phone to meet Opinho in augmented reality.',
    description: 'Meet Opinho, the JGB Patinação Artística mascot, in your own home!',
    idle: 'Idle', agree: 'Agree', dive: 'Somersault', heart_pose: 'Heart', flip: 'Cartwheel', angry_02: 'Walk',
  },
  es: {
    video: 'Grabar vídeo', stopVideo: 'Detener grabación', recording: 'Grabando', videoStarting: 'Preparando grabación...', videoProcessing: 'Preparando vídeo...', videoPreview: 'Vídeo grabado', saveVideo: 'Guardar vídeo', videoError: 'No se pudo grabar el vídeo. Inténtalo de nuevo.', videoHint: 'Usa Guardar vídeo para descargar la grabación en tu teléfono.',
    loading: 'Cargando...', actions: 'Acciones de Opinho', closeActions: 'Cerrar acciones',
    tap: 'Toca la pantalla para colocar a Opinho', photo: 'Tomar foto', reset: 'Reposicionar a Opinho',
    front: 'Cámara frontal', back: 'Cámara trasera', switching: 'Cambiando de cámara...',
    cameraError: 'No se pudo cambiar de cámara. Inténtalo de nuevo.', photoError: 'No se pudo tomar la foto. Inténtalo de nuevo.',
    preview: 'Foto capturada', image: 'Foto con Opinho en realidad aumentada', save: 'Guardar foto', close: 'Volver',
    saveHint: 'También puedes mantener pulsada la imagen para guardarla en tu teléfono.',
    prefix: 'Escanea el código QR con la cámara del teléfono o visita', suffix: 'en tu teléfono para conocer a Opinho en realidad aumentada.',
    description: '¡Interactúa con Opinho, la mascota de JGB Patinação Artística, en tu propia casa!',
    idle: 'Quieto', agree: 'Asentir', dive: 'Voltereta', heart_pose: 'Corazón', flip: 'Rueda lateral', angry_02: 'Caminar',
  },
}

// Follow the preferred browser language, including regional variants; fall back to English.
const preferred = (navigator.languages?.[0] || navigator.language || 'en').split('-')[0].toLowerCase()
export const language = preferred in messages ? preferred as keyof typeof messages : 'en'
export const t = (key: keyof typeof messages.en) => messages[language][key]

export function localizePage() {
  document.documentElement.lang = language === 'pt' ? 'pt-BR' : language
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n as Parameters<typeof t>[0]) })
  for (const [id, key] of [['app-loading', 'loading'], ['animation-controls', 'actions'], ['photo-preview', 'preview'], ['video-preview', 'videoPreview']] as const) {
    document.getElementById(id)?.setAttribute('aria-label', t(key))
  }
  document.getElementById('photo-image')?.setAttribute('alt', t('image'))
  document.querySelectorAll('meta[name="description"], meta[itemprop="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach(el => el.setAttribute('content', t('description')))
}
