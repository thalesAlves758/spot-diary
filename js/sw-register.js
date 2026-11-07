/**
 * Registers the service worker and reports when a new version is waiting.
 * `onUpdate(apply)` is called with a function that activates the new version and reloads the page.
 */
export async function registerServiceWorker({ onUpdate }) {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.register('sw.js');
  let accepted = false;

  const notify = (worker) => onUpdate(() => {
    accepted = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
  });

  // Only an update if a previous version controls the page; on first install there is nothing to replace.
  if (registration.waiting && navigator.serviceWorker.controller) notify(registration.waiting);

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) notify(worker);
    });
  });

  // Reload once the new version takes over, but only when the user asked for it
  // (clients.claim() on first install also fires controllerchange).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (accepted) window.location.reload();
  });

  // An installed app can stay open in the background for days: check for updates when it comes back.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration.update().catch(() => {});
  });
}
