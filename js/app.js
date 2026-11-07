// App entry point.
// Service worker registration (CARD-003) and router (CARD-004) go here.

import { openDatabase } from './db/index.js';
import { requestPersistentStorage } from './db/persistence.js';

async function start() {
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
