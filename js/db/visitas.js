import { transacao, pedido } from './index.js';
import { carimbar } from './util.js';

const STORE = 'visitas';

/** Todas as visitas, sem ordem garantida. */
export function listarTodas() {
  return transacao(STORE, 'readonly', (tx) => pedido(tx.objectStore(STORE).getAll()));
}

/** Visitas de um lugar, sem ordem garantida. */
export function listarPorLugar(lugarId) {
  return transacao(STORE, 'readonly', (tx) =>
    pedido(tx.objectStore(STORE).index('lugarId').getAll(lugarId)));
}

/** Uma visita pelo ID, ou `undefined` se não existir. */
export function obter(id) {
  return transacao(STORE, 'readonly', (tx) => pedido(tx.objectStore(STORE).get(id)));
}

/** Cria ou atualiza uma visita. Resolve com o registro gravado (com `id` e carimbos). */
export function salvar(visita) {
  const registro = carimbar(visita);
  return transacao(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).put(registro);
    return registro;
  });
}

/** Exclui uma visita. */
export function excluir(id) {
  return transacao(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).delete(id);
  });
}
