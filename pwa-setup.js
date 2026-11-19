(() => {
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = './manifest.webmanifest';
  document.head.appendChild(manifest);

  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.content = '#10111c';

  const apple = document.createElement('link');
  apple.rel = 'apple-touch-icon';
  apple.href = './icon-192.png';
  document.head.appendChild(apple);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(error => {
        console.warn('No se pudo activar el modo sin conexión:', error);
      });
    });
  }
})();
