# Diário de Rolê

PWA pessoal e offline para guardar os lugares que você quer conhecer e o histórico de cada visita. Tudo fica no aparelho (IndexedDB); não há servidor, login nem analytics.

Documentação: [refinamento](docs/refinamento.md) · [cards](docs/cards/_index.md).

## Estrutura

```
index.html              página única
manifest.webmanifest    manifest do PWA
sw.js                   service worker (cache offline)
css/app.css
js/app.js               ponto de entrada
js/db/                  único ponto que conhece o IndexedDB
js/services/            regras de negócio puras (sem DOM)
js/ui/telas/            telas
js/ui/componentes/      componentes reutilizáveis
icons/
docs/
```

Regra de ouro: `ui/` só chama `services/`; `services/` não toca no DOM; só `db/` conhece o IndexedDB.

## Rodar localmente

Não há etapa de build, mas ES modules não funcionam abrindo o arquivo direto (`file://`). Sirva a pasta por HTTP com qualquer servidor estático:

- **VS Code:** extensão Live Server → "Open with Live Server".
- **Python:** `python -m http.server 8000` e abra http://localhost:8000.
- **Node:** `npx serve .`

`localhost` conta como contexto seguro, então o service worker também funciona localmente.

### Testar no celular

O service worker exige HTTPS fora do `localhost`. Para testar no Android, use a versão publicada ou o *port forwarding* do Chrome (`chrome://inspect` → Port forwarding `8000 → localhost:8000`).

## Publicar (GitHub Pages)

1. Crie o repositório `diario-de-role` no GitHub e envie o código:
   ```
   git init
   git add .
   git commit -m "Estrutura inicial"
   git branch -M main
   git remote add origin https://github.com/<usuario>/diario-de-role.git
   git push -u origin main
   ```
2. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. O app fica em `https://<usuario>.github.io/diario-de-role/` (HTTPS automático).

Todos os caminhos do app são relativos, então ele funciona em subpasta. Netlify ou Cloudflare Pages também servem: basta publicar a pasta raiz, sem comando de build.

## Atualizar o app publicado

A cada publicação, aumente a versão do cache em `sw.js` (ex.: `diario-v1` → `diario-v2`) e inclua qualquer arquivo novo na lista `ASSETS`. Sem isso o app instalado não recebe a atualização.
