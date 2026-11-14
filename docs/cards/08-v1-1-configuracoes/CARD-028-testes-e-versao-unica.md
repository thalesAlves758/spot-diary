---
id: CARD-028
titulo: "Fundação: testes automatizados e versão única"
contexto: fundacao-evolucao
tipo: setup
camadas: [front, integracao]
complexidade: M
prioridade: mvp
incerteza: media
modelo_sugerido: opus
status: done
requisitos: [RN19, RNF-testes, RNF-versao]
depende_de: []
---

# CARD-028 — Fundação: testes automatizados e versão única

## Contexto
A evolução 1.1–1.4 do Diário de Rolê é entregue em quatro releases (v1.1.0 a v1.4.0). Hoje não há testes no repositório, e a versão do app existe só como o nome do cache do service worker (`diario-v4` em `sw.js`). Esse número é subido à mão e não diz nada para quem lê. A máquina do usuário não tem Node instalado, então os testes precisam rodar no GitHub Actions.

## Objetivo
Criar a base que todos os cards da evolução usam:
- a versão do app num único arquivo, com o cache do service worker derivado dela;
- a execução de `node --test` no GitHub Actions;
- testes que protegem as regras do service worker (versão e lista `ASSETS`);
- o `CHANGELOG.md`.

## Detalhamento técnico
- **`js/version.js` (novo, script clássico, sem `export`):** define a versão como global, para servir tanto ao service worker (`importScripts`) quanto à página.
  ```js
  // App version (RN19). The only place where it is written; sw.js derives the cache name from it.
  self.APP_VERSION = '1.0.0';
  ```
  Comece em `1.0.0`, a versão hoje publicada. Quem sobe para `1.1.0` é a release, não este card.
- **`index.html`:** carregue `<script src="js/version.js"></script>` no `<head>`, antes do `<script type="module" src="js/app.js">`. Um script clássico sem `defer` roda antes dos módulos.
- **`js/services/app-info.js` (novo):** `export function getAppVersion() { return globalThis.APP_VERSION ?? 'dev'; }`. É a forma de `ui/` ler a versão sem acessar a global direto. O CARD-029 usa essa função na seção Sobre.
- **`sw.js`:**
  - Primeira instrução: `importScripts('js/version.js');`.
  - Troque `const CACHE_VERSION = 'diario-v4';` por `const CACHE_VERSION = CACHE_PREFIX + self.APP_VERSION;`, o que dá `diario-1.0.0`.
  - Inclua `'js/version.js'` e `'js/services/app-info.js'` em `ASSETS`.
  - Atualize o comentário do topo: "a cada release, suba a versão em `js/version.js`", e não mais `CACHE_VERSION`.
  - O `activate` já apaga os caches com prefixo `diario-` diferentes do atual, então o `diario-v4` antigo some sozinho. Confira isso.
  - O Chrome compara byte a byte também os scripts carregados por `importScripts` ao procurar atualização (padrão `updateViaCache: 'imports'`). Por isso, mudar só o `js/version.js` dispara a atualização. Confira que `js/sw-register.js` não registra com `updateViaCache: 'all'`.
- **`package.json` (novo, sem dependências):** `{ "name": "diario-de-role", "private": true, "type": "module", "scripts": { "test": "node --test" } }`. O `"type": "module"` faz o Node tratar os `.js` como ES modules. O navegador ignora esse arquivo, que **não** entra em `ASSETS`.
- **`.github/workflows/test.yml` (novo):** nome "Testes".
  - Dispara em `push` nas branches `dev` e `main` e em `pull_request`.
  - Job em `ubuntu-latest` com `actions/checkout@v4` e `actions/setup-node@v4` (`node-version: 22`), rodando `node --test`.
  - Sem `npm install`.
- **`tests/sw.test.js` (novo):** testes que leem os arquivos do disco com `node:fs`.
  1. `js/version.js` define `self.APP_VERSION` no formato `MAIOR.MENOR.CORREÇÃO`. Avalie o arquivo com `node:vm`, num contexto `{ self: {} }`.
  2. `sw.js` chama `importScripts('js/version.js')` e monta o `CACHE_VERSION` a partir de `self.APP_VERSION`, sem nenhum `'diario-v<N>'` escrito à mão.
  3. Todo arquivo de `js/`, `css/` e `icons/` (exceto `*.test.js`) está em `ASSETS`. Extraia a lista do texto de `sw.js` com regex.
  4. Toda entrada de `ASSETS`, exceto `./`, existe no disco.
