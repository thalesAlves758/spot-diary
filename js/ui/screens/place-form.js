import { renderPlaceholder } from './placeholder.js';

// T3 — Create / edit place (CARD-005, CARD-007). `params.id` is set when editing.
export function render(root, { params }) {
  const editing = Boolean(params.id);
  renderPlaceholder(root, {
    title: editing ? 'Editar lugar' : 'Novo lugar',
    backFallback: editing ? `/place/${params.id}` : '/',
    card: editing ? 'CARD-007' : 'CARD-005',
  });
}
