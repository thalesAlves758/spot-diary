---
id: CARD-006
titulo: "Tags com autocomplete"
contexto: lugares
tipo: feature
camadas: [front]
complexidade: P
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF11, RN03]
depende_de: [CARD-005]
---

# CARD-006 — Tags com autocomplete

## Contexto
Tags livres organizam os lugares ("rooftop", "BH", "date"). O autocomplete evita variações da mesma tag.

## O que fazer
- Componente de entrada de tags em chips no T3: ao digitar, sugere tags já usadas filtrando por prefixo, sem diferenciar maiúsculas.
- Enter ou vírgula cria a tag; "x" no chip remove.
- `services/lugares.js`: `listarTags()` (união das tags de todos os lugares) e `normalizarTag()`, que reaproveita a grafia já existente.

## Critérios de aceite
- [ ] Dado que existe a tag "rooftop", quando digito "roo", então "rooftop" aparece como sugestão (RF11).
- [ ] Dado que existe "BH", quando adiciono "bh", então nenhuma tag nova é criada e o lugar recebe "BH" (RN03).
- [ ] A mesma tag não entra duas vezes no mesmo lugar.

## Justificativa da complexidade
P: um componente e duas funções puras.
