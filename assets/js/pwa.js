/* ============================================================================
 *  ANIS OS — PWA bootstrap
 * ----------------------------------------------------------------------------
 *  Registers the service worker, surfaces update/install prompts through the
 *  Interaction Engine's toast system, and reports online/offline transitions.
 *  Load AFTER interaction.js so `window.ANIS_OS_INTERACTIONS.notify` exists.
 * ========================================================================== */
'use strict';

(function (window, document) {
  'use strict';

  const notify = (type, title, message, opts) =>
    window.ANIS_OS_INTERACTIONS ? window.ANIS_OS_INTERACTIONS.notify(type, title, message, opts) : null;

  let deferredPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          // Check for a fresh build on every visit.
          reg.update();

          // Update notification while the new worker is still waiting.
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                notify('info', 'Update available', 'A new version of ANIS OS is ready — refresh to apply.', { duration: 9000 });
              }
            });
          });
        })
        .catch(() => { /* SW unsupported / blocked — graceful degradation */ });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATE') {
        notify('info', 'ANIS OS updated', 'Fresh build installed.', { duration: 5000 });
      }
    });
  }

  /* Install prompt — Chrome/Edge fire this when the site is installable. */
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify('info', 'Install ANIS OS', 'Add this experience to your home screen.', { duration: 7000 });
  });

  window.addEventListener('appinstalled', () => {
    notify('success', 'Installed', 'ANIS OS is now available as an app.');
  });

  /* Online / offline awareness. */
  const goOnline = () => notify('success', 'Back online', 'Network connection restored.');
  const goOffline = () => notify('warning', 'Offline mode', 'You are offline — cached content is still available.');
  window.addEventListener('online', goOnline);
  window.addEventListener('offline', goOffline);

  window.ANIS_OS_PWA = Object.freeze({
    install: async () => {
      if (!deferredPrompt) return false;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      return true;
    },
    update: () =>
      navigator.serviceWorker && navigator.serviceWorker.getRegistration().then((reg) => reg && reg.update()),
  });
})(window, document);
