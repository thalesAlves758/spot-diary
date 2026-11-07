---
id: CARD-003
titulo: "Service worker e modo offline"
contexto: fundacao
tipo: infra
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: media
status: done
requisitos: [RNF-offline, RNF-plataforma]
depende_de: [CARD-001]
---

# CARD-003 — Service worker e modo offline

## Contexto
O app precisa abrir e funcionar 100% sem internet depois da primeira carga, e ser instalável na tela inicial do Android.

## O que fazer
- `sw.js` com cache versionado (ex.: `diario-v1`) e pré-cache dos arquivos do app no `install`.
- Estratégia cache-first para os arquivos do app; limpeza de caches antigos no `activate`.
- Registrar o service worker em `js/app.js`.
- Fluxo de atualização: ao detectar versão nova, mostrar "Nova versão disponível — recarregar"; ao aceitar, `skipWaiting` e recarga.
- Conferir os critérios de instalação do Chrome (manifest + SW + HTTPS).

## Critérios de aceite
- [ ] Dado o app carregado uma vez, quando ativo o modo avião e reabro, então o app abre e todas as telas funcionam.
- [ ] Dado o app instalado, quando abro pela tela inicial, então ele roda em modo standalone (sem barra do navegador).
- [ ] Dado que publiquei uma versão com cache `diario-v2`, quando abro o app, então vejo o aviso de atualização e, ao aceitar, a versão nova carrega.

## Notas técnicas
- Sem build, a lista de arquivos do pré-cache é mantida à mão numa constante `ASSETS` em `sw.js`: todo arquivo novo precisa entrar nela.
- Nunca cachear dados do usuário: eles estão no IndexedDB.

## Fora do escopo
Qualquer tela ou regra de negócio.

## Justificativa da complexidade
M: o ciclo de vida do service worker tem pegadinhas de atualização e cache.
