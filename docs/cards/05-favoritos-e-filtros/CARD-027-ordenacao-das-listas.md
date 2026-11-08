---
id: CARD-027
titulo: "Ordenação das listas"
contexto: descoberta
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RF19, RN13, RN14, RN15, RN16]
depende_de: [CARD-008, CARD-015]
---

# CARD-027 — Ordenação das listas

## Contexto
Hoje cada aba da tela inicial tem uma ordem fixa (CARD-008): "Quero ir" pelo cadastro mais recente e "Já fui" pela última visita mais recente. Isso não ajuda a achar um lugar pelo nome nem a responder "qual é o melhor avaliado?" ou "onde não vou há tempos?". Este card deixa o usuário escolher a ordem de cada aba numa linha acima da lista (T1), com um painel de escolha única (T7). Cada aba lembra a sua escolha.

## O que fazer
- **Opções por aba (RN13).** Os rótulos da interface ficam em pt-BR e os códigos em inglês:

  | Aba | Código | Rótulo |
  | --- | --- | --- |
  | Quero ir | `created_desc` (padrão) | Adicionados mais recentes |
  | Quero ir | `created_asc` | Adicionados mais antigos |
  | Ambas | `name_asc` | A–Z |
  | Já fui | `last_visit_desc` (padrão) | Última visita mais recente |
  | Já fui | `last_visit_asc` | Última visita mais antiga |
  | Já fui | `rating_desc` | Maior nota |
  | Já fui | `visits_desc` | Mais visitados |

- **Serviço puro de ordenação**, em `js/services/lists.js` ou num novo `js/services/sorting.js`:
  - Exportar as opções de cada aba (código + rótulo), os padrões e `sortItems(items, sortKey)`, que devolve uma cópia ordenada de `{ place, summary }[]`.
  - `isValidSort(status, key)` / `normalizeSort(status, key)`: um código que não existe na aba volta ao padrão dela.
  - `buildHomeLists` passa a receber a ordem de cada aba. `sortWantToGo` e `sortBeenThere` são substituídas pelo novo serviço (ou viram atalhos para os padrões).
- **Regras de ordem:**
  - **RN14:** em `last_visit_*`, `rating_desc` e `visits_desc`, lugares sem visitas (`summary.visitCount === 0`) ficam sempre no fim, inclusive em `last_visit_asc`. Entre eles, os adicionados mais recentemente vêm primeiro. `rating_desc` compara `summary.average`, que já tem uma casa decimal.
  - **RN15 (desempate):** em visita, nota ou nº de visitas, vence a última visita mais recente e depois o nome A–Z. Em `created_*`, o nome A–Z. Em `name_asc`, o adicionado mais recentemente.
  - **Ordem alfabética:** `localeCompare(…, 'pt-BR', { sensitivity: 'base' })`, o mesmo padrão de `uniqueTags` em `js/services/places.js`.
- **Preferência salva (RN16):**
  - Fica em `meta.homeSort` como `{ want_to_go, been_there }`. O serviço expõe `getHomeSort()` (já normalizado, com os padrões quando a chave não existe) e `setHomeSort(status, key)`, usando `js/db/meta.js`, no mesmo padrão de `getLastExportAt` / `markExported` em `js/services/backup.js`.
  - Gravar ao escolher, sem esperar outra ação.
- **T1, em `js/ui/screens/home.js`:**
  - Linha "Ordenar: <rótulo> ▾" entre a barra de busca e os cards: um botão com texto, de 44 px de altura, com `aria-label` "Ordenar por: <rótulo>". Ela fica oculta quando a aba não tem cards para mostrar (estado vazio ou sem resultado).
  - A ordem é aplicada depois de `searchByName` e `applyFilters`.
  - Trocar de aba mostra a ordem salva daquela aba.
- **T7, painel "Ordenar por":**
  - Abre com `openBottomSheet()`, sem rodapé. Mostra a lista de escolha única (radio) com as opções da aba atual e a selecionada marcada.
  - Tocar numa opção grava a escolha, fecha o painel e reordena a lista. Fechar de outro jeito (X, toque fora, voltar do Android) não muda nada.
