---
id: CARD-030
titulo: "Tema escuro"
contexto: configuracoes
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: mvp
incerteza: media
modelo_sugerido: sonnet
status: done
requisitos: [RF21, RN17, RNF-acessibilidade]
depende_de: [CARD-029]
---

# CARD-030 — Tema escuro

## Contexto
O app só tem tema claro, e é usado à noite, em bar. A tela de Configurações (CARD-029) ganha a seção Aparência, com a escolha entre Automático, Claro e Escuro. As cores já são variáveis CSS (`--color-*` em `css/app.css`), o que facilita criar a versão escura.

## Objetivo
Oferecer o tema escuro. A escolha fica na seção Aparência, é lembrada no aparelho e vale desde a abertura do app, sem piscar o tema errado.

## Detalhamento técnico
- **`js/services/theme.js` (novo):**
  - `export const THEMES = ['auto', 'light', 'dark'];` e `export const DEFAULT_THEME = 'auto';`.
  - `normalizeTheme(value)`: devolve o valor se ele estiver em `THEMES`; caso contrário, devolve `'auto'`.
  - `async getTheme()`: lê `meta.get('theme')` de `js/db/meta.js` e normaliza.
  - `async setTheme(value)`: normaliza e grava com `meta.set('theme', value)`.
  - O tema não entra no backup (`createBackup` não muda) e não é apagado por "Apagar todos os dados" (`eraseAllData` só remove `lastExportAt`). Isso não precisa de código novo, só de conferir.
- **`js/ui/theme.js` (novo), camada de interface:**
  - `applyTheme(theme)`:
    - com `'light'` ou `'dark'`, define `document.documentElement.dataset.theme`; com `'auto'`, remove o atributo;
    - grava uma cópia em `localStorage['diario-theme']` (dentro de `try/catch`, porque o `localStorage` pode falhar);
    - atualiza o `<meta name="theme-color">` com a cor da barra do sistema do tema efetivo: `#c2410c` no claro e a cor de fundo escura no escuro.
  - `initTheme()`: chamada em `js/app.js` logo depois de `openDatabase()`.
    - Lê `getTheme()` e chama `applyTheme`, o que corrige a cópia local se ela estiver diferente (por exemplo, `localStorage` limpo).
    - Registra `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)`, que atualiza o `theme-color` quando o tema é `'auto'`.
- **`index.html`:**
  - Script inline no `<head>`, **antes** do `<link rel="stylesheet">`, para aplicar o tema antes de a tela aparecer:
    ```html
    <script>try{var t=localStorage.getItem('diario-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
    ```
  - Adicione `<meta name="color-scheme" content="light dark">`.
- **`css/app.css`:**
  - Paleta escura nas mesmas variáveis, em dois blocos com os mesmos valores:
    - `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`
    - `:root[data-theme="dark"] { … }`
  - Ponto de partida, a ajustar para contraste WCAG AA:
    - `--color-bg: #1c1917`, `--color-surface: #292524`, `--color-text: #f5f5f4`, `--color-muted: #a8a29e`, `--color-border: #44403c`;
    - `--color-primary: #fb923c`, `--color-primary-strong: #fdba74`, `--color-on-primary: #1c1917`;
    - `--color-danger: #f87171`, `--color-backdrop: rgb(0 0 0 / 0.6)`.
  - Procure no CSS cores escritas direto (hex ou `rgb` fora do `:root`), como estrelas, coração, toast, banner e sombras, e troque por variáveis, criando variáveis novas quando faltar.
  - Confira os componentes em todas as telas: cards, chips de tag, painéis inferiores (`<dialog>`), confirmações, toast, aviso de versão nova, formulários (`input`, `select`, `textarea`, data), estrelas e coração.
- **`js/ui/screens/settings.js`:**
  - Seção "Aparência" como a **primeira** da tela, com um grupo de escolha única ("Automático", "Claro", "Escuro").
  - Reaproveite os estilos `.choice` já usados no "voltaria?" do formulário de visita. O grupo precisa de `role="radiogroup"` e `aria-label="Tema"`.
  - Ao mudar a escolha: `await setTheme(value)` e `applyTheme(value)`. Se `setTheme` falhar, mostre o toast "Não foi possível salvar o tema." e volte a marcar a opção anterior.
