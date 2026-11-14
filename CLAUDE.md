# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Diário de Rolê is a personal, offline-first PWA for tracking bars/restaurants ("Quero ir" → "Já fui") and the visits to each. Implementation follows the cards in wave order; check each card's `status` to see what is built. Planning docs:

- [docs/refinamento.md](docs/refinamento.md) — source of truth: requirements (RF01–RF33), business rules (RN01–RN30), screens (T1–T10), data model, backup format.
- [docs/cards/_index.md](docs/cards/_index.md) — 40 task cards with dependencies, suggested execution order (waves), and requirement traceability. Each card in `docs/cards/<NN-contexto>/CARD-XXX-*.md` has YAML frontmatter (`status: todo|...`, `depende_de`, `requisitos`) and acceptance criteria.

When implementing a card, read it plus the RF/RN items it references, respect `depende_de`, and update its `status` (in the card and in the `_index.md` table) when done. Cards with `status: descartado` (CARD-019 to CARD-025: photos, map, login/sync, React) were dropped on 2026-11-13 because they don't fit a local-only app — don't build them. Features that need a server (login, sync, sharing) belong to a possible new project, not this one.

**Language:** all code is in English: identifiers, file names, comments, routes, and the data model (stores `places`/`visits`/`meta`, fields like `name`, `type`, `placeId`, `rating`, `wouldReturn`, status values `want_to_go`/`been_there`, type codes like `bar`/`restaurant`, backup JSON keys). Only user-facing UI text is Brazilian Portuguese. Docs (refinamento, cards) are written in Portuguese but reference code names in English; the code/label mapping is in the data model section of the refinamento.

## Stack and commands

- HTML + CSS + vanilla JS (ES modules), **no build step, no bundler, no npm dependencies required** (the `idb` wrapper is optional).
- Run locally with any static server — ES modules don't load over `file://`:
  `python -m http.server 8000` (or VS Code Live Server).
- Tests use Node's built-in runner, with no npm dependencies: `node --test js tests` (pass the folders so it doesn't pick up tests inside `.claude/worktrees/`; single file: `node --test path/to/file.test.js`). **Every new rule in `services/` comes with a unit test** (RNF "Testes automatizados"), next to the module (`js/services/*.test.js`) or in `tests/`; tests must import modules without touching the DOM or IndexedDB, and test files never go into `ASSETS`. The GitHub Actions workflow "Testes" (`.github/workflows/test.yml`) runs `node --test` on every push to `dev` and `main` and on pull requests, so a local Node install is optional. `package.json` only sets `"type": "module"` for Node; the browser ignores it.
- Deployed to free static hosting with HTTPS (GitHub Pages / Netlify / Cloudflare Pages) — HTTPS is required for the service worker.

## Architecture

```
index.html, manifest.webmanifest, sw.js
css/app.css
js/app.js            entry point; registers SW
js/router.js         hash routes: #/  #/place/new  #/place/:id  #/place/:id/edit
                     #/place/:id/visit/new  #/visit/:id/edit  #/settings
js/db/               only layer that touches IndexedDB
js/services/         pure business rules, no DOM
js/ui/screens/, js/ui/components/
```

