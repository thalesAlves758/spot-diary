---
id: CARD-021
titulo: "Backup em .zip com fotos"
contexto: evolucao
tipo: feature
camadas: [front]
complexidade: M
prioridade: depois
incerteza: media
status: todo
requisitos: [RF15, RF12, RF13]
depende_de: [CARD-017, CARD-020]
---

# CARD-021 — Backup em .zip com fotos

## Contexto
Com fotos, o backup deixa de caber num JSON.

## O que fazer
- Export gera `.zip` com o JSON e uma pasta `fotos/`, usando JSZip servido localmente (sem CDN, para funcionar offline).
- Import aceita `.zip` (v2) e `.json` (v1, compatibilidade).

## Critérios de aceite
- [ ] Dado lugares com fotos, quando exporto e importo em outro aparelho, então lugares, visitas e fotos chegam completos.
- [ ] Um backup `.json` antigo continua importando normalmente.

## Justificativa da complexidade
M: novo formato de arquivo e compatibilidade com o antigo.