- **`js/app.js`:** importe e chame `initTheme()` depois de abrir o banco.
- **`sw.js`:** adicione `js/services/theme.js` e `js/ui/theme.js` em `ASSETS`. Não mexa na versão.

## Critérios de aceite
- [ ] Configurações mostra a seção Aparência no topo, com "Automático" marcado na primeira vez.
- [ ] Com "Automático", o app segue o modo do celular e troca na hora quando o modo do celular muda, sem recarregar.
- [ ] Com "Escuro" (ou "Claro"), o app fica sempre nesse tema, mesmo com o celular no outro modo, e continua assim ao fechar e reabrir.
- [ ] Ao abrir o app no tema escuro, a tela não pisca branco antes.
- [ ] No tema escuro, todas as telas e painéis ficam legíveis: textos, botões, chips, estrelas, coração, formulários, toast e aviso de versão. Nenhum elemento fica claro demais ou invisível.
- [ ] A barra de status do Android acompanha o tema (escura no escuro).
- [ ] Depois de "Apagar todos os dados", o tema escolhido continua o mesmo.
- [ ] O arquivo de backup exportado não contém o tema.
- [ ] Funciona offline.

## Como testar
**Validação manual (usuário)**
1. Abra Configurações e confira a seção Aparência (critério 1).
2. Com "Automático", troque o modo do sistema (ou use DevTools → Rendering → `prefers-color-scheme`) e veja o app mudar (critério 2).
3. Escolha "Escuro", feche e reabra o app (ou recarregue). Ele abre escuro direto, sem flash branco (critérios 3 e 4).
4. Passe por todas as telas no escuro: tela inicial com cards e filtros, ordenação, detalhe, formulários de lugar e visita, confirmação de exclusão, Configurações e o toast. Confira a legibilidade (critério 5).
5. No celular, com o app instalado, confira a barra de status (critério 6).
6. Apague todos os dados e confira que o tema continua (critério 7). Exporte e abra o JSON (critério 8).
7. Ative o offline e recarregue (critério 9).

**Testes automatizados (quem implementa)**
- `js/services/theme.test.js`: `normalizeTheme` aceita os três valores e devolve `'auto'` para `undefined`, `null`, `'blue'` e `1`.
- Comando: `node --test`.

## Observações
- A fonte oficial do tema é `meta.theme`. O `localStorage` é só uma cópia para o script do `<head>`, que roda antes do IndexedDB abrir. Ele pode estar vazio (modo anônimo, dados limpos) sem quebrar nada.
- Os valores da paleta escura são ponto de partida: ajuste para o contraste AA, mantendo a identidade laranja.

## Pendências
- [CARD-029 — Tela de Configurações](CARD-029-tela-de-configuracoes.md)

## Justificativa da complexidade e do modelo
- **Complexidade M:** toca CSS de todos os componentes, um serviço pequeno e a aplicação do tema antes dos módulos.
- **Modelo sonnet:** funcionalidade típica. A incerteza média vem do contraste e do flash, verificáveis à mão; não é área de risco que justifique opus.

## Fora do escopo
- Escolher cores ou temas personalizados.
- Mudar o `theme_color` e o `background_color` do `manifest.webmanifest` (a tela de abertura do Android continua clara).
- Botão "Compartilhar" do backup (CARD-031).

## Referências
- RF21, RN17, RNF "Acessibilidade" — `docs/refinamento.md`
- "Evolução 1.1–1.4: pontos técnicos" (tema sem piscar) — `docs/refinamento.md`, seção "Visão técnica"
- `css/app.css`, `index.html`, `js/app.js`, `js/db/meta.js`, `js/ui/screens/settings.js`, `js/ui/screens/visit-form.js` (estilo `.choice`)
