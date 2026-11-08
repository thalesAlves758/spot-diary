// T5 — Record / edit visit. Recording: CARD-011. Editing (`params.id`): CARD-012.
// New visit: `params.placeId` (#/place/:placeId/visit/new). Editing: `params.id` (#/visit/:id/edit).
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { returnTo, resetTo } from '../../router.js';
import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { confirmDialog } from '../components/confirm-dialog.js';
import { formatDate } from '../format.js';
import { getPlace } from '../../services/places.js';
import {
  recordVisit, getVisit, updateVisit, deleteVisit, COMMENT_MAX,
} from '../../services/visits.js';
import { todayLocal } from '../../services/dates.js';
import { ValidationError, NotFoundError } from '../../services/errors.js';

export async function render(root, { params }) {
  if (params.id) return renderEdit(root, params.id);

  const placeId = params.placeId;
  const placePath = `/place/${encodeURIComponent(placeId)}`;
  const place = await getPlace(placeId);

  if (!place) {
    root.append(
      createHeader({ title: 'Registrar visita', back: true }),
      h('main', { class: 'page' }, createEmptyState({
        title: 'Lugar não encontrado',
        message: 'Ele pode ter sido excluído.',
        action: { label: 'Ir para o início', onClick: () => resetTo('/') },
      })),
    );
    return;
  }

  root.append(
    createHeader({ title: 'Registrar visita', back: true, backFallback: placePath }),
    h('main', { class: 'page' },
      h('p', { class: 'visit-form__place' }, place.name),
      buildVisitForm({
        submitLabel: 'Salvar visita',
        onSubmit: async (data) => {
          try {
            const { movedToBeenThere } = await recordVisit(placeId, data);
            showToast(movedToBeenThere ? 'Visita registrada. O lugar foi para "Já fui".' : 'Visita registrada');
          } catch (error) {
            if (!(error instanceof NotFoundError)) throw error;
            showToast('Esse lugar não existe mais.');
            await resetTo('/');
            return;
          }
          returnTo(placePath);
        },
      }),
    ),
  );
}

// Edit mode (CARD-012): same form and rules; deleting a visit never changes the place's status.
async function renderEdit(root, id) {
  const found = await getVisit(id);

  if (!found || !found.place) {
    root.append(
      createHeader({ title: 'Editar visita', back: true }),
      h('main', { class: 'page' }, createEmptyState({
        title: 'Visita não encontrada',
        message: 'Ela pode ter sido excluída.',
        action: { label: 'Ir para o início', onClick: () => resetTo('/') },
      })),
    );
    return;
  }

  const { visit, place } = found;
  const placePath = `/place/${encodeURIComponent(place.id)}`;

  // The visit is gone (another tab, or deleted meanwhile): leave for the place's detail.
  const handleGone = (error) => {
    if (!(error instanceof NotFoundError)) throw error;
    showToast('Essa visita não existe mais.');
    return returnTo(placePath);
  };

  const deleteButton = h('button', { type: 'button', class: 'btn btn-outline-danger btn-block' }, 'Excluir visita');
  deleteButton.addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: 'Excluir visita?',
      message: `A visita de ${formatDate(visit.date)} será apagada. O lugar continua em "Já fui". `
        + 'Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!confirmed) return;
    deleteButton.disabled = true;
    try {
      await deleteVisit(id);
      showToast('Visita excluída');
      await returnTo(placePath);
    } catch (error) {
      console.error(error);
      showToast('Não foi possível excluir. Tente de novo.');
      deleteButton.disabled = false;
    }
  });

  root.append(
    createHeader({ title: 'Editar visita', back: true, backFallback: placePath }),
    h('main', { class: 'page' },
      h('p', { class: 'visit-form__place' }, place.name),
      buildVisitForm({
        initial: visit,
        submitLabel: 'Salvar alterações',
        onSubmit: async (data) => {
          try {
            await updateVisit(id, data);
          } catch (error) {
            await handleGone(error);
            return;
          }
          showToast('Visita atualizada');
          returnTo(placePath);
        },
      }),
      h('section', { class: 'danger-zone', 'aria-label': 'Excluir visita' },
        h('p', { class: 'danger-zone__text' }, 'Excluir apaga só esta visita; o lugar continua em "Já fui".'),
        deleteButton,
      ),
    ),
  );
}

/**
 * Visit form shared by record and edit.
 * `initial`: `{ date, rating, wouldReturn, comment }` (date defaults to today).
 * `onSubmit(data)` may throw `ValidationError`; its messages are shown next to the fields.
 */
