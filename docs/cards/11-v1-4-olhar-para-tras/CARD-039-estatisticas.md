---
id: CARD-039
titulo: "Estatísticas"
contexto: olhar-para-tras
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: todo
requisitos: [RF32, RN28, RNF-performance]
depende_de: [CARD-038]
---

# CARD-039 — Estatísticas

## Contexto
Com meses de visitas registradas, o app guarda uma boa história, mas não mostra nenhum resumo dela: quanto você saiu, aonde mais voltou, com quem foi. Tudo isso pode ser calculado na hora a partir de lugares e visitas, sem gravar nada novo. O campo "Com quem" (CARD-037) já existe.

## Objetivo
Criar a tela Estatísticas (T8, `#/stats`), aberta por um ícone de gráfico no cabeçalho da tela inicial. Ela mostra totais, média e distribuição das notas, visitas ao longo do tempo e rankings, com o seletor "Este ano / Tudo".

## Detalhamento técnico
- **`js/services/stats.js` (novo, puro):**
  ```js
  /** RN28. period: 'year' | 'all'. today: 'YYYY-MM-DD' (todayLocal()). */
  export function computeStats(places, visits, { period = 'year', today })
  export async function loadStats(period)   // loads places + visits once and calls computeStats
  ```
  O retorno de `computeStats`:
  - `placesByStatus: { want_to_go, been_there }`: o estado atual, sem depender do período.
  - `visitCount`: visitas no período. "Este ano" são as visitas com `date` no ano de `today`; "Tudo" são todas.
  - `discovered`: lugares cuja **primeira** visita (a menor `date`) caiu no período.
  - `average`: média das notas das visitas do período, com uma casa decimal (use `averageRating` de `js/services/summary.js`), ou `null` sem visitas.
  - `ratingDistribution: { 1: n, …, 5: n }`.
  - `timeline`:
    - `{ unit: 'month', bars: [{ key: '2026-01', label: 'J', count }, …12] }` em "Este ano", com os rótulos J F M A M J J A S O N D;
    - `{ unit: 'year', bars: [{ key: '2024', label: '2024', count }, …] }` em "Tudo", do ano da primeira visita até o ano atual, sem pular anos.
  - `topTypes` (`[{ type, label, count }]`), `topPlaces` (`[{ place, count }]`) e `topPeople` (`[{ name, count }]`): top 5 por nº de visitas no período.
    - Em pessoas, a chave é `personKey` (de `js/services/people.js`), e a grafia exibida é a mais usada.
    - Empates são resolvidos pelo nome, com `Intl.Collator('pt-BR', { sensitivity: 'base' })`.
  - **Performance:** uma passada sobre as visitas, agrupadas por lugar. A meta é menos de 200 ms com 1.000 lugares e 5.000 visitas.
- **`js/ui/screens/stats.js` (novo):** cabeçalho "Estatísticas" com voltar.
  - **Seletor de período:** "Este ano · Tudo", em escolha única com estilo `.choice`, guardado na query (`?period=all`) com `setQuery`, para sobreviver ao voltar. O padrão é "Este ano".
  - **Seções:**
    - cards de totais: "Quero ir", "Já fui", "visitas" e "lugares conhecidos";
    - "Média geral ★ 4,2", com barras horizontais de 1 a 5;
    - "Visitas por mês" ou "Visitas por ano", com barras verticais em HTML e CSS (alturas proporcionais ao maior valor) e um `aria-label` com os números;
    - rankings "Tipos", "Lugares" e "Pessoas". Tocar num lugar chama `navigate('/place/<id>')`.
  - **Estados:**
    - com `visitCount === 0` no período, mostre os totais de lugares e o estado vazio "Registre visitas para ver suas estatísticas" (`createEmptyState`), sem gráficos nem rankings;
    - um ranking sem dados (por exemplo, nenhuma pessoa) fica oculto.
  - Formate os números com `formatAverage` e `plural` de `js/ui/format.js`.
