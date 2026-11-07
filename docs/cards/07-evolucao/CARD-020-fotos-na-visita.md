---
id: CARD-020
titulo: "Fotos na visita"
contexto: evolucao
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: depois
incerteza: media
status: todo
requisitos: [RF15]
depende_de: [CARD-019]
---

# CARD-020 — Fotos na visita

## Contexto
Anexar fotos às visitas, conforme as decisões do spike.

## O que fazer
- Anexar fotos no T5 até o limite definido; miniaturas no histórico; visualização ampliada; remover foto.
- Migração do esquema para a versão 2: store `photos` com índice `visitId`.
- Exclusão em cascata: apagar visita ou lugar apaga as fotos.

## Critérios de aceite
- [ ] Dado uma visita, quando anexo uma foto, então ela é comprimida, salva e aparece em miniatura no histórico.
- [ ] Dado um banco na versão 1, quando o app atualiza, então a migração cria a store `photos` sem perder dados.
- [ ] Dado um lugar com fotos, quando excluo o lugar, então as fotos também somem.

## Justificativa da complexidade
M: depende das decisões do spike; revisar o tamanho depois dele.
