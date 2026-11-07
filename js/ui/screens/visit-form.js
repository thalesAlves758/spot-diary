import { renderPlaceholder } from './placeholder.js';

// T5 — Record / edit visit (CARD-011, CARD-012).
// New visit: `params.placeId` (#/place/:placeId/visit/new). Editing: `params.id` (#/visit/:id/edit).
export function render(root, { params }) {
  const editing = Boolean(params.id);
  renderPlaceholder(root, {
    title: editing ? 'Editar visita' : 'Registrar visita',
    backFallback: editing ? '/' : `/place/${params.placeId}`,
    card: editing ? 'CARD-012' : 'CARD-011',
  });
}
