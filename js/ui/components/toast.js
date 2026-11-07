import { h } from '../dom.js';

let region = null;

/** Short message at the bottom of the screen, announced to screen readers. */
export function showToast(message, { duration = 2500 } = {}) {
  if (!region || !region.isConnected) {
    region = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.append(region);
  }
  const toast = h('div', { class: 'toast' }, message);
  region.append(toast);
  setTimeout(() => {
    toast.classList.add('toast--leaving');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
