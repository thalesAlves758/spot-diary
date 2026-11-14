// Inline SVG icons (24×24, stroke = currentColor). Kept inline so they work offline.
const paths = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  backup: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  // Filled gear (8 teeth) with a lighter ring around the hole; filled, unlike the stroked icons.
  settings: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M9.8 3.89L10.25 1L13.75 1L14.2 3.89A8.4 8.4 0 0 1 16.18 4.71L18.54 2.98L21.02 5.46L19.29 7.82A8.4 8.4 0 0 1 20.11 9.8L23 10.25L23 13.75L20.11 14.2A8.4 8.4 0 0 1 19.29 16.18L21.02 18.54L18.54 21.02L16.18 19.29A8.4 8.4 0 0 1 14.2 20.11L13.75 23L10.25 23L9.8 20.11A8.4 8.4 0 0 1 7.82 19.29L5.46 21.02L2.98 18.54L4.71 16.18A8.4 8.4 0 0 1 3.89 14.2L1 13.75L1 10.25L3.89 9.8A8.4 8.4 0 0 1 4.71 7.82L2.98 5.46L5.46 2.98L7.82 4.71A8.4 8.4 0 0 1 9.8 3.89ZM6.4 12a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0 -11.2 0z"/>'
    + '<path fill="currentColor" fill-opacity="0.6" stroke="none" fill-rule="evenodd" d="M6.4 12a5.6 5.6 0 1 0 11.2 0a5.6 5.6 0 1 0 -11.2 0zM8.2 12a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0 -7.6 0z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  'map-pin': '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>',
  pin: '<path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 14v7"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
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
