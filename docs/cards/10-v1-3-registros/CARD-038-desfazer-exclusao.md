---
id: CARD-038
titulo: "Desfazer exclusão de visita e de lugar"
contexto: registros
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: mvp
incerteza: media
modelo_sugerido: sonnet
status: todo
requisitos: [RF31, RF03, RF05, RN27, RN06, RN04]
depende_de: [CARD-037]
---

# CARD-038 — Desfazer exclusão de visita e de lugar

## Contexto
Hoje excluir uma visita ou um lugar pede confirmação e não tem volta. Para visitas, a confirmação é atrito demais. Um aviso "Desfazer" protege melhor do toque errado e é mais rápido. Para lugares, que levam as visitas junto (RN06), a confirmação continua, e o desfazer passa a existir também.

## Objetivo
- **Excluir visita:** passa a ser sem confirmação, com o aviso "Visita excluída · Desfazer" por 6 segundos.
- **Excluir lugar:** mantém a confirmação e ganha o aviso "Lugar excluído · Desfazer".
- **Desfazer:** devolve exatamente o que foi excluído.

## Detalhamento técnico
- **`js/ui/components/toast.js`:**
  - `showToast(message, { duration = 2500, action = null } = {})`, com `action = { label, onClick }`, mostra um botão no toast (área de toque de 44 px). Tocar no botão chama `onClick` e fecha o toast.
  - Devolve `{ dismiss() }`.
  - Só um toast com ação por vez: um toast com ação novo fecha o anterior. A exclusão anterior fica definitiva, porque ela já foi feita.
  - Mantenha `role="status"` / `aria-live` na região. O botão não pode roubar o foco.
- **`js/services/visits.js`:**
  - `async deleteVisitWithUndo(id)`: lê a visita, exclui (`visitsDb.remove`) e devolve `{ restore }`.
  - `restore()` regrava a visita **exatamente** como estava, com o mesmo `id`, as mesmas datas e os mesmos campos, usando `bulkWrite({ visits: [visit] })` de `js/db/index.js`, que grava sem carimbar. O status do lugar não muda (RN04).
- **`js/services/places.js`:**
  - `async deletePlaceWithUndo(id)`: lê o lugar e as visitas dele, exclui com `deletePlace(id)` (cascata, RN06) e devolve `{ visitCount, restore }`.
  - `restore()` regrava o lugar e todas as visitas **numa única transação**: `bulkWrite({ places: [place], visits })`.
  - Se, nesse meio-tempo, outro lugar com o mesmo nome tiver sido criado (RN10), `restore` lança um erro, e a tela mostra "Não foi possível desfazer.".
- **`js/router.js`:** `export function rerender() { render(); }`, para redesenhar a tela atual depois de um desfazer.
- **`js/ui/screens/visit-form.js`, excluir visita:**
  - Tire o `confirmDialog`.
  - Fluxo: `const { restore } = await deleteVisitWithUndo(id)` → `await returnTo(placePath)` → toast "Visita excluída" com `duration: 6000` e a ação "Desfazer".
  - "Desfazer" chama `await restore()`, depois `rerender()` (o detalhe mostra a visita de volta) e o toast "Visita restaurada". Num erro, o toast "Não foi possível desfazer.".
- **`js/ui/screens/place-form.js`, excluir lugar:**
  - Mantenha o `confirmDialog` atual, com a contagem de visitas.
  - Fluxo: `deletePlaceWithUndo(id)` → `await resetTo('/')` → toast "Lugar excluído" com `duration: 6000` e a ação "Desfazer".
  - "Desfazer" chama `await restore()`, depois `rerender()` (a tela inicial mostra o lugar de novo, e você **continua** na tela inicial) e o toast "Lugar restaurado".
- **"Apagar todos os dados"** (Configurações) não muda e continua sem desfazer.
- **`css/app.css`:** o estilo do botão de ação dentro do toast, com variáveis de cor e legível nos dois temas.

