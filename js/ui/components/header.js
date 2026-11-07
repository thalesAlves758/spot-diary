import { h } from '../dom.js';
import { icon } from '../icons.js';
import { goBack } from '../../router.js';

/**
 * Screen header.
 * - `title`: text shown in the header
 * - `back`: shows the back button (goes back in history, or to `backFallback` if there is none)
 * - `actions`: elements placed on the right (e.g. icon buttons)
 */
export function createHeader({ title, back = false, backFallback = '/', actions = [] }) {
  return h('header', { class: 'app-header' },
    back && h('button', {
      type: 'button',
      class: 'icon-btn',
      'aria-label': 'Voltar',
      onclick: () => goBack(backFallback),
    }, icon('back')),
    h('h1', { class: 'app-header__title' }, title),
    h('div', { class: 'app-header__actions' }, actions),
  );
}

/** Round icon-only button with an accessible label. */
export function iconButton({ name, label, onClick, href }) {
  return href
    ? h('a', { class: 'icon-btn', href, 'aria-label': label }, icon(name))
    : h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, onclick: onClick }, icon(name));
}
