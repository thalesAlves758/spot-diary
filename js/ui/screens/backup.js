// T6 — Settings / Backup. Export: CARD-016. Import: CARD-017.
import { h } from '../dom.js';
import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { formatDateTime, plural } from '../format.js';
import {
  buildBackup, serializeBackup, backupFileName, markExported, getLastExportAt, countData,
} from '../../services/backup.js';

export async function render(root) {
  const [lastExportAt, counts] = await Promise.all([getLastExportAt(), countData()]);

  const lastExportText = h('p', { class: 'backup__last', 'aria-live': 'polite' });
  const showLastExport = (iso) => {
    lastExportText.textContent = iso
      ? `Último backup: ${formatDateTime(iso)}`
      : 'Você ainda não fez nenhum backup.';
  };
  showLastExport(lastExportAt);

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

  root.append(
    createHeader({ title: 'Backup', back: true }),
    h('main', { class: 'page' },
      h('section', { class: 'panel', 'aria-labelledby': 'export-title' },
        h('h2', { class: 'panel__title', id: 'export-title' }, 'Exportar'),
        h('p', { class: 'panel__text' },
          'Seus dados ficam só neste aparelho. Exporte um backup de vez em quando e guarde o arquivo '
          + 'fora do celular (Drive, e-mail, computador).'),
        h('p', { class: 'panel__text' },
          `Serão exportados ${plural(counts.places, 'lugar', 'lugares')} e ${plural(counts.visits, 'visita', 'visitas')}.`),
        lastExportText,
        exportButton,
      ),
    ),
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
