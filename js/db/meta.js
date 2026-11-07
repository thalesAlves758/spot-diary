import { transacao, pedido } from './index.js';

// Pares chave/valor do app: `schemaVersion`, `ultimoExportEm`, `armazenamentoPersistente`.
const STORE = 'meta';

/** Valor de uma chave, ou `undefined` se não existir. */
export async function get(chave) {
  const registro = await transacao(STORE, 'readonly', (tx) => pedido(tx.objectStore(STORE).get(chave)));
  return registro?.valor;
}

export function set(chave, valor) {
  return transacao(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).put({ chave, valor });
  });
}
