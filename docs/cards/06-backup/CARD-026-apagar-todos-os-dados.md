---
id: CARD-026
titulo: "Apagar todos os dados"
contexto: backup
tipo: feature
camadas: [front, banco]
complexidade: P
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RF18]
depende_de: [CARD-016]
---

# CARD-026 — Apagar todos os dados

## Contexto
Hoje a única forma de zerar o app é limpar os dados do site no Chrome, o que também apaga o cache offline e a permissão de armazenamento persistente. Um botão na T6 permite recomeçar do zero (ex.: depois de testar o app ou antes de importar com "Substituir tudo"), com proteção forte contra toque acidental, porque a ação é irreversível.

## O que fazer
- Na T6 (`#/backup`), uma seção final "Apagar dados", separada visualmente das demais, com o botão "Apagar todos os dados" (estilo `btn-danger`).
- Sem lugares e sem visitas, o botão fica desabilitado com o texto "Não há dados para apagar".
- Confirmação em dois passos com `confirmDialog()`:
  1. Título "Apagar todos os dados?". A mensagem diz quanto será apagado ("12 lugares e 30 visitas") e a situação do backup: "Seu último backup foi em DD/MM/AAAA" ou "Você nunca fez backup — exporte antes se quiser guardar esses dados". Botões "Cancelar" e "Continuar".
  2. Título "Tem certeza?". Mensagem "Essa ação não pode ser desfeita." Botões "Cancelar" e "Apagar tudo" (`danger: true`).
- Ao confirmar, apagar tudo numa única transação, mostrar o toast "Todos os dados foram apagados" e voltar para o início com `replace('/')`, onde aparece o estado vazio.
- `js/db/index.js` → `clearData({ metaKeys = [] })`: limpa `places` e `visits` e remove as chaves de `meta` recebidas, na mesma transação `readwrite` sobre `['places', 'visits', 'meta']`. A função não sabe quais chaves remover; quem decide é o service.
- Serviço (ex.: `js/services/data-reset.js`) → `eraseAllData()`: chama `clearData({ metaKeys: ['lastExportAt'] })`. Mantém `schemaVersion` e `persistentStorage`, que descrevem o banco e o aparelho, não os dados do usuário.

## Critérios de aceite
- [ ] Dado 3 lugares e 5 visitas, quando confirmo os dois passos, então o app volta para o início com o estado vazio e as stores `places` e `visits` ficam vazias (RF18).
- [ ] Dado que cancelo no primeiro ou no segundo passo (botão, Esc, toque fora ou voltar do Android), então nada é apagado e continuo na T6.
- [ ] Dado que exportei em 01/11/2026, quando toco em "Apagar todos os dados", então a primeira confirmação mostra "Seu último backup foi em 01/11/2026"; se nunca exportei, mostra o aviso para exportar antes.
- [ ] Depois de apagar, a T6 mostra "Você ainda não fez nenhum backup." e `meta.schemaVersion` continua igual a 1.
- [ ] Dado que não há lugares nem visitas, então o botão aparece desabilitado.
- [ ] Dado que a gravação falha no meio, então nenhum dado é apagado (transação única) e aparece o toast "Não foi possível apagar. Tente de novo."

## Notas técnicas
- Não usar `indexedDB.deleteDatabase()`: a conexão aberta bloquearia a exclusão, e apagar o banco perderia `schemaVersion` e `persistentStorage`. Usar `store.clear()` + `store.delete(key)` dentro de `transaction()`.
- A UI chama só o service, nunca `db/` (camadas do CLAUDE.md). As contagens podem reaproveitar `countData()` e `getLastExportAt()` de `js/services/backup.js`; a data pode ser formatada com `js/ui/format.js`.
- O "Substituir tudo" do CARD-017 continua usando `bulkWrite(..., { clearFirst: true })`; os dois fluxos não precisam ser unificados.
- Se criar um arquivo novo em `js/services/`, adicioná-lo a `ASSETS` em `sw.js` e subir a versão do cache.
- Não mexe no cache do service worker: ele não guarda dados do usuário.

## Fora do escopo
- Apagar só uma parte (por status, por tag, só visitas).
- Desfazer a exclusão ou manter uma lixeira; quem quiser voltar atrás importa o backup (CARD-017).
- Desinstalar o PWA ou limpar o cache offline.

## Justificativa da complexidade
P: uma função de limpeza transacional, um service de uma linha e uma seção com confirmação dupla, usando componentes que já existem.
