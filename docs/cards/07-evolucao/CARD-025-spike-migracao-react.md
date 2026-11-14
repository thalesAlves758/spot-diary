---
id: CARD-025
titulo: "Spike: plano de migração da interface para React"
contexto: evolucao
tipo: spike
camadas: [front]
complexidade: P
prioridade: depois
incerteza: media
status: descartado
requisitos: [Escopo-depois-React]
depende_de: [CARD-015, CARD-018]
---

# CARD-025 — Spike: plano de migração da interface para React

> **Descartado em 13/11/2026.** O app continua 100% local (sem servidor e sem chamadas externas), e esta evolução esbarra nesses limites. O motivo de cada item está no [refinamento](../../refinamento.md#escopo). Se voltar, deve ser num projeto novo.

## Contexto
A arquitetura em camadas foi pensada para isso: `db/` e `services/` ficam, só `ui/` é reescrita. Migrar tudo passa de 1 dia, então primeiro vem o plano.

## O que fazer
- Escolher o setup (ex.: Vite + React) e como manter o service worker e o manifest.
- Validar que `db/` e `services/` importam sem mudança.
- Quebrar a migração em cards por tela (T1 a T6).

## Critérios de aceite
- [ ] Nota em `docs/` com o setup, a ordem de migração e os cards por tela.
- [ ] Prova de conceito com uma tela usando os `services/` atuais sem alteração.

## Justificativa da complexidade
P: investigação limitada a 1 dia; a migração em si vira vários cards.
