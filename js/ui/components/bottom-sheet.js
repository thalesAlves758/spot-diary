import { h } from '../dom.js';
import { icon } from '../icons.js';
import { openOverlay } from '../../router.js';

/**
 * Panel that slides up from the bottom (used by the filters).
 * - `content`: node(s) for the body
 * - `footer`: node(s) for the fixed bottom bar (e.g. "Limpar" / "Aplicar")
 * - `onClose`: called once when the sheet closes, however it was closed
 * Returns `{ close }`.
 */
export function openBottomSheet({ title, content, footer = null, onClose = () => {} }) {
  let closed = false;
  let release = () => {};

  const close = (fromBack = false) => {
    if (closed) return;
    closed = true;
    sheet.close();
    sheet.remove();
    if (!fromBack) release();
    onClose();
  };

  const sheet = h('dialog', { class: 'sheet', 'aria-labelledby': 'sheet-title' },
    h('div', { class: 'sheet__header' },
      h('h2', { class: 'sheet__title', id: 'sheet-title' }, title),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Fechar', onclick: () => close() }, icon('close')),
    ),
    h('div', { class: 'sheet__body' }, content),
    footer && h('div', { class: 'sheet__footer' }, footer),
  );

  sheet.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) close();
  });

  document.body.append(sheet);
  sheet.showModal();
  release = openOverlay(() => close(true));

  return { close: () => close() };
}
