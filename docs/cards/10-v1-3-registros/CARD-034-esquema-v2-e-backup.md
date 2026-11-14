---
id: CARD-034
titulo: "Esquema v2: campos novos e backup versão 2"
contexto: registros
tipo: dados
camadas: [banco, front]
complexidade: M
prioridade: mvp
incerteza: media
modelo_sugerido: opus
status: todo
requisitos: [RN23, RN24, RN25, RN29, RN30]
depende_de: [CARD-032, CARD-033]
---

# CARD-034 — Esquema v2: campos novos e backup versão 2

## Contexto
A release v1.3 enriquece os registros:
- **no lugar:** faixa de preço, "Indicado por" e link;
- **na visita:** "Com quem" e "Pedidos / destaques".

A v1.4 traz as tags fixadas, que também entram no backup. Antes das telas (CARD-035 a CARD-037), o esquema dos dados e o formato do backup precisam aceitar esses campos, sem perder os dados de quem já usa o app e continuando a importar os backups antigos (versão 1).

## Objetivo
Subir o esquema para a versão 2 e criar as regras puras de validação e normalização dos campos novos e da lista de pessoas. O backup passa a exportar e importar a versão 2 (com `pinnedTags`), continuando a aceitar a versão 1.

## Detalhamento técnico
- **`js/db/index.js`:**
  - `SCHEMA_VERSION = 2`, com a migração `2() { /* v2: optional fields on places/visits and meta.pinnedTags; no store or index changes */ }`.
  - Os registros antigos **não** são reescritos.
  - Confira que o `onupgradeneeded` grava `meta.schemaVersion = 2` e que um banco v1 abre sem erro e sem perder dados.
- **`js/services/places.js`** (só funções puras novas; `validatePlace` fica para os CARD-035 e CARD-036):
  - `export const PRICE_LEVELS = [1, 2, 3, 4];`
  - `normalizePriceLevel(value)`: devolve um inteiro de 1 a 4 (aceitando também `'2'`) ou `null` para vazio, `undefined` ou `null`. Qualquer outro valor também devolve `null`, e quem chama decide se é erro; para isso, exporte também `isValidPriceLevel(value)`.
  - `normalizeLink(text)`: segue a RN25 e devolve `{ value, error }`.
    - `trim`. Vazio devolve `{ value: null, error: null }`.
    - `@perfil` devolve `https://instagram.com/perfil`.
    - Sem `http://` ou `https://`, prefixa `https://`.
    - Depois valida com `new URL()`: o protocolo precisa ser `http:` ou `https:` e o host precisa ter um ponto. Caso contrário, devolve `{ value: null, error: 'Link inválido' }`.
    - Não pode ter espaços.
- **`js/services/people.js` (novo):** a lista de pessoas da RN24, no mesmo espírito das tags em `places.js`.
  - `personKey(name)`: `trim` + minúsculas.
  - `cleanPeople(list)`: remove vazios e repetidos (pela chave) e mantém a primeira grafia.
  - `uniquePeople(places, visits)`: os nomes de `place.recommendedBy` e `visit.companions`, sem repetição, em ordem alfabética pt-BR.
  - `normalizePerson(name, existing)`: devolve a grafia já existente quando a chave bate ("dona" com "Dona" existente vira "Dona").
  - `suggestPeople(query, existing, selected = [], limit = 6)`: igual a `suggestTags` (nomes que começam com o texto, ignorando maiúsculas, fora os já escolhidos).
  - `async listPeople()`: carrega lugares e visitas e devolve `uniquePeople`.
- **`js/services/pinned-tags.js` (novo):** base para o CARD-040, usada aqui pelo backup.
  - `async getPinnedTags()` e `async setPinnedTags(list)`, sobre `meta.pinnedTags`.
  - `cleanPinnedTags(list)`: remove vazios e repetidos, ignorando maiúsculas.
  - `mergePinnedTags(current, incoming)`: a união, mantendo a grafia de `current`.
- **`js/services/backup.js`:**
  - `createBackup(places, visits, exportedAt, pinnedTags = [])` inclui `pinnedTags` no JSON.
  - `buildBackup()` lê os `pinnedTags` com `getPinnedTags()`.
  - `schemaVersion` sai de `SCHEMA_VERSION`, que agora vale 2.