export function buildVisitForm({ initial = {}, submitLabel, onSubmit }) {
  const today = todayLocal();
  const errorEls = {};
  const errorFor = (name) => {
    errorEls[name] = h('p', { class: 'field__error', id: `visit-${name}-error`, hidden: true });
    return errorEls[name];
  };

  // ---- Date ----
  const dateInput = h('input', {
    id: 'visit-date', name: 'date', type: 'date', class: 'field__input', max: today,
    value: initial.date ?? today, 'aria-required': 'true', 'aria-describedby': 'visit-date-error',
  });

  // ---- Rating: 5 radios drawn as stars ----
  const ratingInputs = [1, 2, 3, 4, 5].map((n) => h('input', {
    type: 'radio', name: 'rating', value: String(n), id: `visit-rating-${n}`, class: 'rating__input',
    checked: initial.rating === n,
  }));
  const ratingGroup = h('div', { class: 'rating', role: 'radiogroup', 'aria-labelledby': 'visit-rating-label', 'aria-describedby': 'visit-rating-error', id: 'visit-rating' },
    ratingInputs.map((input, i) => [
      input,
      h('label', { for: input.id, class: 'rating__star', title: `${i + 1}` },
        icon('star'), h('span', { class: 'sr-only' }, i === 0 ? '1 estrela' : `${i + 1} estrelas`)),
    ]));
  const paintStars = () => {
    const value = Number(ratingInputs.find((r) => r.checked)?.value ?? 0);
    ratingGroup.querySelectorAll('.rating__star').forEach((star, i) => star.classList.toggle('rating__star--on', i < value));
  };
  ratingGroup.addEventListener('change', paintStars);
  paintStars();

  // ---- Would return: yes / no, no default ----
  const returnInputs = [['yes', 'Sim', true], ['no', 'Não', false]].map(([key, label, value]) => {
    const input = h('input', {
      type: 'radio', name: 'wouldReturn', value: key, id: `visit-return-${key}`, class: 'choice__input',
      checked: initial.wouldReturn === value,
    });
    return { input, value, label: h('label', { for: input.id, class: 'choice__option' }, label) };
  });
  const returnGroup = h('div', { class: 'choice', role: 'radiogroup', 'aria-labelledby': 'visit-return-label', 'aria-describedby': 'visit-wouldReturn-error', id: 'visit-wouldReturn' },
    returnInputs.map(({ input, label }) => [input, label]));

  // ---- Comment ----
  const commentInput = h('textarea', {
    id: 'visit-comment', name: 'comment', class: 'field__input field__textarea', rows: 4, maxlength: COMMENT_MAX,
    placeholder: 'O que achou? O que pediu?', 'aria-describedby': 'visit-comment-error',
  });
  commentInput.value = initial.comment ?? '';

  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, submitLabel);

  const required = h('span', { class: 'field__required', 'aria-hidden': 'true' }, ' *');
  const form = h('form', { class: 'form', novalidate: true },
    h('div', { class: 'field' },
      h('label', { class: 'field__label', for: 'visit-date' }, 'Data', required.cloneNode(true)),
      dateInput, errorFor('date')),
    h('div', { class: 'field' },
      h('span', { class: 'field__label', id: 'visit-rating-label' }, 'Nota', required.cloneNode(true)),
      ratingGroup, errorFor('rating')),
    h('div', { class: 'field' },
      h('span', { class: 'field__label', id: 'visit-return-label' }, 'Voltaria?', required.cloneNode(true)),
      returnGroup, errorFor('wouldReturn')),
    h('div', { class: 'field' },
      h('label', { class: 'field__label', for: 'visit-comment' }, 'Comentário'),
      commentInput, errorFor('comment')),
    submit,
  );

  // First focusable element of each field, for focusing the first error.
  const focusTarget = {
    date: () => dateInput,
    rating: () => ratingInputs.find((r) => r.checked) ?? ratingInputs[0],
    wouldReturn: () => returnInputs.find((r) => r.input.checked)?.input ?? returnInputs[0].input,
    comment: () => commentInput,
  };
  const invalidTarget = { date: dateInput, rating: ratingGroup, wouldReturn: returnGroup, comment: commentInput };

  const showErrors = (fields) => {
    for (const [name, el] of Object.entries(errorEls)) {
      el.textContent = fields[name] ?? '';
      el.hidden = !fields[name];
      invalidTarget[name].setAttribute('aria-invalid', fields[name] ? 'true' : 'false');
    }
    const first = Object.keys(errorEls).find((name) => fields[name]);
    if (first) focusTarget[first]().focus();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const checkedRating = ratingInputs.find((r) => r.checked);
    const data = {
      date: dateInput.value,
      rating: checkedRating ? Number(checkedRating.value) : undefined,
      wouldReturn: returnInputs.find((r) => r.input.checked)?.value,
      comment: commentInput.value,
    };
    submit.disabled = true;
    try {
      showErrors({});
      await onSubmit(data);
    } catch (error) {
      if (error instanceof ValidationError) showErrors(error.fields);
      else {
        console.error(error);
        showToast('Não foi possível salvar. Tente de novo.');
      }
    } finally {
      submit.disabled = false;
    }
  });

  return form;
}
