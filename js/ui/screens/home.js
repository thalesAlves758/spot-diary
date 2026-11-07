import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate } from '../../router.js';
import { createHeader, iconButton } from '../components/header.js';
import { createEmptyState } from '../components/empty-state.js';

// T1 — Home. Tabs, list, search and filters arrive in CARD-008/009/015.
export function render(root) {
  root.append(
    createHeader({
      title: 'Diário de Rolê',
      actions: [iconButton({ name: 'backup', label: 'Backup', onClick: () => navigate('/backup') })],
    }),
    h('main', { class: 'page' },
      createEmptyState({
        title: 'Nenhum lugar ainda',
        message: 'Cadastre o primeiro lugar que você quer conhecer.',
      }),
    ),
    h('button', { type: 'button', class: 'fab', onclick: () => navigate('/place/new') },
      icon('plus'), h('span', {}, 'Novo')),
  );
}
