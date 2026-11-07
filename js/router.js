// Hash router. Every screen change is a history entry, so the Android back button works.
// Overlays (dialogs, bottom sheets) also push an entry: back closes the overlay instead of
// leaving the screen (or the app, on the home screen).

/**
 * A screen module exports `render(root, { params, query })`.
 * It may return (or resolve to) a cleanup function, called before the next screen renders.
 */
const routes = [];
let root = null;
let cleanup = null;
let renderToken = 0;

const overlays = [];        // stack of { onBack, pushed }

// history.back() is async. Backs we trigger ourselves (when an overlay closes by itself) are
// counted here; any other history change waits for `idle` so entries are never popped out of order
// (e.g. a second dialog opening right after the first one closed).
let pendingBacks = 0;
let idle = Promise.resolve();
let resolveIdle = null;

/** Registers a route pattern such as `/place/:id/edit`. */
export function route(pattern, load) {
  const names = [];
  const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, name) => {
    names.push(name);
    return '([^/]+)';
  }) + '$');
  routes.push({ regex, names, load });
}

/** Starts listening to history and renders the current route. */
export function startRouter(container) {
  root = container;
  if (!location.hash) history.replaceState({ depth: 0 }, '', '#/');
  else if (typeof history.state?.depth !== 'number') history.replaceState({ depth: 0 }, '', location.href);
  window.addEventListener('popstate', onPopState);
  render();
}

/** Goes to a path like `/place/123` (adds a history entry). */
export async function navigate(path) {
  await idle;
  history.pushState({ depth: depth() + 1 }, '', '#' + path);
  render();
}

/** Replaces the current entry with `path` (no new history entry). */
export async function replace(path) {
  await idle;
  history.replaceState({ depth: depth() }, '', '#' + path);
  render();
}

/**
 * Back button inside the app. If the app was opened directly on this screen (nothing to go back
 * to inside the app), goes to `fallback` instead of leaving the app.
 */
export function goBack(fallback = '/') {
  if (depth() > 0) history.back();
  else replace(fallback);
}

/**
 * Registers an open overlay. `onBack` is called if the user presses back while it is open.
 * Returns `release()`, to call when the overlay closes by itself (button, Esc, backdrop).
 */
export function openOverlay(onBack) {
  const entry = { onBack };
  overlays.push(entry);
  entry.pushed = idle.then(() => {
    history.pushState({ depth: depth(), overlay: true }, '', location.href);
  });
  return function release() {
    const i = overlays.indexOf(entry);
    if (i === -1) return; // already closed by back
    overlays.splice(i, 1);
    // Mark the back as pending right away, so a navigate() called next waits for it.
    if (pendingBacks++ === 0) idle = new Promise((resolve) => { resolveIdle = resolve; });
    entry.pushed.then(() => history.back());
  };
}

function depth() {
  return history.state?.depth ?? 0;
}

function onPopState(event) {
  if (pendingBacks > 0) {
    // A pop we triggered when an overlay closed itself: nothing to render.
    if (--pendingBacks === 0) resolveIdle();
    return;
  }
  if (overlays.length) {
    overlays.pop().onBack();
    return;
  }
  // A plain <a href="#/..."> link creates an entry without state: give it a depth.
  if (event.state === null) history.replaceState({ depth: lastRenderedDepth + 1 }, '', location.href);
  render();
}

let lastRenderedDepth = 0;

function parseHash() {
  const raw = location.hash.slice(1) || '/';
  const [path, search = ''] = raw.split('?');
  return { path, query: new URLSearchParams(search) };
}

async function render() {
  const token = ++renderToken;
  const { path, query } = parseHash();
  let match = null;
  let params = {};
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      match = r;
      params = Object.fromEntries(r.names.map((name, i) => [name, decodeURIComponent(m[i + 1])]));
      break;
    }
  }
  if (!match) {
    replace('/');
    return;
  }

  // Overlays belong to the previous screen.
  while (overlays.length) overlays.pop().onBack();

  const screen = await match.load();
  if (token !== renderToken) return;

  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  root.replaceChildren();
  lastRenderedDepth = depth();
  window.scrollTo(0, 0);

  const result = await screen.render(root, { params, query });
  if (token === renderToken) cleanup = result;
  else if (typeof result === 'function') result();
}
