---
id: CARD-009
titulo: "Busca por nome"
contexto: inicio
tipo: feature
camadas: [front]
complexidade: P
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF09, RNF-performance]
depende_de: [CARD-008]
---

# CARD-009 — Busca por nome

## Contexto
Achar um lugar rápido digitando parte do nome.

## O que fazer
- Campo de busca na T1 que filtra a aba atual enquanto digita (debounce de ~150 ms).
- Comparação sem diferenciar maiúsculas nem acentos (`normalize('NFD')`).
- O termo continua aplicado ao trocar de aba.
- Estado "sem resultado" com botão "limpar busca".
- `js/services/filtros.js`: `buscarPorNome(lugares, termo)`, função pura que o CARD-015 estende.

## Critérios de aceite
- [ ] Dado "Bar do Zé" e "Café Central", quando digito "ze", então só "Bar do Zé" aparece (RF09).
- [ ] Dado um termo sem resultado, então aparece o estado vazio de busca.
- [ ] Dado um termo digitado, quando troco de aba, então a busca é reaplicada na outra aba.

## Justificativa da complexidade
P: um campo e uma função pura.
