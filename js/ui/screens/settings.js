// T6 — Configurações. Export: CARD-016. Import: CARD-017. Erase all data: CARD-026. Settings screen: CARD-029.
import { h } from '../dom.js';
import { resetTo } from '../../router.js';
import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm-dialog.js';
import { formatDateTime, formatLocalDate, plural } from '../format.js';
import {
  buildBackup, serializeBackup, backupFileName, markExported, getLastExportAt, countData,
} from '../../services/backup.js';
import { parseBackup, importBackup, IMPORT_MODE } from '../../services/backup-import.js';
import { eraseAllData } from '../../services/data-reset.js';
import { ImportError } from '../../services/errors.js';
import { getAppVersion } from '../../services/app-info.js';

const places = (n) => plural(n, 'lugar', 'lugares');
const visits = (n) => plural(n, 'visita', 'visitas');

// Sections that show counts register here; called after an import changes the data.
let countListeners = [];
async function refreshCounts() {
  const counts = await countData();
  for (const listener of countListeners) listener(counts);
}

export async function render(root) {
  const [lastExportAt, counts] = await Promise.all([getLastExportAt(), countData()]);
  countListeners = [];

  root.append(
    createHeader({ title: 'Configurações', back: true }),
    h('main', { class: 'page' },
      buildSection('Backup',
        buildExportPanel(lastExportAt, counts),
        buildImportPanel(),
      ),
      buildSection('Dados', buildErasePanel(counts)),
      buildSection('Sobre', h('p', { class: 'panel__text' }, `Diário de Rolê · Versão ${getAppVersion()}`)),
    ),
  );
}

/** A titled block of the settings screen. */
function buildSection(title, ...content) {
  return h('section', { class: 'settings-section' },
    h('h2', { class: 'settings-section__title' }, title),
    ...content,
  );
}

// ---------------------------------------------------------------- Export (CARD-016)

const refreshExportCounts = () => refreshCounts();

function buildExportPanel(lastExportAt, counts) {
  const lastExportText = h('p', { class: 'backup__last', 'aria-live': 'polite' });
  const showLastExport = (iso) => {
    lastExportText.textContent = iso
      ? `Último backup: ${formatDateTime(iso)}`
      : 'Você ainda não fez nenhum backup.';
  };
  showLastExport(lastExportAt);

  const countsText = h('p', { class: 'panel__text', id: 'export-counts' });
  const showCounts = (c) => { countsText.textContent = `Serão exportados ${places(c.places)} e ${visits(c.visits)}.`; };
  showCounts(counts);
  countListeners.push(showCounts);

  const exportButton = h('button', { type: 'button', class: 'btn btn-primary btn-block' }, 'Exportar');
  exportButton.addEventListener('click', async () => {
    exportButton.disabled = true;
    exportButton.textContent = 'Exportando…';
    try {
      const backup = await buildBackup();
      downloadText(serializeBackup(backup), backupFileName(new Date(backup.exportedAt)), 'application/json');
      await markExported(backup.exportedAt);
      showLastExport(backup.exportedAt);
      showToast('Backup exportado');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível exportar. Tente de novo.');
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = 'Exportar';
    }
  });

  return h('section', { class: 'panel', 'aria-labelledby': 'export-title' },
    h('h3', { class: 'panel__title', id: 'export-title' }, 'Exportar'),
    h('p', { class: 'panel__text' },
      'Seus dados ficam só neste aparelho. Exporte um backup de vez em quando e guarde o arquivo '
      + 'fora do celular (Drive, e-mail, computador).'),
    countsText,
    lastExportText,
    exportButton,
  );
}

/** Saves text as a file (goes to Downloads on Android). */
function downloadText(text, fileName, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = h('a', { href: url, download: fileName, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---------------------------------------------------------------- Erase all data (CARD-026)

function buildErasePanel(initialCounts) {
  let counts = initialCounts;
  const button = h('button', { type: 'button', class: 'btn btn-danger btn-block' });
  const showState = (c) => {
    counts = c;
    const empty = c.places === 0 && c.visits === 0;
    button.disabled = empty;
    button.textContent = empty ? 'Não há dados para apagar' : 'Apagar todos os dados';
  };
  showState(initialCounts);
  countListeners.push(showState);

  button.addEventListener('click', async () => {
    const lastExportAt = await getLastExportAt();
    const step1 = await confirmDialog({
      title: 'Apagar todos os dados?',
      message: `Serão apagados ${places(counts.places)} e ${visits(counts.visits)}. `
        + (lastExportAt
          ? `Seu último backup foi em ${formatLocalDate(lastExportAt)}.`
          : 'Você nunca fez backup — exporte antes se quiser guardar esses dados.'),
      confirmLabel: 'Continuar',
    });
    if (!step1) return;
    const step2 = await confirmDialog({
      title: 'Tem certeza?',
      message: 'Essa ação não pode ser desfeita.',
      confirmLabel: 'Apagar tudo',
      danger: true,
    });
    if (!step2) return;

    button.disabled = true;
    try {
      await eraseAllData();
      showToast('Todos os dados foram apagados');
      // Clears the history too, so back can't reach screens of places that no longer exist.
      await resetTo('/');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível apagar. Tente de novo.');
      button.disabled = false;
    }
  });

  return h('section', { class: 'panel danger-panel', 'aria-labelledby': 'erase-title' },
    h('h3', { class: 'panel__title', id: 'erase-title' }, 'Apagar dados'),
    h('p', { class: 'panel__text' },
      'Apaga todos os lugares e visitas deste aparelho. Não dá para desfazer: para recuperar, '
      + 'só importando um backup.'),
    button,
  );
}

// ---------------------------------------------------------------- Import (CARD-017)

function buildImportPanel() {
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', hidden: true, id: 'import-file', 'aria-label': 'Arquivo de backup',
  });
  const pickButton = h('button', { type: 'button', class: 'btn btn-ghost btn-block' }, 'Escolher arquivo');
  const status = h('div', { class: 'import-status', 'aria-live': 'polite' });

  pickButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = ''; // lets the same file be picked again
    if (!file) return;
    status.replaceChildren(h('p', { class: 'panel__text' }, 'Lendo arquivo…'));
    let backup;
    try {
      backup = parseBackup(await file.text());
    } catch (error) {
      showError(status, error);
      return;
    }
    showChoice(status, file.name, backup);
  });

  return h('section', { class: 'panel', 'aria-labelledby': 'import-title' },
    h('h3', { class: 'panel__title', id: 'import-title' }, 'Importar'),
    h('p', { class: 'panel__text' },
      'Traga de volta um backup exportado antes. Você escolhe se ele se junta aos dados atuais '
      + 'ou se substitui tudo.'),
    fileInput,
    pickButton,
    status,
  );
}

