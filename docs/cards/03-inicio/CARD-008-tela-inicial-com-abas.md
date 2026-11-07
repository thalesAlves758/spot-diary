---
id: CARD-008
titulo: "Tela inicial com abas e cards"
contexto: inicio
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RF08, RN08, RNF-performance]
depende_de: [CARD-002, CARD-004]
---

# CARD-008 — Tela inicial com abas e cards

## Contexto
Tela T1, a porta de entrada: abas "Quero ir" e "Já fui" com os lugares em cards.

## O que fazer
- Cabeçalho com nome do app e acesso a Backup (`#/backup`).
- Abas "Quero ir" e "Já fui" com contador; lista de cards; botão flutuante "Novo" (`#/place/new`; comportamento na aba "Já fui" fica no CARD-013).
- `js/services/summary.js`: `placeSummary(place, visits)` → `{ average, lastVisit, lastWouldReturn, visitCount }`, média com uma casa decimal (RN08). Reutilizado no detalhe e nos filtros.
- Card: nome, tipo e tags; em "Já fui", também média e data da última visita; coração só exibido (o toque fica no CARD-014).
- Ordenação: "Quero ir" pelo cadastro mais recente; "Já fui" pela última visita mais recente, com lugares sem visitas no fim.
- Estado vazio por aba, com atalho para cadastrar.
- Tocar no card abre `#/place/:id`.

## Critérios de aceite
- [ ] Dado 2 lugares `want_to_go` e 1 `been_there`, quando abro o app, então os contadores mostram 2 e 1 e cada aba lista os lugares certos (RF08).
- [ ] Dado um lugar `been_there` com visitas de nota 4 e 5, então o card mostra média 4,5 e a data da visita mais recente.
- [ ] Dado uma aba sem lugares, então aparece o estado vazio com atalho para cadastrar.
- [ ] Com 1.000 lugares, a lista renderiza em menos de 200 ms (referência de performance).

## Notas técnicas
Carregar lugares e visitas uma vez, agrupar visitas por `placeId` num `Map` e calcular os resumos em memória.

## Fora do escopo
Busca (CARD-009), filtros (CARD-015), favoritar (CARD-014), lembrete de backup (CARD-018).

## Justificativa da complexidade
M: tela principal com abas, ordenação e o serviço de resumo.