- **`js/services/sorting.test.js` (novo):** testes de `sortItems` para RN14 (lugares sem visita no fim) e RN15 (desempates). Eles mostram que os módulos de `services/` importam no Node sem DOM nem IndexedDB. Se algum import quebrar no Node, corrija o mínimo e registre no relatório.
- **`CHANGELOG.md` (novo, raiz, em português):** título, uma linha explicando o formato e a seção `## 1.0.0 — 2026-11-08`. Essa seção resume o MVP: cadastro de lugares e visitas, abas, busca, filtros, ordenação, favoritos, backup, import, lembrete de backup e apagar tudo. Os cards **não** editam o CHANGELOG; quem escreve as próximas seções é a release.
- **`CLAUDE.md`:**
  - "Stack and commands": testes passam a ser obrigatórios para regra nova em `services/` (RNF de testes), rodam com `node --test` no GitHub Actions, e o Node local é opcional.
  - "Service worker gotchas": a versão sobe em `js/version.js` (não mais em `CACHE_VERSION`) e o teste `tests/sw.test.js` garante o vínculo.
  - No passo 5 do orquestrador, a release passa a ser: subir `js/version.js`, escrever a seção do `CHANGELOG.md`, fazer o merge da `dev` na `main`, criar a tag `vX.Y.Z` e dar push nas duas e na tag.
- **`README.md`:** ajustar "Atualizar o app publicado" (subir `js/version.js` na release) e "Limitações conhecidas" (os testes passam a estar no repositório, em `node --test`).

## Critérios de aceite
- [ ] Depois do push da `dev`, a aba **Actions** do GitHub mostra o workflow "Testes" rodando e terminando verde.
- [ ] Depois de atualizar o app aberto (aviso "Nova versão disponível" → Recarregar), o DevTools → Application → Cache Storage mostra só o cache `diario-1.0.0`; o `diario-v4` sumiu.
- [ ] O app continua abrindo offline depois da atualização (modo avião ou DevTools → Network → Offline), com os dados de antes.
- [ ] Dado que alguém remove um arquivo de `ASSETS` ou escreve `CACHE_VERSION` à mão, quando faz push, o workflow "Testes" fica vermelho.
- [ ] O repositório tem o `CHANGELOG.md` com a seção 1.0.0.
- [ ] O repositório tem a tag `v1.0.0` no commit hoje publicado (passo da orquestradora; ver Observações).

## Como testar
**Validação manual (usuário)**
1. Depois do merge, rode `git push origin dev` e abra a aba Actions do repositório no GitHub. O workflow "Testes" deve ficar verde (critério 1).
2. Sirva o app localmente (Live Server) com a versão antiga já instalada no navegador. Recarregue, aceite o aviso de versão nova e confira o Cache Storage no DevTools (critério 2).
3. Ative o modo offline no DevTools e recarregue: o app abre com os dados (critério 3).
4. (Opcional) Numa branch de teste, apague uma linha de `ASSETS`, faça push e veja o workflow falhar. Depois descarte a branch (critério 4).
5. Confira `CHANGELOG.md` e `git tag` (critérios 5 e 6).

**Testes automatizados (quem implementa)**
- `tests/sw.test.js` e `js/services/sorting.test.js`, como descrito acima.
- Comando: `node --test`. Sem Node na máquina, diga isso no relatório: os testes rodam no GitHub Actions depois do push.
- Confira também no Chrome headless (ver o README do projeto, "Rodar localmente") que o service worker instala com o cache `diario-1.0.0` e que o app abre.

## Observações
- **Tag `v1.0.0`:** a orquestradora cria a tag anotada na `main` atual, que é o que está publicado (`git tag -a v1.0.0 -m "Versão 1.0.0" main`), antes de fazer o merge deste card. O push da tag acontece quando o usuário pedir push. O subagente não mexe em tags.
- A troca de `diario-v4` para `diario-1.0.0` já faz os apps instalados baixarem a versão nova, o que é esperado.
- **Alternativa descartada:** service worker como ES module (`type: 'module'`). Mudaria o registro e o comportamento de atualização sem ganho real.

## Pendências
Nenhuma.

## Justificativa da complexidade e do modelo
- **Complexidade M:** muitos arquivos de configuração e testes, mas cada um é simples.
- **Modelo opus:** mexe no service worker e no cache (área de risco: um erro deixa os apps instalados presos numa versão ou quebra o offline) e define o padrão de testes que os outros cards seguem.

## Fora do escopo
- Subir a versão para 1.1.0 ou escrever a seção 1.1.0 do CHANGELOG (é a release).
- Mostrar a versão na interface (CARD-029).
- Testes de ponta a ponta versionados (descartados no refinamento).
- Lint, formatação ou qualquer dependência npm.

## Referências
- RN19, RNF "Testes automatizados" e "Versão" — `docs/refinamento.md`, seções "Regras de negócio" e "Requisitos não-funcionais" (bloco "Evolução 1.1–1.4")
- "Organização do repositório" e "Evolução 1.1–1.4: pontos técnicos" — `docs/refinamento.md`
- `sw.js`, `js/sw-register.js`, `index.html`, `js/services/sorting.js`
