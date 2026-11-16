import {localizePage, t} from './i18n'

localizePage()

const onxrloaded = () => {
  LandingPage.configure({
    mediaSrc: '',
    logoSrc: '',
    backgroundSrc: '',
    backgroundColor: '#000000',
    promptPrefix: t('prefix'),
    promptSuffix: t('suffix'),
    font: 'system-ui, sans-serif',
    url: window.location.href,
  })
  XR8.addCameraPipelineModule({
    name: 'opinho-camera-status',
    onStart: () => window.dispatchEvent(new Event('opinho-camera-ready')),
    onException: () => window.dispatchEvent(new Event('opinho-camera-error')),
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

