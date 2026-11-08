import { h } from '../dom.js';
import { icon } from '../icons.js';

/** Read-only 1–5 star rating, announced as "Nota 4 de 5". */
export function createStars(rating) {
  return h('span', { class: 'stars', role: 'img', 'aria-label': `Nota ${rating} de 5` },
    [1, 2, 3, 4, 5].map((n) => {
      const star = icon('star');
      star.classList.add(n <= rating ? 'stars__on' : 'stars__off');
      return star;
    }));
}
