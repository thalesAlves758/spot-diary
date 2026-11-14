---
id: CARD-019
titulo: "Spike: compressão e armazenamento de fotos"
contexto: evolucao
tipo: spike
camadas: [front, banco]
complexidade: P
prioridade: depois
incerteza: media
status: descartado
requisitos: [RF15]
depende_de: [CARD-011]
---

# CARD-019 — Spike: compressão e armazenamento de fotos

> **Descartado em 13/11/2026.** O app continua 100% local (sem servidor e sem chamadas externas), e esta evolução esbarra nesses limites. O motivo de cada item está no [refinamento](../../refinamento.md#escopo). Se voltar, deve ser num projeto novo.

## Contexto
Fotos foram tiradas do MVP porque pesam no armazenamento e no backup. Antes de implementar, medir no celular real.

## O que fazer
- Testar captura com `<input type="file" accept="image/*" capture>`.
- Comprimir via canvas (ex.: largura máxima 1280 px, JPEG ~0,7) e medir o tamanho final (alvo de 300–500 KB).
- Guardar como Blob no IndexedDB (store `photos`) e checar a cota com `navigator.storage.estimate()`.
- Decidir limite de fotos por visita e o formato do backup.

## Critérios de aceite
- [ ] Nota curta em `docs/` com as decisões (limite, resolução, qualidade, store) e números medidos no Android.

## Justificativa da complexidade
P: investigação limitada a 1 dia.
