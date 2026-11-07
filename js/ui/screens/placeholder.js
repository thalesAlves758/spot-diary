import { h } from '../dom.js';
import { createHeader } from '../components/header.js';
import { createEmptyState } from '../components/empty-state.js';

/** Temporary screen body until the card that builds the real screen. */
export function renderPlaceholder(root, { title, backFallback = '/', card }) {
  root.append(
    createHeader({ title, back: true, backFallback }),
    h('main', { class: 'page' },
      createEmptyState({ title: 'Em construção', message: `Esta tela chega no ${card}.` }),
    ),
  );
}
