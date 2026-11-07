import { transacao, pedido } from './index.js';
import { carimbar } from './util.js';

const STORE = 'lugares';

/** Todos os lugares, sem ordem garantida. */
export function listar() {
  return transacao(STORE, 'readonly', (tx) => pedido(tx.objectStore(STORE).getAll()));
}

/** Lugares de um status (`quero_ir` ou `ja_fui`). */
export function listarPorStatus(status) {
  return transacao(STORE, 'readonly', (tx) =>
    pedido(tx.objectStore(STORE).index('status').getAll(status)));
}

/** Um lugar pelo ID, ou `undefined` se não existir. */
export function obter(id) {
  return transacao(STORE, 'readonly', (tx) => pedido(tx.objectStore(STORE).get(id)));
}

/** Cria ou atualiza um lugar. Resolve com o registro gravado (com `id` e carimbos). */
export function salvar(lugar) {
  const registro = carimbar(lugar);
  return transacao(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).put(registro);
    return registro;
  });
}

/**
 * Exclui o lugar e todas as suas visitas na mesma transação (RN06).
 * Resolve com a quantidade de visitas excluídas.
 */
export function excluirComVisitas(id) {
  return transacao([STORE, 'visitas'], 'readwrite', async (tx) => {
    const visitas = tx.objectStore('visitas');
    const ids = await pedido(visitas.index('lugarId').getAllKeys(id));
    for (const idVisita of ids) visitas.delete(idVisita);
    tx.objectStore(STORE).delete(id);
    return ids.length;
  });
}