function showError(status, error) {
  if (!(error instanceof ImportError)) console.error(error);
  const message = error instanceof ImportError
    ? error.message
    : 'Não foi possível importar. Nenhum dado foi alterado.';
  status.replaceChildren(h('div', { class: 'import-box import-box--error', role: 'alert' },
    h('p', { class: 'import-box__title' }, message),
    error.details?.length > 0 && h('ul', { class: 'import-box__list' }, error.details.map((d) => h('li', {}, d))),
    h('p', { class: 'import-box__note' }, 'Nenhum dado do app foi alterado.'),
  ));
}

function showChoice(status, fileName, backup) {
  const mergeButton = h('button', { type: 'button', class: 'btn btn-primary btn-block' }, 'Mesclar com os dados atuais');
  const replaceButton = h('button', { type: 'button', class: 'btn btn-outline-danger btn-block' }, 'Substituir tudo');
  const cancelButton = h('button', { type: 'button', class: 'btn btn-ghost btn-block' }, 'Cancelar');
  const buttons = [mergeButton, replaceButton, cancelButton];

  const run = async (mode, button) => {
    const label = button.textContent;
    buttons.forEach((b) => { b.disabled = true; });
    button.textContent = 'Importando…';
    try {
      const result = await importBackup(backup, mode);
      showResult(status, result);
      showToast('Backup importado');
      refreshExportCounts();
    } catch (error) {
      showError(status, error);
    } finally {
      button.textContent = label;
      buttons.forEach((b) => { b.disabled = false; });
    }
  };

  mergeButton.addEventListener('click', () => run(IMPORT_MODE.MERGE, mergeButton));
  replaceButton.addEventListener('click', async () => {
    const current = await countData();
    const ok = await confirmDialog({
      title: 'Substituir tudo?',
      message: `Os ${places(current.places)} e ${visits(current.visits)} do app serão apagados e trocados `
        + `pelos ${places(backup.places.length)} e ${visits(backup.visits.length)} do arquivo. `
        + 'Essa ação não pode ser desfeita.',
      confirmLabel: 'Substituir',
      danger: true,
    });
    if (ok) run(IMPORT_MODE.REPLACE, replaceButton);
  });
  cancelButton.addEventListener('click', () => status.replaceChildren());

  status.replaceChildren(h('div', { class: 'import-box' },
    h('p', { class: 'import-box__title' }, fileName),
    backup.exportedAt && h('p', { class: 'panel__text' }, `Backup de ${formatDateTime(backup.exportedAt)}`),
    h('p', { class: 'panel__text' }, `${places(backup.places.length)} e ${visits(backup.visits.length)}`),
    h('div', { class: 'import-box__actions' }, buttons),
  ));
}

function showResult(status, result) {
  const line = (label, c, singular, pluralForm) => {
    const parts = [];
    if (c.inserted) parts.push(`${c.inserted} ${c.inserted === 1 ? `${singular} novo` : `${pluralForm} novos`}`);
    if (c.updated) parts.push(`${c.updated} atualizado${c.updated === 1 ? '' : 's'}`);
    if (c.unchanged) parts.push(`${c.unchanged} sem mudança`);
    return h('li', {}, `${label}: ${parts.length ? parts.join(', ') : 'nenhum'}`);
  };
  const isReplace = result.mode === IMPORT_MODE.REPLACE;

  status.replaceChildren(h('div', { class: 'import-box import-box--success' },
    h('p', { class: 'import-box__title' }, isReplace
      ? `Dados substituídos: ${places(result.places.inserted)} e ${visits(result.visits.inserted)}.`
      : 'Importação concluída.'),
    !isReplace && h('ul', { class: 'import-box__list' },
      line('Lugares', result.places, 'lugar', 'lugares'),
      h('li', {}, `Visitas: ${[
        result.visits.inserted && `${result.visits.inserted} nova${result.visits.inserted === 1 ? '' : 's'}`,
        result.visits.updated && `${result.visits.updated} atualizada${result.visits.updated === 1 ? '' : 's'}`,
        result.visits.unchanged && `${result.visits.unchanged} sem mudança`,
      ].filter(Boolean).join(', ') || 'nenhuma'}`)),
    result.skipped.length > 0 && h('div', { class: 'import-box__skipped' },
      h('p', {}, `Não importados (já existe um lugar com esse nome): ${result.skipped.length}`),
      h('ul', { class: 'import-box__list' }, result.skipped.map((s) => h('li', {},
        s.visits ? `${s.name} (e ${visits(s.visits)})` : s.name)))),
  ));
}
