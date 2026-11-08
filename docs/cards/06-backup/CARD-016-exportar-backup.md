---
id: CARD-016
titulo: "Exportar backup"
contexto: backup
tipo: feature
camadas: [front, banco]
complexidade: P
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RF12, RNF-durabilidade]
depende_de: [CARD-002, CARD-004]
---

# CARD-016 — Exportar backup

## Contexto
Com tudo salvo só no celular, o export é o cinto de segurança dos dados.

## O que fazer
- Tela T6 (`#/backup`) com a data do último export e o botão "Exportar".
- `js/services/backup.js` → `buildBackup()` retorna `{ app: 'diario-de-role', schemaVersion: 1, exportedAt, places, visits }`.
- Download via `Blob` + `<a download>` com o nome `diario-de-role-AAAA-MM-DD.json`.
- Gravar `meta.lastExportAt`.

## Critérios de aceite
- [ ] Dado 3 lugares e 5 visitas, quando exporto, então o JSON baixado contém os 3 lugares, as 5 visitas e `schemaVersion: 1` (RF12).
- [ ] Depois de exportar, a T6 mostra a data do último export.

## Notas técnicas
Testar com o app instalado (standalone) no Android: o arquivo deve ir para Downloads.

## Fora do escopo
Importação (CARD-017) e lembrete (CARD-018).

## Justificativa da complexidade
P: serialização e download.
