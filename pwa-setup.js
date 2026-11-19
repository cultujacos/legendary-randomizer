(() => {
  const APP_VERSION = '1.1.0';
  let pendingUpdate = null;
  let updating = false;

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

  const updateBar = document.createElement('aside');
  updateBar.id = 'legendary-update';
  updateBar.hidden = true;
  updateBar.setAttribute('role', 'status');
  updateBar.setAttribute('aria-live', 'polite');
  updateBar.innerHTML = '<span>✨ Hay una nueva versión de Legendary disponible.</span><button type="button" id="legendary-update-now">Actualizar ahora</button><button type="button" id="legendary-update-later" aria-label="Cerrar aviso de actualización">Ahora no</button>';
  const style = document.createElement('style');
  style.textContent = '#legendary-update:not([hidden]){position:fixed;z-index:9999;bottom:16px;left:16px;right:16px;max-width:620px;margin:0 auto;padding:14px 16px;border:1px solid #ff865b;border-radius:12px;background:#292235;color:#fff;box-shadow:0 10px 35px #0009;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font:14px/1.4 system-ui,sans-serif}#legendary-update span{flex:1;min-width:180px}#legendary-update button{background:#ff865b;color:#22141b;border:0;border-radius:7px;padding:10px 13px;font:700 14px system-ui,sans-serif;min-height:40px}#legendary-update #legendary-update-later{background:transparent;color:#eee;border:1px solid #766876}';
  document.head.appendChild(style);
  document.body.appendChild(updateBar);
  const showUpdate = () => { if (!updating) updateBar.hidden = false; };
  updateBar.querySelector('#legendary-update-later').addEventListener('click', () => { updateBar.hidden = true; });

  async function checkForUpdates(registration) {
    if (!navigator.onLine) return;
    try {
      if (registration) await registration.update();
      if (registration?.waiting && navigator.serviceWorker.controller) {
        pendingUpdate = registration.waiting;
        showUpdate();
      }
      const response = await fetch('./version.json?check=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return;
      const { version } = await response.json();
      if (version && version !== APP_VERSION) showUpdate();
    } catch (error) {
      // Sin conexión o fallo temporal: la aplicación sigue funcionando normalmente.
      console.info('La comprobación de actualizaciones no está disponible.', error);
    }
  }

  updateBar.querySelector('#legendary-update-now').addEventListener('click', async () => {
    if (updating) return;
    updating = true;
    const button = updateBar.querySelector('#legendary-update-now');
    button.disabled = true;
    button.textContent = 'Actualizando…';
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) await registration.update();
      const worker = registration?.waiting || pendingUpdate;
      if (worker) {
        let refreshed = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshed) { refreshed = true; window.location.reload(); }
        }, { once: true });
        worker.postMessage({ type: 'SKIP_WAITING' });
        return;
      }
      window.location.reload();
    } catch (error) {
      updating = false;
      button.disabled = false;
      button.textContent = 'Actualizar ahora';
      console.warn('Error al actualizar Legendary:', error);
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js');
        if (registration.waiting && navigator.serviceWorker.controller) {
          pendingUpdate = registration.waiting;
          showUpdate();
        }
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              pendingUpdate = installing;
              showUpdate();
            }
          });
        });
        await checkForUpdates(registration);
        window.addEventListener('online', () => checkForUpdates(registration));
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) checkForUpdates(registration);
        });
      } catch (error) {
        console.warn('No se pudo activar el modo sin conexión:', error);
      }
    });
  }
})();
