// Minimal inline SVG icon set (stroke-based, inherits currentColor).
// Returned as raw markup for use with Astro's set:html.

const paths: Record<string, string> = {
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-5 6-9 16-9 0 8-4 14-9 14Z"/><path d="M4 20c4-6 8-8 12-9"/>',
  pot: '<path d="M4 10h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z"/><path d="M2 10h20"/><path d="M8 10V7M16 10V7"/><path d="M10 4s0 2 2 2 2-2 2-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  heart: '<path d="M12 21s-7-4.6-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9Z"/>',
  users:
    '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6"/><path d="M18 20a6 6 0 0 0-3-5"/>',
  tag: '<path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>',
  headset:
    '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/><path d="M20 19a4 4 0 0 1-4 3h-2"/>',
};

export function iconSvg(name: string): string {
  const inner = paths[name] ?? paths.heart;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
