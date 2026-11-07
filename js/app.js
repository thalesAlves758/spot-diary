// Ponto de entrada do app.
// Registro do service worker (CARD-003) e roteador (CARD-004) entram aqui.

import { abrirBanco } from './db/index.js';
import { pedirArmazenamentoPersistente } from './db/persistencia.js';

async function iniciar() {
  const raiz = document.getElementById('app');
  try {
    await abrirBanco();
  } catch (erro) {
    console.error(erro);
    raiz.textContent = 'Não foi possível abrir o banco de dados do app.';
    return;
  }
  pedirArmazenamentoPersistente().catch((erro) => console.warn('Armazenamento persistente:', erro));
  raiz.textContent = 'Diário de Rolê';
}

iniciar();
