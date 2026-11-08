---
id: CARD-007
titulo: "Editar e excluir lugar"
contexto: lugares
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RF02, RF03, RN06, RN10]
depende_de: [CARD-005]
---

# CARD-007 — Editar e excluir lugar

## Contexto
Corrigir dados de um lugar ou removê-lo, junto com todo o seu histórico de visitas.

## O que fazer
- T3 em modo edição (`#/place/:id/edit`), já preenchido.
- `updatePlace(id, data)`: mesmas validações do cadastro; a checagem de duplicado ignora o próprio lugar; atualiza `updatedAt`.
- Botão "Excluir lugar": modal informando quantas visitas serão apagadas; ao confirmar, `deleteWithVisits`; toast e volta para o início.
- O status não aparece no formulário (é controlado pelas visitas, RN04).

## Critérios de aceite
- [ ] Dado um lugar, quando altero o tipo e salvo, então listas e detalhe mostram o tipo novo e `updatedAt` muda (RF02).
- [ ] Dado que mudo só maiúsculas do próprio nome, quando salvo, então não há erro de duplicado.
- [ ] Dado um lugar com 2 visitas, quando excluo, então o modal avisa "2 visitas serão apagadas" e, ao confirmar, lugar e visitas somem (RF03, RN06).
- [ ] Dado que cancelo o modal, então nada é apagado.

## Fora do escopo
Edição de visitas (CARD-012).

## Justificativa da complexidade
M: reaproveita o formulário, mas soma exclusão em cascata e confirmação.
