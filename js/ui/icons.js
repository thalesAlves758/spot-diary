// Inline SVG icons (24×24, stroke = currentColor). Kept inline so they work offline.
const paths = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  backup: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
};

/** Returns an `<svg>` element for `name`, hidden from screen readers (label the button instead). */
export function icon(name) {
  if (!parsed.has(name)) {
    const template = document.createElement('template');
    template.innerHTML = `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" focusable="false">${paths[name]}</svg>`;
    parsed.set(name, template.content.firstElementChild);
  }
  return parsed.get(name).cloneNode(true);
}

// Parsed once per name, then cloned (long lists render many icons).
const parsed = new Map();
