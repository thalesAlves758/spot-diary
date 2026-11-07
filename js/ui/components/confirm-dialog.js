import { h } from '../dom.js';
import { openOverlay } from '../../router.js';

/**
 * Confirmation dialog. Resolves `true` when confirmed and `false` when cancelled in any way
 * (Cancel button, Esc, tapping the backdrop, or the Android back button).
 */
export function confirmDialog({
  title,
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
}) {
  return new Promise((resolve) => {
    let done = false;
    let release = () => {};

    const finish = (result, fromBack = false) => {
      if (done) return;
      done = true;
      dialog.close();
      dialog.remove();
      if (!fromBack) release();
      resolve(result);
    };

    const dialog = h('dialog', { class: 'dialog', 'aria-labelledby': 'dialog-title' },
      h('h2', { class: 'dialog__title', id: 'dialog-title' }, title),
      message && h('p', { class: 'dialog__message' }, message),
      h('div', { class: 'dialog__actions' },
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => finish(false) }, cancelLabel),
        h('button', {
          type: 'button',
          class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`,
          onclick: () => finish(true),
        }, confirmLabel),
      ),
    );

    // Esc
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });
    // Tap on the backdrop (the click lands on the <dialog> itself, outside its content box)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) finish(false);
    });

    document.body.append(dialog);
    dialog.showModal();
    release = openOverlay(() => finish(false, true));
  });
}
