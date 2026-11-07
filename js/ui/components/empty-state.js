import { h } from '../dom.js';

/**
 * Message for empty lists or "no results".
 * `action`: optional `{ label, onClick }` or `{ label, href }`.
 */
export function createEmptyState({ title, message = '', action = null }) {
  let button = null;
  if (action?.href) button = h('a', { class: 'btn btn-primary', href: action.href }, action.label);
  else if (action) button = h('button', { type: 'button', class: 'btn btn-primary', onclick: action.onClick }, action.label);

  return h('div', { class: 'empty-state' },
    h('p', { class: 'empty-state__title' }, title),
    message && h('p', { class: 'empty-state__message' }, message),
    button,
  );
}
