# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Diário de Rolê is a personal, offline-first PWA for tracking bars/restaurants ("Quero ir" → "Já fui") and the visits to each. Implementation follows the cards in wave order; check each card's `status` to see what is built. Planning docs:

- [docs/refinamento.md](docs/refinamento.md) — source of truth: requirements (RF01–RF18), business rules (RN01–RN12), screens (T1–T6), data model, backup format.
- [docs/cards/_index.md](docs/cards/_index.md) — 26 task cards with dependencies, suggested execution order (waves), and requirement traceability. Each card in `docs/cards/<NN-contexto>/CARD-XXX-*.md` has YAML frontmatter (`status: todo|...`, `depende_de`, `requisitos`) and acceptance criteria.

When implementing a card, read it plus the RF/RN items it references, respect `depende_de`, and update its `status` (in the card and in the `_index.md` table) when done. Cards marked `prioridade: depois` (photos, map, login/sync, React) are out of MVP scope — don't build them early.

**Language:** all code is in English: identifiers, file names, comments, routes, and the data model (stores `places`/`visits`/`meta`, fields like `name`, `type`, `placeId`, `rating`, `wouldReturn`, status values `want_to_go`/`been_there`, type codes like `bar`/`restaurant`, backup JSON keys). Only user-facing UI text is Brazilian Portuguese. Docs (refinamento, cards) are written in Portuguese but reference code names in English; the code/label mapping is in the data model section of the refinamento.

## Stack and commands

- HTML + CSS + vanilla JS (ES modules), **no build step, no bundler, no npm dependencies required** (the `idb` wrapper is optional).
- Run locally with any static server — ES modules don't load over `file://`:
  `python -m http.server 8000` (or VS Code Live Server).
- Tests are optional; pure functions in `js/services/` can be tested with Node's built-in runner: `node --test` (single file: `node --test path/to/file.test.js`).
- Deployed to free static hosting with HTTPS (GitHub Pages / Netlify / Cloudflare Pages) — HTTPS is required for the service worker.

## Architecture

```
index.html, manifest.webmanifest, sw.js
css/app.css
js/app.js            entry point; registers SW
js/router.js         hash routes: #/  #/place/new  #/place/:id  #/place/:id/edit
                     #/place/:id/visit/new  #/visit/:id/edit  #/backup
js/db/               only layer that touches IndexedDB
js/services/         pure business rules, no DOM
js/ui/screens/, js/ui/components/
```

Strict layering — this is what makes the future React migration (CARD-025) a UI-only rewrite:
- `db/` → opens DB `diario-de-role`, stores `places` (indexes `name`, `type`, `tags` multiEntry, `status` — no `favorite` index because booleans aren't valid IDB keys), `visits` (`placeId`, `date`), `meta` (keyPath `key`: `schemaVersion`, `lastExportAt`, `persistentStorage`). No business rules here.
- `services/` → status transitions, average, filters, validation, import/export. No DOM.
- `ui/` → calls only `services/`, never `db/`. No business logic inside event handlers.

UI conventions (CARD-004):
- Routes are registered in `js/app.js` with lazy `import()`. A screen module exports `render(root, { params, query })` and may return a cleanup function. Navigate with `navigate(path)` / `replace(path)` / `goBack(fallback)` from `js/router.js` — not by setting `location.hash` — so history depth stays correct (`goBack` never leaves the app when it was opened on a deep link). Screen state that should survive going back (e.g. the home tab, `#/?tab=been_there`) goes in the query via `setQuery()`, which replaces the entry without re-rendering.
- Anything modal (dialogs, bottom sheets) must call `openOverlay(onBack)` and `release()` on close, so the Android back button closes the overlay instead of leaving the screen. `confirmDialog()` and `openBottomSheet()` already do this.
- Build DOM with `h(tag, attrs, ...children)` from `js/ui/dom.js` (no innerHTML with user data); icons come from `js/ui/icons.js`.

Key invariants that span layers:
- IDs are `crypto.randomUUID()`; records carry ISO `createdAt`/`updatedAt` (merge-import resolves conflicts by most recent `updatedAt`); `db/util.js` `stamp()` sets them, while `bulkWrite` (import) writes records untouched.
- Status is stored; average (1 decimal) and last visit are computed. First visit flips `want_to_go` → `been_there`; deleting visits never flips it back (RN04).
- Deleting a place cascades to its visits in a single transaction (RN06). Import validates everything first and writes in one transaction — on failure nothing changes.
- Tags are case-insensitive and derived from places (no separate tag store). Place names are unique, compared case-insensitively and trimmed (RN10).
- `schemaVersion` lives in both `meta` and the backup JSON (`"app": "diario-de-role"`); schema changes go through `onupgradeneeded` migrations.

## Service worker gotchas

- Cache is versioned (`diario-vN`); **bump the version on every deploy** or users won't get updates.
- With no build, the precache list is a hand-maintained `ASSETS` constant in `sw.js` — **every new file must be added there** or it breaks offline mode.
- Never cache user data; it lives only in IndexedDB.

## Constraints

- No servers, analytics, or external network calls (privacy requirement). Target is Chrome on Android, mobile-first (360 px width, 44 px touch targets).