- **`js/app.js`:** `route('/stats', () => import('./ui/screens/stats.js'));`
- **`js/ui/screens/home.js`:** no cabeçalho, `iconButton({ name: 'chart', label: 'Estatísticas', onClick: () => navigate('/stats') })` **antes** da engrenagem.
- **`css/app.css`:** grade dos cards de totais, barras e rankings, só com variáveis de cor (funcionando no tema escuro) e sem rolagem lateral em 360 px. Se as 12 barras do mês não couberem, reduza a largura delas.
- **`sw.js`:** adicione `js/services/stats.js` e `js/ui/screens/stats.js` em `ASSETS`. Não mexa na versão.
- **`CLAUDE.md` e `README.md`:** acrescente a rota `#/stats` nas listas de rotas e telas.

## Critérios de aceite
- [ ] O cabeçalho da tela inicial tem um ícone de gráfico antes da engrenagem, e tocar nele abre "Estatísticas".
- [ ] A tela abre em "Este ano" e mostra os totais de lugares (Quero ir e Já fui), as visitas do ano e os lugares conhecidos no ano.
- [ ] A média geral e as barras de 1 a 5 batem com as notas das visitas do ano.
- [ ] "Visitas por mês" mostra janeiro a dezembro do ano atual, com a altura das barras proporcional às visitas de cada mês.
- [ ] Ao trocar para "Tudo", os números passam a considerar todas as visitas, e o gráfico vira "Visitas por ano", do primeiro ano com visita até hoje.
- [ ] Os rankings mostram até 5 tipos, lugares e pessoas, do mais visitado ao menos visitado. Tocar num lugar abre o detalhe dele, e voltar retorna às Estatísticas no mesmo período.
- [ ] Sem visitas no período, aparece "Registre visitas para ver suas estatísticas", sem gráficos. Sem nenhuma pessoa registrada, o ranking de pessoas não aparece.
- [ ] A tela fica legível no tema claro e no escuro, sem rolagem lateral num celular de 360 px.
- [ ] Funciona offline.

## Como testar
**Validação manual (usuário)**
1. Com um backup real importado, abra a tela inicial e toque no gráfico (critérios 1 e 2).
2. Confira à mão alguns números do ano: o total de visitas e a média, comparando com os detalhes de 2 ou 3 lugares (critério 3). Confira os meses do gráfico (critério 4).
3. Troque para "Tudo" (critério 5). Toque num lugar do ranking e volte (critério 6).
4. Num navegador de teste sem visitas neste ano (ou sem dados), abra Estatísticas (critério 7).
5. Repita no tema escuro e no modo celular do DevTools (critério 8). Ative o offline e recarregue em `#/stats` (critério 9).

**Testes automatizados (quem implementa)**
- `js/services/stats.test.js` com dados montados à mão:
  - período "Este ano" × "Tudo" (visitas do ano anterior ficam de fora);
  - `discovered` usa a primeira visita;
  - `average` e `ratingDistribution`;
  - `timeline` com 12 meses e anos contínuos, mesmo com um ano sem visitas no meio;
  - rankings com limite de 5 e empate resolvido pelo nome;
  - pessoas sem diferenciar maiúsculas, com a grafia mais usada;
  - sem visitas no período (`average` igual a `null`, barras zeradas).
- Um teste de tempo com 1.000 lugares e 5.000 visitas gerados, conferindo que roda abaixo de 200 ms (referência, com margem).
- Comando: `node --test`.

## Observações
- "Lugares conhecidos" substitui "Quero ir que viraram Já fui". A definição é a primeira visita no período, o que inclui os lugares cadastrados direto em "Já fui" (premissa do refinamento).

## Pendências
- [CARD-038 — Desfazer exclusão](../10-v1-3-registros/CARD-038-desfazer-exclusao.md): fecha a release v1.3. Este card abre a v1.4.

## Justificativa da complexidade e do modelo
- **Complexidade M:** um serviço de cálculo com vários números e uma tela nova com gráficos simples, sem biblioteca.
- **Modelo sonnet:** funcionalidade típica, de incerteza baixa. As regras estão definidas na RN28 e são testáveis.

## Fora do escopo
- Seletor de ano específico, exportar estatísticas ou gráficos interativos.
- Filtrar a tela inicial por pessoa.
- Tags fixadas (CARD-040).

## Referências
- RF32, RN28, RNF "Performance" (evolução), Fluxo 9 e a tela T8 — `docs/refinamento.md`
- `js/services/summary.js`, `js/services/people.js`, `js/services/places.js` (`placeTypeLabel`, `STATUS`), `js/services/dates.js` (`todayLocal`), `js/ui/screens/home.js`, `js/app.js`
