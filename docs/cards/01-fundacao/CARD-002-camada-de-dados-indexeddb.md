---
id: CARD-002
titulo: "Camada de dados (IndexedDB)"
contexto: fundacao
tipo: dados
camadas: [banco]
complexidade: M
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RN06, RNF-armazenamento]
depende_de: [CARD-001]
---

# CARD-002 — Camada de dados (IndexedDB)

## Contexto
Toda a persistência vive no IndexedDB. Esta camada é o único ponto do app que conhece o banco; o resto chama funções que retornam Promises. É o que será reaproveitado tal como está na migração para React.

## O que fazer
- `js/db/index.js`: abrir o banco `diario-de-role` na versão 1 e, no `onupgradeneeded`, criar:
  - `places` (keyPath `id`) com índices `name`, `type`, `tags` (multiEntry) e `status` (para montar as abas). Sem índice em `favorite`: boolean não é chave válida no IndexedDB; o filtro roda em memória.
  - `visits` (keyPath `id`) com índices `placeId` e `date`
  - `meta` (keyPath `key`)
- Gravar `schemaVersion = 1` em `meta`.
- Repositórios:
  - `js/db/places.js`: `list()`, `listByStatus(status)`, `get(id)`, `save(place)`, `deleteWithVisits(id)` (transação em `places` + `visits`)
  - `js/db/visits.js`: `listAll()`, `listByPlace(placeId)`, `get(id)`, `save(visit)`, `remove(id)`
  - `js/db/meta.js`: `get(key)`, `set(key, value)`
- Helpers `transaction(stores, mode, fn)` e `bulkWrite(recordsByStore, { clearFirst })` para gravações em lote (usado pelo import, CARD-017).
- Pedir `navigator.storage.persist()` na primeira abertura e guardar o resultado em `meta` (`persistentStorage`).
- Utilitários: `newId()` com `crypto.randomUUID()` e carimbos `createdAt` / `updatedAt` em ISO.

## Critérios de aceite
- [ ] Dado o app aberto pela primeira vez, quando inspeciono Application > IndexedDB, então existem as stores `places`, `visits` e `meta` com os índices previstos.
- [ ] Dado um lugar com 3 visitas, quando chamo `deleteWithVisits`, então o lugar e as 3 visitas somem na mesma transação (RN06).
- [ ] Dado que uma gravação dentro de uma transação falha, então nenhuma alteração parcial fica salva.
- [ ] `meta` contém `schemaVersion = 1`.

## Notas técnicas
- O wrapper `idb` (~1 KB) é opcional; a API nativa também serve.
- Nada de regra de negócio aqui (validação, status, média): isso é `services/`.

## Fora do escopo
Regras de negócio e telas.

## Justificativa da complexidade
M: modelagem, índices, transações e tratamento de erro do IndexedDB.
