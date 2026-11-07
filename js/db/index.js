// Único ponto do app que conhece o IndexedDB.
// Abre o banco, cria stores e índices, roda migrações e oferece helpers de transação.

const DB_NOME = 'diario-de-role';

/** Versão do esquema: é a versão do banco no IndexedDB e a gravada em `meta` e no backup. */
export const SCHEMA_VERSION = 1;

/**
 * Migrações por versão. Cada entrada leva o banco da versão anterior até a sua.
 * Para mudar o esquema: aumente SCHEMA_VERSION e adicione a entrada nova aqui; nunca altere as antigas.
 */
const migracoes = {
  1(db) {
    const lugares = db.createObjectStore('lugares', { keyPath: 'id' });
    lugares.createIndex('nome', 'nome');
    lugares.createIndex('tipo', 'tipo');
    lugares.createIndex('tags', 'tags', { multiEntry: true });
    lugares.createIndex('status', 'status');
    // Sem índice em `favorito`: boolean não é chave válida no IndexedDB, então o índice ficaria
    // sempre vazio. O filtro de favoritos roda em memória (services/).

    const visitas = db.createObjectStore('visitas', { keyPath: 'id' });
    visitas.createIndex('lugarId', 'lugarId');
    visitas.createIndex('data', 'data');

    db.createObjectStore('meta', { keyPath: 'chave' });
  },
};

let conexao = null;

/** Abre (uma vez só) a conexão com o banco. */
export function abrirBanco() {
  conexao ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOME, SCHEMA_VERSION);

    req.onupgradeneeded = (evento) => {
      const db = req.result;
      for (let v = evento.oldVersion + 1; v <= SCHEMA_VERSION; v++) {
        migracoes[v](db, req.transaction);
      }
      req.transaction.objectStore('meta').put({ chave: 'schemaVersion', valor: SCHEMA_VERSION });
    };

    req.onsuccess = () => {
      const db = req.result;
      // Outra aba abriu uma versão mais nova: fecha esta conexão para não travar a migração.
      db.onversionchange = () => {
        db.close();
        conexao = null;
      };
      resolve(db);
    };

    req.onerror = () => {
      conexao = null;
      reject(req.error);
    };

    req.onblocked = () => {
      console.warn('Banco bloqueado por outra aba com versão antiga aberta; aguardando ela fechar.');
    };
  });
  return conexao;
}

/** Transforma um IDBRequest em Promise. */
export function pedido(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Roda `fn(tx)` numa transação e resolve com o retorno de `fn` só depois do commit.
 * Se `fn` lançar erro ou qualquer pedido falhar, a transação inteira é desfeita.
 *
 * Dentro de `fn`, só use `await` em pedidos do próprio IndexedDB (via `pedido`):
 * esperar outra coisa (fetch, timers) deixa a transação fechar sozinha.
 */
export async function transacao(stores, modo, fn) {
  const db = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, modo);
    let resultado;
    let falhou = false;

    tx.oncomplete = () => resolve(resultado);
    tx.onabort = () => {
      if (!falhou) reject(tx.error ?? new DOMException('Transação abortada', 'AbortError'));
    };

    const abortarCom = (erro) => {
      falhou = true;
      try { tx.abort(); } catch { /* já finalizada */ }
      reject(erro);
    };

    try {
      Promise.resolve(fn(tx)).then((r) => { resultado = r; }, abortarCom);
    } catch (erro) {
      abortarCom(erro);
    }
  });
}

/**
 * Grava vários registros em uma única transação, sem alterar carimbos (usado pelo import).
 * `registrosPorStore`: ex. `{ lugares: [...], visitas: [...] }`.
 * Com `limparAntes`, esvazia essas stores antes de gravar. Tudo ou nada.
 */
export function gravarEmLote(registrosPorStore, { limparAntes = false } = {}) {
  const stores = Object.keys(registrosPorStore);
  return transacao(stores, 'readwrite', (tx) => {
    for (const nome of stores) {
      const store = tx.objectStore(nome);
      if (limparAntes) store.clear();
      for (const registro of registrosPorStore[nome]) store.put(registro);
    }
  });
}
