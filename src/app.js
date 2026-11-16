const onxrloaded = () => {
  LandingPage.configure({
    mediaSrc: '',
    logoSrc: '',
    backgroundSrc: '',
    backgroundColor: '#000000',
    promptPrefix: 'Escaneie o QR Code com a câmera do celular ou acesse',
    promptSuffix: 'no celular para abrir o Opinho em realidade aumentada.',
    font: 'system-ui, sans-serif',
    url: window.location.href,
  })
  const landingPage = LandingPage.pipelineModule()
  XR8.addCameraPipelineModule({
    ...landingPage,
    onException: (error) => {
      // Unsupported devices never emit REALITY_READY; reveal the QR page instead.
      const loadingScreen = document.getElementById('app-loading')
      if (loadingScreen) loadingScreen.hidden = true
      landingPage.onException(error)
    },
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

