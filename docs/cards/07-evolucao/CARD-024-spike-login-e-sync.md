---
id: CARD-024
titulo: "Spike: login e sincronização"
contexto: evolucao
tipo: spike
camadas: [back, front, integracao]
complexidade: P
prioridade: depois
incerteza: alta
status: todo
requisitos: [RF17]
depende_de: [CARD-017]
---

# CARD-024 — Spike: login e sincronização

## Contexto
Usar o app em mais de um aparelho exige conta e sincronização, o que muda a regra de "nenhum dado sai do aparelho".

## O que fazer
- Avaliar opções (Firebase, Supabase, backend próprio) considerando custo zero e LGPD com dados em servidor.
- Definir a estratégia de conflito, aproveitando os IDs UUID e o `updatedAt` que já existem.

## Critérios de aceite
- [ ] Nota em `docs/` com a opção escolhida, o modelo de sync, os impactos de privacidade e a quebra em cards.

## Justificativa da complexidade
P: investigação limitada a 1 dia.
