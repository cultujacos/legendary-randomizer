(() => {
  const APP_VERSION = '1.4.0';
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
  style.textContent = '#legendary-update:not([hidden]){position:fixed;z-index:9999;bottom:16px;left:16px;right:16px;max-width:620px;margin:0 auto;padding:14px 16px;border:1px solid #ff865b;border-radius:12px;background:#292235;color:#fff;box-shadow:0 10px 35px #0009;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font:14px/1.4 system-ui,sans-serif}#legendary-update span{flex:1;min-width:180px}#legendary-update button{background:#ff865b;color:#22141b;border:0;border-radius:7px;padding:10px 13px;font:700 14px system-ui,sans-serif;min-height:40px}#legendary-update #legendary-update-later{background:transparent;color:#eee;border:1px solid #766876}#legendary-version-panel{margin:14px auto 8px;padding:14px 18px;max-width:1250px;border-top:1px solid #353447;color:#b0b0c5;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;font:13px/1.5 system-ui,sans-serif}#legendary-version-panel button{color:#f5f0ed;border:1px solid #575065;background:#252438;border-radius:7px;min-height:42px;padding:9px 14px;font:600 13px system-ui,sans-serif}#legendary-version-status{flex-basis:100%;margin:0;color:#ffbd98}#legendary-version-panel button:disabled{opacity:.6}';
  style.textContent += '@media print{#legendary-update,#legendary-version-panel{display:none!important}}';
  document.head.appendChild(style);
  document.body.appendChild(updateBar);
  const versionPanel = document.createElement('section');
  versionPanel.id = 'legendary-version-panel';
  versionPanel.setAttribute('aria-label', 'Versión y actualizaciones');
  versionPanel.innerHTML = '<span>Legendary Randomizer · Versión en uso: <strong id="legendary-version-number"></strong></span><button type="button" id="legendary-check-updates">↻ Buscar actualizaciones</button><p id="legendary-version-status" role="status" aria-live="polite"></p>';
  versionPanel.querySelector('#legendary-version-number').textContent = APP_VERSION;
  document.body.appendChild(versionPanel);
  const status = versionPanel.querySelector('#legendary-version-status');
  const showUpdate = () => { if (!updating) updateBar.hidden = false; };
  updateBar.querySelector('#legendary-update-later').addEventListener('click', () => { updateBar.hidden = true; });

  async function checkForUpdates(registration) {
    if (!navigator.onLine) return 'offline';
    try {
      if (registration) await registration.update();
      if (registration?.waiting && navigator.serviceWorker.controller) {
        pendingUpdate = registration.waiting;
      }
      const response = await fetch('./version.json?check=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return 'error';
      const { version } = await response.json();
      if (version && version !== APP_VERSION) {
        showUpdate();
        return 'available';
      }
      if (version === APP_VERSION) {
        updateBar.hidden = true;
        return 'current';
      }
      return 'error';
    } catch (error) {
      // Sin conexión o fallo temporal: la aplicación sigue funcionando normalmente.
      console.info('La comprobación de actualizaciones no está disponible.', error);
      return 'error';
    }
  }

  versionPanel.querySelector('#legendary-check-updates').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    status.textContent = 'Buscando actualizaciones…';
    try {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      const result = await checkForUpdates(registration);
      status.textContent = ({
        available: 'Hay una nueva versión disponible. Pulsa «Actualizar ahora» en el aviso.',
        current: 'Ya tienes la última versión disponible.',
        offline: 'No hay conexión. Puedes seguir jugando sin Internet.',
        error: 'No se ha podido comprobar. Inténtalo más tarde.'
      })[result];
    } finally {
      button.disabled = false;
    }
  });

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
        const refresh = () => {
          if (!refreshed) { refreshed = true; window.location.reload(); }
        };
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          refresh();
        }, { once: true });
        worker.postMessage({ type: 'SKIP_WAITING' });
        // Algunos navegadores no notifican controllerchange a tiempo.
        window.setTimeout(refresh, 3000);
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
        }
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              pendingUpdate = installing;
              checkForUpdates(registration);
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
