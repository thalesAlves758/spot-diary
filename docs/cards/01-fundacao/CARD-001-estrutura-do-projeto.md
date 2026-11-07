---
id: CARD-001
titulo: "Estrutura do projeto e publicação"
contexto: fundacao
tipo: setup
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RNF-plataforma, RNF-privacidade, RNF-custo]
depende_de: []
---

# CARD-001 — Estrutura do projeto e publicação

## Contexto
Base do PWA, sem etapa de build: estrutura de pastas em camadas (`db/`, `services/`, `ui/`), manifest e publicação numa hospedagem estática gratuita com HTTPS. Todos os outros cards partem daqui.

## O que fazer
- Criar o repositório `diario-de-role` com a estrutura:
  ```
  index.html
  manifest.webmanifest
  sw.js                (vazio por enquanto, CARD-003)
  css/app.css
  js/app.js
  js/db/  js/services/  js/ui/telas/  js/ui/componentes/
  icons/
  docs/                (refinamento e cards)
  ```
- `index.html` com meta viewport, `theme-color`, link para o manifest e `<script type="module" src="js/app.js">`.
- `manifest.webmanifest`: `name` "Diário de Rolê", `short_name`, `start_url`, `display: standalone`, cores de tema e fundo, ícones 192 e 512 px (um deles `maskable`).
- `js/app.js` com o bootstrap vazio (ponto de entrada).
- README com como rodar localmente (servidor estático, ex.: `python -m http.server` ou Live Server do VS Code) e como publicar.
- Publicar no GitHub Pages (ou Netlify / Cloudflare Pages) com HTTPS.

## Critérios de aceite
- [ ] Dado o repositório publicado, quando acesso a URL no Chrome do Android, então a página carrega via HTTPS sem erros no console.
- [ ] Dado o manifest, quando abro DevTools > Application > Manifest, então nome, ícones e `standalone` aparecem sem avisos.
- [ ] Nenhum script de analytics nem chamada a servidor externo no projeto (RNF Privacidade).

## Notas técnicas
- ES modules não funcionam via `file://`: sempre servir por HTTP local.
- Ícones podem ser provisórios; trocar depois não afeta nada.

## Fora do escopo
Service worker e offline (CARD-003), roteamento e telas (CARD-004).

## Justificativa da complexidade
M: vários arquivos de base e configuração de hospedagem, sem lógica de negócio.
