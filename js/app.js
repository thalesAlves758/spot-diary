// App entry point. The router (CARD-004) goes here.

import { openDatabase } from './db/index.js';
import { requestPersistentStorage } from './db/persistence.js';
import { registerServiceWorker } from './sw-register.js';
import { showUpdateBanner } from './ui/components/update-banner.js';

async function start() {
  registerServiceWorker({ onUpdate: showUpdateBanner })
    .catch((error) => console.warn('Service worker:', error));

  const root = document.getElementById('app');
  try {
    await openDatabase();
  } catch (error) {
    console.error(error);
    root.textContent = 'Não foi possível abrir o banco de dados do app.';
    return;
  }
  requestPersistentStorage().catch((error) => console.warn('Persistent storage:', error));
  root.textContent = 'Diário de Rolê';
}

start();
