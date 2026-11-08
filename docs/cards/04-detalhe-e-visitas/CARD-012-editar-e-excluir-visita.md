---
id: CARD-012
titulo: "Editar e excluir visita"
contexto: detalhe-visitas
tipo: feature
camadas: [front, banco]
complexidade: P
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RF05, RN04, RN05]
depende_de: [CARD-011]
---

# CARD-012 — Editar e excluir visita

## Contexto
Corrigir ou apagar uma visita. Apagar só remove o registro: o lugar nunca volta para "Quero ir".

## O que fazer
- T5 em modo edição (`#/visit/:id/edit`), com as mesmas validações; atualiza `updatedAt`.
- "Excluir visita" com confirmação; remove apenas a visita, sem tocar no status do lugar.

## Critérios de aceite
- [ ] Dado uma visita com nota 3, quando mudo para 5 e salvo, então histórico e média refletem a mudança (RF05).
- [ ] Dado um lugar `been_there` com 1 visita, quando excluo essa visita, então o lugar continua em "Já fui" (RN04).
- [ ] Dado que cancelo a confirmação, então nada é excluído.

## Justificativa da complexidade
P: reaproveita o formulário do CARD-011.