## Critérios de aceite
- [ ] Excluir uma visita (no formulário de edição) não pede mais confirmação. O app volta para o detalhe e mostra "Visita excluída · Desfazer".
- [ ] Tocar em "Desfazer" em até 6 segundos traz a visita de volta ao histórico, com a mesma data, nota, "voltaria", pessoas, destaques e comentário, e a média volta a ser a de antes.
- [ ] Sem tocar em "Desfazer", o aviso some depois de cerca de 6 segundos e a exclusão fica definitiva.
- [ ] Excluir um lugar continua pedindo confirmação. Depois de confirmar, o app vai para a tela inicial e mostra "Lugar excluído · Desfazer".
- [ ] Dado um lugar com 2 visitas, quando confirmo a exclusão e toco em "Desfazer", o lugar volta na mesma aba, com as 2 visitas e os mesmos dados, e eu continuo na tela inicial.
- [ ] Ao excluir uma segunda coisa enquanto o primeiro aviso ainda aparece, só o último aviso fica na tela, e a primeira exclusão fica definitiva.
- [ ] Excluir a última visita de um lugar e desfazer não muda o status do lugar.
- [ ] "Apagar todos os dados" continua com a confirmação em dois passos e sem desfazer.
- [ ] O aviso e o botão "Desfazer" ficam legíveis no tema claro e no escuro, e o botão é fácil de tocar no celular.

## Como testar
**Validação manual (usuário)**
1. Abra uma visita com pessoas, destaques e comentário, toque em "Excluir visita" e depois em "Desfazer". Compare o histórico e a média (critérios 1 e 2).
2. Exclua outra visita e espere o aviso sumir. Recarregue o app e confirme que ela não volta (critério 3).
3. Exclua um lugar com 2 visitas, confirme e toque em "Desfazer" (critérios 4 e 5).
4. Exclua uma visita e, com o aviso na tela, exclua outra (critério 6).
5. Num lugar "Já fui" com 1 visita, exclua-a e desfaça, e depois exclua sem desfazer: o lugar continua em "Já fui" (critério 7).
6. Em Configurações, toque em "Apagar todos os dados" e cancele (critério 8).
7. Repita o passo 1 no tema escuro, no modo celular do DevTools (critério 9).

**Testes automatizados (quem implementa)**
- A exclusão e a restauração dependem do IndexedDB, que não existe no Node sem bibliotecas, então não há teste unitário dessa parte. Verifique no Chrome headless que, depois de `deletePlaceWithUndo` e `restore`, as stores têm os mesmos registros de antes (comparando o JSON).
- `node --test` continua verde.

## Observações
- O desfazer guarda a cópia só na memória. Se o app for fechado nos 6 segundos, a exclusão fica definitiva (RN27), o que já é o comportamento de hoje.
- **Alternativa descartada:** exclusão "lógica", com uma marca de excluído no registro. Ela mudaria o modelo de dados e o backup sem necessidade.

## Pendências
- [CARD-037 — Com quem e destaques](CARD-037-com-quem-e-destaques.md). Os dois editam `js/ui/screens/visit-form.js`, por isso rodam em sequência.

## Justificativa da complexidade e do modelo
- **Complexidade M:** toast com ação, duas funções de restauração transacional, um helper no router e a mudança nos dois fluxos de exclusão.
- **Modelo sonnet:** funcionalidade típica. A incerteza média vem da navegação depois de excluir (`returnTo` / `resetTo` + `rerender`), coberta pelos critérios. Não é migração nem área de risco.

## Fora do escopo
- Lixeira ou desfazer depois de os 6 segundos passarem.
- Desfazer edições ou "Apagar todos os dados".

## Referências
- RF31, RF03, RF05, RN27, RN06, RN04 e o Fluxo 8 — `docs/refinamento.md`
- `js/ui/components/toast.js`, `js/router.js`, `js/services/visits.js`, `js/services/places.js`, `js/db/index.js` (`bulkWrite`), `js/ui/screens/visit-form.js`, `js/ui/screens/place-form.js`
