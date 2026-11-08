// T3 — Create / edit place. Creation: CARD-005. Editing (`params.id`): CARD-007.
import { h } from '../dom.js';
import { replace } from '../../router.js';
import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { createTagInput } from '../components/tag-input.js';
import { renderPlaceholder } from './placeholder.js';
import { PLACE_TYPES, BRAZIL_STATES, createPlace, listTags } from '../../services/places.js';
import { ValidationError } from '../../services/errors.js';

export async function render(root, { params }) {
  if (params.id) {
    renderPlaceholder(root, { title: 'Editar lugar', backFallback: `/place/${params.id}`, card: 'CARD-007' });
    return;
  }

  const existingTags = await listTags();

  root.append(
    createHeader({ title: 'Novo lugar', back: true }),
    h('main', { class: 'page' },
      buildPlaceForm({
        existingTags,
        submitLabel: 'Salvar',
        onSubmit: async (data) => {
          const place = await createPlace(data);
          showToast('Lugar salvo');
          // Replace the form entry: back from the detail goes to the list, not to an empty form.
          replace(`/place/${place.id}`);
        },
      }),
    ),
  );
  root.querySelector('#place-name').focus();
}

/**
 * Place form shared by create and edit.
 * `onSubmit(data)` may throw `ValidationError`; its field messages are shown next to the fields.
 * `existingTags`: tags already in use, for the tag suggestions.
 */
export function buildPlaceForm({ initial = {}, existingTags = [], submitLabel, onSubmit }) {
  const address = initial.address ?? {};
  const errorEls = {};

  // `control` is the focusable input the label points to; `element` is what gets shown
  // (defaults to the control itself; the tag field wraps its input with the chips).
  const field = ({ name, label, required = false, control, element = control, wide = true }) => {
    const errorId = `place-${name}-error`;
    errorEls[name] = h('p', { class: 'field__error', id: errorId, hidden: true });
    control.setAttribute('aria-describedby', errorId);
    return h('div', { class: `field${wide ? '' : ' field--narrow'}` },
      h('label', { class: 'field__label', for: control.id },
        label, required && h('span', { class: 'field__required', 'aria-hidden': 'true' }, ' *')),
      element,
      errorEls[name],
    );
  };

  const text = (name, value, attrs = {}) => h('input', {
    id: `place-${name}`, name, class: 'field__input', type: 'text', value: value ?? '', ...attrs,
  });

  const nameInput = text('name', initial.name, { maxlength: 100, autocomplete: 'off', 'aria-required': 'true' });
  const typeSelect = h('select', { id: 'place-type', name: 'type', class: 'field__input', 'aria-required': 'true' },
    h('option', { value: '' }, 'Selecione'),
    PLACE_TYPES.map((t) => h('option', { value: t.value, selected: t.value === initial.type }, t.label)),
  );
  const tagInput = createTagInput({ id: 'place-tags', tags: initial.tags, existingTags });
  const stateSelect = h('select', { id: 'place-state', name: 'state', class: 'field__input' },
    h('option', { value: '' }, '—'),
    BRAZIL_STATES.map((uf) => h('option', { value: uf, selected: uf === address.state }, uf)),
  );
  const addressInputs = {
    street: text('street', address.street, { autocomplete: 'off' }),
    number: text('number', address.number, { inputmode: 'numeric', autocomplete: 'off' }),
    complement: text('complement', address.complement, { autocomplete: 'off' }),
    neighborhood: text('neighborhood', address.neighborhood, { autocomplete: 'off' }),
    city: text('city', address.city, { autocomplete: 'off' }),
  };
  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, submitLabel);

  const showErrors = (fields) => {
    for (const [name, el] of Object.entries(errorEls)) {
      const message = fields[name];
      el.textContent = message ?? '';
      el.hidden = !message;
      form.querySelector(`[aria-describedby="${el.id}"]`)?.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    const first = Object.keys(errorEls).find((name) => fields[name]);
    if (first) form.querySelector(`[aria-describedby="place-${first}-error"]`)?.focus();
  };

  const form = h('form', { class: 'form', novalidate: true },
    field({ name: 'name', label: 'Nome', required: true, control: nameInput }),
    field({ name: 'type', label: 'Tipo', required: true, control: typeSelect }),
    field({ name: 'tags', label: 'Tags', control: tagInput.input, element: tagInput.element }),
    h('fieldset', { class: 'fieldset' },
      h('legend', { class: 'fieldset__legend' }, 'Endereço'),
      field({ name: 'street', label: 'Logradouro', control: addressInputs.street }),
      h('div', { class: 'field-row' },
        field({ name: 'number', label: 'Número', control: addressInputs.number, wide: false }),
        field({ name: 'complement', label: 'Complemento', control: addressInputs.complement }),
      ),
      field({ name: 'neighborhood', label: 'Bairro', control: addressInputs.neighborhood }),
      h('div', { class: 'field-row' },
        field({ name: 'city', label: 'Cidade', control: addressInputs.city }),
        field({ name: 'state', label: 'UF', control: stateSelect, wide: false }),
      ),
    ),
    submit,
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const data = {
      name: nameInput.value,
      type: typeSelect.value,
      tags: tagInput.getTags(),
      address: {
        ...Object.fromEntries(Object.entries(addressInputs).map(([k, el]) => [k, el.value])),
        state: stateSelect.value,
      },
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
