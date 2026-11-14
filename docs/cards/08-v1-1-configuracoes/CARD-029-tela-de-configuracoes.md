---
id: CARD-029
titulo: "Tela de Configurações"
contexto: configuracoes
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: todo
requisitos: [RF20, RF23, RF12, RF13, RF18]
depende_de: [CARD-028]
---

# CARD-029 — Tela de Configurações

## Contexto
Hoje a tela inicial tem um ícone de backup que abre a tela "Backup" (`#/backup`), com exportar, importar e apagar todos os dados. Na evolução 1.1 ela vira **Configurações**, que também reúne Aparência (tema, CARD-030) e Sobre (versão do app). Os cards seguintes de várias releases também precisam de alguns ícones novos.

## Objetivo
Transformar a tela Backup em Configurações (`#/settings`), com as seções Backup, Dados e Sobre (esta com a versão). A tela passa a ser aberta pela engrenagem da tela inicial e pelo lembrete de backup. O card também adiciona de uma vez os ícones que a evolução vai usar.

## Detalhamento técnico
- **Renomear a tela:** `git mv js/ui/screens/backup.js js/ui/screens/settings.js`, para manter o histórico.
  - Título do cabeçalho: "Configurações" (`createHeader({ title: 'Configurações', back: true })`).
  - Comentário do topo: "T6 — Configurações".
- **Estrutura da tela** (uma tela só, rolável), em `<main class="page">`:
  1. **Backup:** seção com título `h2` "Backup", contendo os painéis atuais de exportar (`buildExportPanel`) e importar (`buildImportPanel`). Os títulos desses painéis passam a ser `h3` ("Exportar", "Importar").
  2. **Dados:** seção com título "Dados", contendo o painel atual de apagar tudo (`buildErasePanel`). Ele continua separado e em vermelho, como hoje.
  3. **Sobre:** seção nova com o texto "Diário de Rolê · Versão {versão}", usando `getAppVersion()` de `js/services/app-info.js` (criado no CARD-028).
  - Deixe a função `render` organizada para o CARD-030 inserir a seção "Aparência" **antes** de Backup, por exemplo com uma função `buildSection(title, ...content)`.
- **`js/app.js`:**
  - `route('/settings', () => import('./ui/screens/settings.js'));`
  - O antigo `/backup` vira um redirecionamento sem tela própria: `route('/backup', async () => ({ render() { replace('/settings'); } }));`, importando `replace` de `./router.js`. Assim `#/backup` (link salvo) não fica no histórico.
- **`js/ui/screens/home.js`:**
  - O botão do cabeçalho troca para `iconButton({ name: 'settings', label: 'Configurações', onClick: () => navigate('/settings') })`.
  - O `onExport` do lembrete de backup passa a navegar para `/settings`.
- **`js/ui/icons.js`:** adicione, no mesmo formato dos ícones atuais (24×24, traço `currentColor`, só `path`/`circle`/`rect`), os ícones da evolução inteira:
  - `settings` (engrenagem) e `chart` (gráfico de barras);
  - `share` (compartilhar), `map-pin` (alfinete de mapa) e `dice` (dado, para sortear);
  - `pin` (alfinete para fixar tag) e `link` (corrente);
  - `undo` (seta de desfazer).
  - O ícone `backup` pode ficar, mesmo sem uso.
- **`css/app.css`:** estilos de seção (`.settings-section`, `.settings-section__title`) com o espaçamento entre seções. Use as variáveis de cor existentes (`--color-*`), sem cor escrita direto, para o tema escuro do CARD-030 funcionar sozinho.
- **`sw.js`:** em `ASSETS`, troque `js/ui/screens/backup.js` por `js/ui/screens/settings.js`. Não mexa na versão.
- **`CLAUDE.md`:** na lista de rotas da seção Architecture, troque `#/backup` por `#/settings`.
- **`README.md`:** na tabela "Telas e navegação", a linha Backup vira Configurações (`#/settings`), "Preferências, backup, apagar dados e versão".

## Critérios de aceite
- [ ] Na tela inicial, o ícone do cabeçalho é uma engrenagem com o rótulo "Configurações", e tocar nele abre a tela "Configurações".
- [ ] A tela mostra, de cima para baixo, as seções Backup, Dados e Sobre. A Aparência entra no CARD-030.
- [ ] Baixar o backup, importar (mesclar e substituir) e apagar todos os dados funcionam exatamente como antes.
- [ ] A seção Sobre mostra "Diário de Rolê · Versão 1.0.0".
- [ ] O botão "Exportar" do lembrete de backup, na tela inicial, abre Configurações.
- [ ] Dado um favorito ou link antigo para `#/backup`, quando o abro, vou para Configurações, e o botão voltar não me leva de volta para `#/backup`.
- [ ] O voltar do Android, em Configurações, volta para a tela inicial.
- [ ] Configurações abre offline, depois de o app ter sido carregado uma vez com a versão nova.
- [ ] A tela fica legível e sem rolagem lateral num celular de 360 px.

## Como testar
**Validação manual (usuário)**
1. Sirva o app (Live Server) com "Update on reload" ligado no DevTools e abra a tela inicial.
2. Toque na engrenagem: abre Configurações, com Backup, Dados e Sobre (critérios 1, 2 e 4).
3. Exporte um backup, importe-o com "Mesclar" e depois apague tudo e importe de novo (critério 3).
4. Com o lembrete de backup visível (nunca exportou, ou backup com mais de 30 dias), toque em "Exportar" (critério 5).
5. Digite `#/backup` na barra de endereço, confira que cai em Configurações e aperte voltar (critério 6).
6. No modo celular do DevTools (360 px), use o voltar e confira o layout (critérios 7 e 9).
7. Ative o offline no DevTools e recarregue em `#/settings` (critério 8).

**Testes automatizados (quem implementa)**
- `node --test` deve continuar verde. O `tests/sw.test.js` do CARD-028 confere que `settings.js` está em `ASSETS` e que `backup.js` saiu.
- Não há regra nova em `services/`, então não há teste unitário novo.

## Observações
- A ordem Aparência → Backup → Dados → Sobre vem do refinamento. Aparência fica de fora aqui para o card não crescer.
- Os ícones de outras releases entram já aqui para os cards seguintes não disputarem `js/ui/icons.js`.

## Pendências
- [CARD-028 — Fundação: testes automatizados e versão única](CARD-028-testes-e-versao-unica.md)

## Justificativa da complexidade e do modelo
- **Complexidade M:** renomeia uma tela e a reorganiza em seções, mexe em rotas, na tela inicial e nos ícones, sem regra de negócio nova.
- **Modelo sonnet:** funcionalidade típica, de incerteza baixa e com padrões já existentes no projeto.

## Fora do escopo
- Seção Aparência e tema escuro (CARD-030).
- Botão "Compartilhar" no backup (CARD-031).
- Mudar qualquer comportamento de exportar, importar ou apagar.

## Referências
- RF20, RF23 e a tela T6 — `docs/refinamento.md`, seções "Requisitos funcionais", "Mapa de telas e navegação" e "Telas"
- `js/ui/screens/backup.js`, `js/app.js`, `js/router.js`, `js/ui/screens/home.js`, `js/ui/icons.js`
