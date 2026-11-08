// T4 — Place detail (CARD-010). Favorite toggle: CARD-014. Visit form: CARD-011/012.
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate, resetTo } from '../../router.js';
import { createHeader, iconButton } from '../components/header.js';
import { createEmptyState } from '../components/empty-state.js';
import { createStars } from '../components/stars.js';
import { createFavoriteButton } from '../components/favorite-button.js';
import { formatAddress, formatAverage, formatDate, plural } from '../format.js';
import { getPlaceDetail, placeTypeLabel, STATUS } from '../../services/places.js';

export async function render(root, { params }) {
  const id = params.id;
  const detail = await getPlaceDetail(id);
  const placePath = `/place/${encodeURIComponent(id)}`;

  if (!detail) {
    root.append(
      createHeader({ title: 'Lugar', back: true }),
      h('main', { class: 'page' }, createEmptyState({
        title: 'Lugar não encontrado',
        message: 'Ele pode ter sido excluído.',
        action: { label: 'Ir para o início', onClick: () => resetTo('/') },
      })),
    );
    return;
  }

  const { place, summary, visits } = detail;
  const addressLines = formatAddress(place.address);
  const recordVisit = () => navigate(`${placePath}/visit/new`);

  root.append(
    createHeader({
      title: 'Lugar',
      back: true,
      actions: [iconButton({ name: 'edit', label: 'Editar lugar', onClick: () => navigate(`${placePath}/edit`) })],
    }),
    h('main', { class: 'page detail' },
      // ---- Place ----
      h('section', { class: 'detail__place' },
        h('div', { class: 'detail__title-row' },
          h('h2', { class: 'detail__name' }, place.name),
          createFavoriteButton({ placeId: place.id, placeName: place.name, favorite: place.favorite, className: 'detail__favorite' }),
        ),
        h('p', { class: 'detail__meta' },
          placeTypeLabel(place.type), ' · ', place.status === STATUS.BEEN_THERE ? 'Já fui' : 'Quero ir'),
        place.tags?.length > 0 && h('ul', { class: 'tag-list', 'aria-label': 'Tags' },
          place.tags.map((tag) => h('li', { class: 'tag' }, tag))),
        addressLines.length > 0 && h('address', { class: 'detail__address' },
          addressLines.map((line) => h('span', { class: 'detail__address-line' }, line))),
      ),

      // ---- Summary + main action ----
      summary.visitCount > 0 && h('section', { class: 'detail__summary', 'aria-label': 'Resumo das visitas' },
        h('div', { class: 'summary-item' },
          h('span', { class: 'summary-item__value summary-item__value--rating' }, icon('star'), formatAverage(summary.average)),
          h('span', { class: 'summary-item__label' }, 'média')),
        h('div', { class: 'summary-item' },
          h('span', { class: 'summary-item__value' }, String(summary.visitCount)),
          h('span', { class: 'summary-item__label' }, summary.visitCount === 1 ? 'visita' : 'visitas')),
        h('div', { class: 'summary-item' },
          h('span', { class: 'summary-item__value' }, summary.lastWouldReturn ? 'Sim' : 'Não'),
          h('span', { class: 'summary-item__label' }, 'voltaria')),
      ),
      // "Quero ir" without visits: the empty state below carries the button instead.
      (visits.length > 0 || place.status === STATUS.BEEN_THERE)
        && h('button', { type: 'button', class: 'btn btn-primary btn-block', onclick: recordVisit },
          icon('plus'), 'Registrar visita'),

      // ---- History ----
      h('section', { class: 'detail__history', 'aria-labelledby': 'history-title' },
        h('h3', { class: 'detail__section-title', id: 'history-title' },
          visits.length ? `Histórico (${plural(visits.length, 'visita', 'visitas')})` : 'Histórico'),
        visits.length
          ? h('ol', { class: 'visit-list' }, visits.map((visit) => renderVisit(visit)))
          : renderNoVisits(place, recordVisit),
      ),
    ),
  );
}

function renderNoVisits(place, recordVisit) {
  return place.status === STATUS.WANT_TO_GO
    ? createEmptyState({
      title: 'Você ainda não foi aqui',
      message: 'Quando for, registre a visita para guardar a nota e o que achou.',
      action: { label: 'Registrar visita', onClick: recordVisit },
    })
    : createEmptyState({
      title: 'Nenhuma visita registrada',
      message: 'O lugar continua em "Já fui".',
    });
}

function renderVisit(visit) {
  return h('li', { class: 'visit' },
    h('div', { class: 'visit__top' },
      h('div', { class: 'visit__info' },
        h('time', { class: 'visit__date', datetime: visit.date }, formatDate(visit.date)),
        createStars(visit.rating),
        h('span', { class: `visit__return visit__return--${visit.wouldReturn ? 'yes' : 'no'}` },
          visit.wouldReturn ? 'Voltaria' : 'Não voltaria'),
      ),
      iconButton({
        name: 'edit',
        label: `Editar visita de ${formatDate(visit.date)}`,
        onClick: () => navigate(`/visit/${encodeURIComponent(visit.id)}/edit`),
      }),
    ),
    visit.comment && h('p', { class: 'visit__comment' }, visit.comment),
  );
}
