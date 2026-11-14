---
id: CARD-022
titulo: "Spike: mapa e busca de lugares"
contexto: evolucao
tipo: spike
camadas: [front, integracao]
complexidade: P
prioridade: depois
incerteza: alta
status: descartado
requisitos: [RF16]
depende_de: [CARD-005]
---

# CARD-022 — Spike: mapa e busca de lugares

> **Descartado em 13/11/2026.** O app continua 100% local (sem servidor e sem chamadas externas), e esta evolução esbarra nesses limites. O motivo de cada item está no [refinamento](../../refinamento.md#escopo). Se voltar, deve ser num projeto novo.

## Contexto
Buscar o lugar num mapa em vez de digitar tudo. Há custo e dependência de internet a avaliar.

## O que fazer
- Comparar Google Places (custo após a cota gratuita, chave exposta no front) com OpenStreetMap/Nominatim (grátis, com limite de uso) e Leaflet para exibição.
- Definir como guardar latitude e longitude no lugar e como o app se comporta offline.

## Critérios de aceite
- [ ] Nota em `docs/` com a opção escolhida, custos, limites e a quebra em cards.

## Justificativa da complexidade
P: investigação limitada a 1 dia.
