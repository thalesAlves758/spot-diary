import { h } from '../dom.js';

// "Depois" hides the reminder until the app is opened again (a full page load resets this).
let dismissedThisSession = false;

export function isBackupReminderDismissed() {
  return dismissedThisSession;
}

/** Banner "Faz tempo que você não faz backup" with "Exportar agora" and "Depois" (CARD-018). */
export function createBackupReminder({ neverExported, onExport }) {
  const banner = h('section', { class: 'reminder', role: 'region', 'aria-label': 'Lembrete de backup' },
    h('p', { class: 'reminder__title' },
      neverExported ? 'Você ainda não fez nenhum backup' : 'Faz tempo que você não faz backup'),
    h('p', { class: 'reminder__text' },
      'Seus dados ficam só neste aparelho. Exporte um backup para não perder nada.'),
    h('div', { class: 'reminder__actions' },
      h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { dismissedThisSession = true; banner.remove(); } }, 'Depois'),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: onExport }, 'Exportar agora'),
    ),
  );
  return banner;
}