- **`js/services/backup-import.js`:**
  - **`migrateBackup`:** de v1 para v2, acrescenta `pinnedTags: []`. Os campos novos ausentes ficam vazios.
  - **`validatePlace` do import:**
    - aceita `priceLevel` (ausente, `null` ou 1–4; outro valor é o problema "faixa de preço inválida");
    - aceita `recommendedBy` (string ou `null`);
    - aceita `link` (string normalizada com `normalizeLink`; erro é o problema "link inválido");
    - devolve esses campos normalizados (`null` quando vazios).
  - **`validateVisit` do import:**
    - aceita `companions` (array de strings, limpo com `cleanPeople`; outro formato é "com quem inválido");
    - aceita `highlights` (string; vazia vira `null`; outro tipo é "destaques inválidos").
  - **`parseBackup`:** valida que `pinnedTags`, se existir, é um array de strings e o devolve limpo.
  - **`planReplace` e `planMerge`:** carregam `pinnedTags`. "Substituir" usa a lista do arquivo; "mesclar" usa `mergePinnedTags(atual, arquivo)`.
  - **`importBackup`:** grava `meta.pinnedTags` **na mesma transação** de lugares e visitas.
    - Atenção: `bulkWrite(..., { clearFirst: true })` limpa **todas** as stores recebidas. Não passe `meta` com `clearFirst`, para não apagar `schemaVersion`, `lastExportAt`, `homeSort` e `theme`.
    - Grave só o registro `{ key: 'pinnedTags', value }`. Se preciso, estenda `bulkWrite` para limpar só as stores indicadas, sem mudar o comportamento atual para `places` e `visits`.
- **`sw.js`:** adicione `js/services/people.js` e `js/services/pinned-tags.js` em `ASSETS`. Não mexa na versão.

## Critérios de aceite
- [ ] Depois de atualizar o app, todos os lugares e visitas que já existiam continuam lá, sem mudança.
- [ ] Um backup exportado depois deste card tem `"schemaVersion": 2` e `"pinnedTags": []`.
- [ ] Um backup antigo (versão 1, exportado antes deste card) é importado com "Mesclar" e com "Substituir tudo" sem erro.
- [ ] Um backup versão 2 com `priceLevel`, `recommendedBy`, `link`, `companions` e `highlights` é importado, e reexportar mostra os mesmos valores.
- [ ] Um backup com `"link": "não é um link"` ou `"priceLevel": 7` é recusado, com a mensagem do problema, e nada muda nos dados.
- [ ] Importar com "Substituir tudo" não apaga o tema escolhido, a ordem das abas nem a data do último backup.

## Como testar
**Validação manual (usuário)**
1. Antes de atualizar, exporte um backup (ele será v1). Atualize o app e confira as listas (critério 1).
2. Exporte de novo e abra o JSON (critério 2).
3. Importe o backup v1 com "Mesclar" e depois com "Substituir tudo" (critério 3).
4. Edite o JSON exportado, acrescente os campos novos num lugar e numa visita, importe com "Substituir tudo" e reexporte (critério 4).
5. Coloque um link inválido e um preço 7 no JSON e tente importar (critério 5).
6. Escolha o tema escuro e outra ordem numa aba, importe com "Substituir tudo" e confira que continuam (critério 6).

**Testes automatizados (quem implementa)**
- `js/services/places.test.js`: `normalizePriceLevel` e `isValidPriceLevel`; `normalizeLink`:
  - `instagram.com/bar` vira `https://instagram.com/bar`;
  - `@bar` vira o link do Instagram;
  - `http://x.com` continua igual;
  - vazio vira `null`;
  - `texto qualquer`, `ftp://x.com` e `https://semponto` são erro.
- `js/services/people.test.js`: `cleanPeople`, `uniquePeople`, `normalizePerson` e `suggestPeople`.
- `js/services/pinned-tags.test.js`: `cleanPinnedTags` e `mergePinnedTags`.
- `js/services/backup-import.test.js`:
  - `parseBackup` aceita v1 (com `pinnedTags` vazio) e v2 com os campos novos;
  - recusa link e preço inválidos, `companions` que não é array e versão 3;
  - `planReplace` e `planMerge` montam `pinnedTags` corretamente.
- Comando: `node --test`.

## Observações
- Os campos novos são opcionais. Os registros gravados antes da v2 simplesmente não os têm, e quem lê trata ausente como vazio (`null` ou `[]`).
- Um app ainda na versão 1 recusa um backup v2 ("veio de uma versão mais nova"). Isso é esperado (RN30).

## Pendências
- [CARD-032 — Abrir no Maps e compartilhar lugar](../09-v1-2-sair-de-casa/CARD-032-maps-e-compartilhar-lugar.md) e [CARD-033 — Sortear e atalhos](../09-v1-2-sair-de-casa/CARD-033-sortear-e-atalhos.md): fecham a release v1.2. Este card abre a v1.3.

## Justificativa da complexidade e do modelo
- **Complexidade M:** migração de esquema, validação do import e várias funções puras, sem telas.
- **Modelo opus:** migração de esquema do banco e formato do backup (área de risco: um erro perde dados do usuário ou quebra o restore).

## Fora do escopo
- Campos novos nos formulários, no detalhe, no card e nos filtros (CARD-035, CARD-036, CARD-037).
- A interface das tags fixadas (CARD-040).
- Mudar `validatePlace` / `validateVisit` dos formulários.

## Referências
- RN23, RN24, RN25, RN29, RN30 — `docs/refinamento.md`, seção "Regras de negócio"
- "Modelo de dados" (campos novos, migração v2, formato do backup v2) — `docs/refinamento.md`
- `js/db/index.js`, `js/services/backup.js`, `js/services/backup-import.js`, `js/services/places.js` (`suggestTags`, `normalizeTag`), `js/db/meta.js`
