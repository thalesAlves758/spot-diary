import * as meta from './meta.js';

/**
 * Pede armazenamento persistente para o navegador não apagar o banco sob pressão de espaço.
 * O Chrome decide sozinho (costuma aceitar quando o app está instalado), então pedir a cada
 * abertura é inofensivo e aumenta a chance de conseguir. Grava o resultado em `meta`.
 */
export async function pedirArmazenamentoPersistente() {
  if (!navigator.storage?.persist) return false;
  const persistente = (await navigator.storage.persisted()) || (await navigator.storage.persist());
  await meta.set('armazenamentoPersistente', persistente);
  return persistente;
}