- **Filtros:** `countActiveFilters`, "Limpar" e "Limpar filtros" (CARD-015) continuam ignorando a ordem.

## Critérios de aceite
- [ ] Dado lugares em "Já fui" com última visita em 01/10, 15/10 e 01/11 e um lugar sem visitas, quando escolho "Última visita mais antiga", então a ordem é 01/10, 15/10, 01/11 e, no fim, o lugar sem visitas (RN14).
- [ ] Dado lugares em "Já fui" com médias 4,5, 3,0 e 4,5, quando escolho "Maior nota", então os dois com 4,5 vêm primeiro, desempatados pela última visita mais recente (RN15), e o lugar sem visitas fica no fim.
- [ ] Dado "Bar do Zé", "árvore" e "Boteco" em "Quero ir", quando escolho "A–Z", então a ordem é "árvore", "Bar do Zé", "Boteco": maiúsculas e acentos não interferem.
- [ ] Dado que escolhi "A–Z" em "Quero ir" e "Mais visitados" em "Já fui", quando fecho e reabro o app, então cada aba continua com a sua ordem e a linha "Ordenar" mostra o rótulo certo (RF19).
- [ ] "Quero ir" não oferece opções de visita, nota ou quantidade; "Já fui" não oferece "Adicionados…" (RN13).
- [ ] Dado busca e filtros ativos, quando troco a ordem, então a busca e os filtros continuam aplicados e o indicador de filtros não muda. "Limpar filtros" não volta a ordem ao padrão (RN16).
- [ ] Dado o painel aberto, quando aperto voltar no Android, então o painel fecha, a ordem não muda e continuo na tela inicial.
- [ ] Dado que `meta.homeSort` não existe ou tem um código inválido, então a aba usa o seu padrão, sem erro.
- [ ] Sem nenhuma escolha feita, a ordem padrão é igual à de hoje. A única diferença é o desempate de "Já fui" quando dois lugares têm a última visita no mesmo dia: agora vale o nome A–Z.
- [ ] Exportar backup não inclui `homeSort`, e "Apagar todos os dados" não o remove.
- [ ] Com 1.000 lugares, trocar a ordem leva menos de 200 ms (referência, RNF Performance).

## Notas técnicas
- A ordenação roda em memória sobre `{ place, summary }` (`js/services/summary.js` já fornece `average`, `lastVisit` e `visitCount`): não precisa de índice novo nem de migração. A chave nova em `meta` não muda o `schemaVersion`.
- `lastVisit` é `YYYY-MM-DD` e `createdAt` é ISO, então os dois podem ser comparados como string.
- Não colocar a ordem na URL: ela já fica salva em `meta` e é lida no `render()` junto com `loadHomeLists()`. Como a ordem fica em `meta`, voltar do detalhe mostra a mesma ordem.
- Se o painel usar os estilos `.toggle__input` / `.toggle-chip` de `css/app.css`, cada opção ocupa uma linha inteira, não um chip.
- `eraseAllData()` (CARD-026) só remove `lastExportAt`, e `createBackup()` só exporta `places` / `visits`. Por isso nenhum dos dois precisa mudar, mas os critérios acima confirmam esse comportamento.
- As funções puras podem ganhar testes com `node --test` (ex.: `js/services/sorting.test.js`).
- Subir `CACHE_VERSION` em `sw.js` no mesmo commit. Se criar `js/services/sorting.js`, adicioná-lo a `ASSETS`.

## Fora do escopo
- "Z–A", "Adicionados…" em "Já fui" e "Primeira visita mais antiga" (decisão do refinamento de 08/11/2026).
- Ordenar o histórico de visitas na T4, que continua do mais recente para o mais antigo.
- Ordem crescente/decrescente como controle separado: cada opção já define o sentido.

## Justificativa da complexidade
M: comparadores com regras de desempate e lugares sem visita, persistência em `meta` e um painel novo na tela inicial. Usa só componentes e camadas que já existem.
