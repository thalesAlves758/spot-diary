import { h } from '../dom.js';
import { icon } from '../icons.js';
import { showToast } from './toast.js';
import { toggleFavorite } from '../../services/places.js';

/**
 * Heart toggle button (CARD-014). Updates at once and saves in the background; if saving fails,
 * it flips back and shows a toast. `onChange(favorite)` runs after a successful save.
 */
export function createFavoriteButton({ placeId, placeName, favorite, onChange = () => {}, className = '' }) {
  let value = favorite;
  let busy = false;

  const button = h('button', { type: 'button', class: `icon-btn favorite-btn ${className}`.trim() }, icon('heart'));
  const paint = () => {
    button.setAttribute('aria-pressed', String(value));
    button.setAttribute('aria-label', `Favorito: ${placeName}`);
    button.classList.toggle('favorite-btn--on', value);
  };
  paint();

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation(); // never opens the card behind it
    if (busy) return;
    busy = true;
    value = !value;
    paint();
    try {
      value = await toggleFavorite(placeId);
      paint();
      onChange(value);
    } catch (error) {
      console.error(error);
      value = !value;
      paint();
      showToast('Não foi possível salvar o favorito.');
    } finally {
      busy = false;
    }
  });

  return button;
}