Strict layering — business rules stay testable in `services/` and the UI can change without touching them:
- `db/` → opens DB `diario-de-role`, stores `places` (indexes `name`, `type`, `tags` multiEntry, `status` — no `favorite` index because booleans aren't valid IDB keys), `visits` (`placeId`, `date`), `meta` (keyPath `key`: `schemaVersion`, `lastExportAt`, `persistentStorage`, `homeSort`, `theme`). No business rules here.
- `services/` → status transitions, average, filters, validation, import/export. No DOM.
- `ui/` → calls only `services/`, never `db/`. No business logic inside event handlers.

UI conventions (CARD-004):
- Routes are registered in `js/app.js` with lazy `import()`. A screen module exports `render(root, { params, query })` and may return a cleanup function. Navigate with `navigate(path)` / `replace(path)` / `goBack(fallback)` from `js/router.js` — not by setting `location.hash` — so history depth stays correct (`goBack` never leaves the app when it was opened on a deep link). After saving a form, leave with `returnTo(path)` (goes back if the previous screen is `path`, otherwise replaces). After deleting a record, use `resetTo(path)`: it unwinds the history to the first entry so back can't reach a screen of the deleted record. Screen state that should survive going back (e.g. the home tab, `#/?tab=been_there`) goes in the query via `setQuery()`, which replaces the entry without re-rendering.
- Anything modal (dialogs, bottom sheets) must call `openOverlay(onBack)` and `release()` on close, so the Android back button closes the overlay instead of leaving the screen. `confirmDialog()` and `openBottomSheet()` already do this.
- Build DOM with `h(tag, attrs, ...children)` from `js/ui/dom.js` (no innerHTML with user data); icons come from `js/ui/icons.js`.

Key invariants that span layers:
- IDs are `crypto.randomUUID()`; records carry ISO `createdAt`/`updatedAt` (merge-import resolves conflicts by most recent `updatedAt`); `db/util.js` `stamp()` sets them, while `bulkWrite` (import) writes records untouched.
- Status is stored; average (1 decimal) and last visit are computed. First visit flips `want_to_go` → `been_there`; deleting visits never flips it back (RN04).
- Deleting a place cascades to its visits in a single transaction (RN06). Import validates everything first and writes in one transaction — on failure nothing changes.
- Tags are case-insensitive and derived from places (no separate tag store). Place names are unique, compared case-insensitively and trimmed (RN10).
- `schemaVersion` lives in both `meta` and the backup JSON (`"app": "diario-de-role"`); schema changes go through `onupgradeneeded` migrations.

## Service worker gotchas

- The app version (`MAJOR.MINOR.PATCH`, RN19) is written only in `js/version.js` (classic script: `self.APP_VERSION = '…'`), loaded by `index.html` before the modules and by `sw.js` via `importScripts`. The cache name is derived from it: `CACHE_VERSION = CACHE_PREFIX + self.APP_VERSION` → `diario-<version>`; never write it by hand. `tests/sw.test.js` enforces this link and that `ASSETS` matches the files on disk. UI code reads the version through `getAppVersion()` in `js/services/app-info.js`.
- The SW is cache-first and the browser only installs a new SW when `sw.js` or a script it imports changes byte for byte: editing `home.js` alone leaves every installed copy on the old files forever. So **any app change must reach `main` (what GitHub Pages serves) with a bumped version in `js/version.js`**, not only when files are added. With the git workflow below, card branches never touch `js/version.js` (parallel bumps would conflict); the bump is a single commit on `dev` right before it is merged into `main`. Don't register the SW with `updateViaCache: 'all'`, or changes to `js/version.js` stop triggering updates. While developing, use DevTools → Application → Service workers → **Update on reload**.
- With no build, the precache list is a hand-maintained `ASSETS` constant in `sw.js` — **every new file must be added there** or it breaks offline mode.
- Never cache user data; it lives only in IndexedDB.

## Git workflow and subagents

Flow: `branch-por-card`. Each card is implemented on its own branch and merged into `dev` one at a time.

The subagent prompt template and the per-card checklist are in `docs/cards/_index.md`, section "Como implementar um card".

**Branches**
- `main` — stable; GitHub Pages publishes it. It only receives code from `dev`, and only when the user asks (a release). No card work is committed to it directly.
- `dev` — integration branch. Cards branch off it and are merged back into it.
- `card/<id>-<slug>` — one per card, created from an up-to-date `dev` (e.g. `card/CARD-028-ordenar-visitas`). Work without a card uses `fix/<slug>` or `docs/<slug>`.
- Commit messages in pt-BR, as in the history: `feat: <o que mudou> (CARD-XXX)`, `fix: …`, `docs: …`.

**When to delegate**
- By default, one card at a time: implement it, report, and wait for the user to say "próximo".
- Asking for subagents, or for a card that has `modelo_sugerido`, authorizes delegation: call the Agent tool (`general-purpose`) with `isolation: "worktree"` and `model` set to the card's `modelo_sugerido` or the model the user names. Asking to "implement the next wave" (or naming several cards) authorizes running them in parallel, in the background. Only parallelize cards of the same wave in `docs/cards/_index.md` that don't depend on each other and don't edit the same files (two cards that both change `js/ui/screens/home.js` run one after the other).
- Without delegation, this session implements the card itself, still on a `card/…` branch.

**Subagent rules** (the subagent starts with no context and can't ask the user anything, so put these in its prompt along with the card path):
- Read this CLAUDE.md, the card, the RF/RN items it references in `docs/refinamento.md`, and the premissas in `docs/cards/_index.md`.
- Create `card/<id>-<slug>` from `dev` inside its worktree, implement only what the card asks (its "Fora do escopo" is binding), and commit only on that branch. Never merge, rebase `dev`, push, or delete branches.
- Don't touch the version in `js/version.js` or `CHANGELOG.md`, but do add every new file to `ASSETS` in `sw.js`. Write the card's tests and run `node --test` (Node may be missing locally; then say so — CI runs them).
- Don't change the card's `status` or the `_index.md` table; the orchestrator does that after merging, which avoids conflicts between parallel branches.
- Nothing to install (no build, no dependencies). If it serves the app to test in headless Chrome, use a port of its own (e.g. 8000 + card number) so parallel agents don't collide.
- If a decision belongs to the user (business rule, product choice, something the card doesn't define), leave that part out, finish the rest, and return the question.
- Final report: branch and commits; files changed; each acceptance criterion and how it was met; tests run and results; deviations from the card and why; open questions.

**Orchestrator (this session), per card**
1. Before delegating, check that the `depende_de` cards are already merged into `dev`, and settle any open decision with the user.
2. Review `git diff dev...card/<id>-<slug>` against the card. Fixes go back to the same subagent (SendMessage), which keeps committing on the same branch.
3. Merge into `dev` one card at a time (`git merge --no-ff`). From the second card of a wave on, first merge `dev` into the card branch and retest. Resolve simple conflicts yourself; a conflict that changes behavior goes to the card's subagent or to the user.
4. After the merge, set `status: done` (in the card and in `_index.md`) in a commit on `dev`, delete the card branch and its worktree, and tell the user what to validate.
5. Don't push and don't touch `main` unless the user asks. A release is: in one commit on `dev`, bump the version in `js/version.js` (RN19: MINOR for features, PATCH for fixes only, MAJOR only when data compatibility breaks) and write its section in `CHANGELOG.md`; merge `dev` into `main`; create the annotated tag `vX.Y.Z` on `main`; push both branches and the tag.

## Constraints

- No servers, analytics, or external network calls (privacy requirement). Target is Chrome on Android, mobile-first (360 px width, 44 px touch targets).
