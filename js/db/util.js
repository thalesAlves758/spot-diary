/** Novo ID gerado no aparelho (UUID v4). */
export function novoId() {
  return crypto.randomUUID();
}

/** Data e hora atual em ISO 8601 (UTC). */
export function agoraISO() {
  return new Date().toISOString();
}

/**
 * Prepara um registro para gravar: gera `id` e `criadoEm` se faltarem e renova `atualizadoEm`.
 * Não altera o objeto recebido.
 */
export function carimbar(registro, agora = agoraISO()) {
  return {
    ...registro,
    id: registro.id ?? novoId(),
    criadoEm: registro.criadoEm ?? agora,
    atualizadoEm: agora,
  };
}
