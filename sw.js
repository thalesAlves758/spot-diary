// Service worker: precaches the app files so it works 100% offline after the first load.
// User data never goes through here; it lives in IndexedDB.
//
// On every deploy: bump CACHE_VERSION, otherwise installed apps never receive the update.
// Every new app file must be added to ASSETS, otherwise it breaks offline mode.

const CACHE_PREFIX = 'diario-';
const CACHE_VERSION = 'diario-v2';

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/router.js',
  'js/sw-register.js',
  'js/db/index.js',
  'js/db/meta.js',
  'js/db/persistence.js',
  'js/db/places.js',
  'js/db/util.js',
  'js/db/visits.js',
  'js/services/backup-import.js',
  'js/services/backup.js',
  'js/services/data-reset.js',
  'js/services/dates.js',
  'js/services/errors.js',
  'js/services/filters.js',
  'js/services/lists.js',
  'js/services/places.js',
  'js/services/summary.js',
  'js/services/visits.js',
  'js/ui/dom.js',
  'js/ui/format.js',
  'js/ui/icons.js',
  'js/ui/components/backup-reminder.js',
  'js/ui/components/bottom-sheet.js',
  'js/ui/components/confirm-dialog.js',
  'js/ui/components/empty-state.js',
  'js/ui/components/favorite-button.js',
  'js/ui/components/header.js',
  'js/ui/components/stars.js',
  'js/ui/components/tag-input.js',
  'js/ui/components/toast.js',
  'js/ui/components/update-banner.js',
  'js/ui/screens/backup.js',
  'js/ui/screens/home.js',
  'js/ui/screens/place-detail.js',
  'js/ui/screens/place-form.js',
  'js/ui/screens/visit-form.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  // `cache: 'reload'` skips the HTTP cache so a new version never precaches stale files.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))),
  );
  // No skipWaiting here: the new version waits until the user accepts the update banner.
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // Routes are hash-based, so every navigation is the single page.
    const cached = request.mode === 'navigate'
      ? await cache.match('index.html')
      : await cache.match(request, { ignoreSearch: true });
    return cached ?? fetch(request);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
