# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Diário de Rolê is a personal, offline-first PWA for tracking bars/restaurants ("Quero ir" → "Já fui") and the visits to each. Implementation follows the cards in wave order; check each card's `status` to see what is built. Planning docs:

- [docs/refinamento.md](docs/refinamento.md) — source of truth: requirements (RF01–RF17), business rules (RN01–RN12), screens (T1–T6), data model, backup format.
- [docs/cards/_index.md](docs/cards/_index.md) — 25 task cards with dependencies, suggested execution order (waves), and requirement traceability. Each card in `docs/cards/<NN-contexto>/CARD-XXX-*.md` has YAML frontmatter (`status: todo|...`, `depende_de`, `requisitos`) and acceptance criteria.

When implementing a card, read it plus the RF/RN items it references, respect `depende_de`, and update its `status` (in the card and in the `_index.md` table) when done. Cards marked `prioridade: depois` (photos, map, login/sync, React) are out of MVP scope — don't build them early.

All docs, UI text, and domain identifiers are in Brazilian Portuguese (`lugares`, `visitas`, `nota`, `voltaria`, `quero_ir`/`ja_fui`). Keep code identifiers in Portuguese to match.

## Stack and commands

- HTML + CSS + vanilla JS (ES modules), **no build step, no bundler, no npm dependencies required** (the `idb` wrapper is optional).
- Run locally with any static server — ES modules don't load over `file://`:
  `python -m http.server 8000` (or VS Code Live Server).
- Tests are optional; pure functions in `js/services/` can be tested with Node's built-in runner: `node --test` (single file: `node --test path/to/file.test.js`).
- Deployed to free static hosting with HTTPS (GitHub Pages / Netlify / Cloudflare Pages) — HTTPS is required for the service worker.

## Architecture (planned, see CARD-001–004)

```
index.html, manifest.webmanifest, sw.js
css/app.css
js/app.js            entry point; registers SW
js/router.js         hash routes: #/  #/lugar/novo  #/lugar/:id  #/lugar/:id/editar
                     #/lugar/:id/visita/nova  #/visita/:id/editar  #/backup
js/db/               only layer that touches IndexedDB
js/services/         pure business rules, no DOM
js/ui/telas/, js/ui/componentes/
```

Strict layering — this is what makes the future React migration (CARD-025) a UI-only rewrite:
- `db/` → opens DB `diario-de-role`, stores `lugares` (indexes `nome`, `tipo`, `tags` multiEntry, `status` — no `favorito` index because booleans aren't valid IDB keys), `visitas` (`lugarId`, `data`), `meta` (keyPath `chave`: `schemaVersion`, `ultimoExportEm`). No business rules here.
- `services/` → status transitions, average, filters, validation, import/export. No DOM.
- `ui/` → calls only `services/`, never `db/`. No business logic inside event handlers.

Key invariants that span layers:
- IDs are `crypto.randomUUID()`; records carry ISO `criadoEm`/`atualizadoEm` (merge-import resolves conflicts by most recent `atualizadoEm`).
- Status is stored; average (1 decimal) and last visit are computed. First visit flips `quero_ir` → `ja_fui`; deleting visits never flips it back (RN04).
- Deleting a lugar cascades to its visitas in a single transaction (RN06). Import validates everything first and writes in one transaction — on failure nothing changes.
- Tags are case-insensitive and derived from lugares (no separate tag store). Lugar names are unique, compared case-insensitively and trimmed (RN10).
- `schemaVersion` lives in both `meta` and the backup JSON (`"app": "diario-de-role"`); schema changes go through `onupgradeneeded` migrations.

## Service worker gotchas

- Cache is versioned (`diario-vN`); **bump the version on every deploy** or users won't get updates.
- With no build, the precache list is a hand-maintained `ASSETS` constant in `sw.js` — **every new file must be added there** or it breaks offline mode.
- Never cache user data; it lives only in IndexedDB.

## Constraints

- No servers, analytics, or external network calls (privacy requirement). Target is Chrome on Android, mobile-first (360 px width, 44 px touch targets).
