---
id: CARD-035
titulo: "Faixa de preço no lugar"
contexto: registros
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: todo
requisitos: [RF28, RF10, RN23, RN21]
depende_de: [CARD-034]
---

# CARD-035 — Faixa de preço no lugar

## Contexto
Na hora de escolher onde ir, quanto vai custar pesa tanto quanto a nota. Hoje o lugar não tem essa informação. O CARD-034 já preparou o campo `place.priceLevel` (inteiro de 1 a 4, opcional) e as funções `PRICE_LEVELS`, `normalizePriceLevel` e `isValidPriceLevel` em `js/services/places.js`.

## Objetivo
Informar a faixa de preço ($ a $$$$) no cadastro do lugar, exibi-la no card e no detalhe e filtrar por ela no painel de filtros.

## Detalhamento técnico
- **`js/services/places.js`, `validatePlace`:**
  - Normaliza `data.priceLevel` com `normalizePriceLevel`.
  - Valor presente e inválido gera `errors.priceLevel = 'Faixa de preço inválida'`.
  - `value.priceLevel` é sempre definido (`null` quando vazio), para que limpar o campo na edição apague o valor (`updatePlace` faz `{ ...place, ...value }`).
- **`js/ui/format.js`:**
  - `formatPrice(level)`: `'$'.repeat(level)`, ou `''` para `null`.
  - `placeShareText`: a primeira linha passa a ser `Nome (Tipo · $$)` quando há preço (RN21).
- **`js/ui/screens/place-form.js`:**
  - Campo "Faixa de preço" logo depois do Tipo, com o grupo de escolha única `$`, `$$`, `$$$`, `$$$$` (estilo `.choice`, `role="radiogroup"`, `aria-label="Faixa de preço"`).
  - Tocar na opção já marcada **desmarca** (limpa o preço). O radio nativo não faz isso: trate no `click`.
  - O campo é opcional. Na edição, vem preenchido.
- **`js/ui/screens/place-detail.js`:** a linha do tipo mostra "Bar · $$" quando há preço.
- **`js/ui/screens/home.js`:**
  - **Card** (`renderCard`): a linha do tipo vira `Tipo · $$` quando há preço.
  - **Painel de filtros** (`openFilterSheet`): seção "Preço" logo depois de "Tipo", com múltipla escolha `$` a `$$$$`. O `toggleList` trabalha com strings, então use `'1'`–`'4'` como valores e converta para número ao aplicar.
- **`js/services/filters.js`:**
  - `emptyFilters()` ganha `prices: []`.
  - `applyFilters`: com `prices` preenchido, o lugar passa só se o `priceLevel` dele estiver na lista (OU entre as faixas); lugares sem preço ficam de fora (RN23).
  - `countActiveFilters` conta `prices` como um critério, nas duas abas.
  - `filtersToQuery` gera `price: '1,2'`; `filtersFromQuery` aceita só de 1 a 4.
- **`css/app.css`:** só se precisar ajustar o grupo de preço. Use variáveis de cor.

## Critérios de aceite
- [ ] No cadastro e na edição do lugar, aparece "Faixa de preço" depois do Tipo, com $, $$, $$$ e $$$$. O campo é opcional.
- [ ] Tocar de novo na faixa marcada a desmarca. Salvar assim deixa o lugar sem preço.
- [ ] Um lugar com preço mostra "Bar · $$" no card da lista e no detalhe. Sem preço, mostra só "Bar".
- [ ] O painel de filtros tem a seção "Preço" depois de "Tipo".
- [ ] Dado lugares com $, $$ e sem preço, quando filtro $ e $$, aparecem só os de $ e $$; o lugar sem preço some.
- [ ] O filtro de preço conta no indicador de filtros e continua aplicado ao abrir um lugar e voltar.
- [ ] Compartilhar um lugar com preço mostra "Nome (Tipo · $$)" na primeira linha.
- [ ] Os lugares que já existiam continuam funcionando, sem preço.

## Como testar
**Validação manual (usuário)**
1. Edite um lugar existente: o campo aparece depois do Tipo. Escolha $$ e salve. Edite de novo, toque em $$ para desmarcar e salve (critérios 1, 2 e 8).
2. Dê preços diferentes a 3 lugares e deixe 1 sem preço. Confira os cards e o detalhe (critério 3).
3. Abra os filtros, marque $ e $$ e aplique. Confira a lista e o indicador, abra um lugar e volte (critérios 4, 5 e 6).
4. Compartilhe um lugar com preço (critério 7).

**Testes automatizados (quem implementa)**
- `js/services/places.test.js`: `validatePlace` com preço válido, inválido e vazio (sempre com `priceLevel` no `value`).
- `js/services/filters.test.js`:
  - `applyFilters` com `prices` (OU, sem preço excluído, combinado com tipo em E);
  - `countActiveFilters` conta o preço;
  - ida e volta de `filtersToQuery` / `filtersFromQuery`, ignorando `price=9`.
- `js/ui/format.test.js`: `formatPrice`; `placeShareText` com preço.
- Comando: `node --test`.

## Observações
- O preço é do lugar, não da visita, e é uma informação aproximada que você mesmo escolhe.

## Pendências
- [CARD-034 — Esquema v2: campos novos e backup](CARD-034-esquema-v2-e-backup.md)

## Justificativa da complexidade e do modelo
- **Complexidade M:** campo novo atravessando formulário, card, detalhe, filtros e texto de compartilhar.
- **Modelo sonnet:** funcionalidade típica, de incerteza baixa, seguindo padrões que já existem (filtro de tipo, `.choice`).

## Fora do escopo
- Ordenar por preço.
- "Indicado por" e link (CARD-036).

## Referências
- RF28, RF10, RN23, RN21 e as telas T1, T2, T3 e T4 — `docs/refinamento.md`
- `js/services/places.js`, `js/services/filters.js`, `js/ui/screens/place-form.js`, `js/ui/screens/place-detail.js`, `js/ui/screens/home.js`, `js/ui/format.js`
