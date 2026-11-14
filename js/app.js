// App entry point: opens the database, registers the service worker and starts the router.

import { openDatabase, SchemaMismatchError } from './db/index.js';
import { requestPersistentStorage } from './db/persistence.js';
import { registerServiceWorker } from './sw-register.js';
import { route, replace, startRouter } from './router.js';
import { showUpdateBanner } from './ui/components/update-banner.js';

route('/', () => import('./ui/screens/home.js'));
route('/place/new', () => import('./ui/screens/place-form.js'));
route('/place/:id', () => import('./ui/screens/place-detail.js'));
route('/place/:id/edit', () => import('./ui/screens/place-form.js'));
route('/place/:placeId/visit/new', () => import('./ui/screens/visit-form.js'));
route('/visit/:id/edit', () => import('./ui/screens/visit-form.js'));
route('/settings', () => import('./ui/screens/settings.js'));
// Old route: redirects without a screen of its own, so #/backup never stays in the history.
route('/backup', async () => ({ render() { replace('/settings'); } }));

async function start() {
  registerServiceWorker({ onUpdate: showUpdateBanner })
    .catch((error) => console.warn('Service worker:', error));

  const root = document.getElementById('app');
  try {
    await openDatabase();
  } catch (error) {
    console.error(error);
    root.textContent = error instanceof SchemaMismatchError
      ? 'Os dados salvos neste navegador estão num formato antigo e incompatível. '
        + 'Apague os dados do site (DevTools → Application → Storage → Clear site data) e recarregue.'
      : 'Não foi possível abrir o banco de dados do app.';
    return;
  }
  requestPersistentStorage().catch((error) => console.warn('Persistent storage:', error));
  startRouter(root);
}

start();
