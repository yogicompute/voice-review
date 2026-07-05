// Tiny color helpers for the customizable review page.
// Shared by the public page (server) and the customize preview (client).

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 127, g: 167, b: 207 }; // fallback: default brand blue
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Perceived luminance 0–255. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** True when white text should be used on this background. */
export function isDark(hex: string): boolean {
  return luminance(hex) < 150;
}

/** Mix a hex color toward black (amount 0–1). */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

/** Mix a hex color toward white (amount 0–1). */
export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.round(v + (255 - v) * amount);
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

/** CSS background for the public review page given the owner's theme. */
export function pageBackground(style: string, color: string): string {
  if (style === "solid") return color;
  // Gradient: a soft pastel wash — brand tint at the bottom rising to white.
  // With the default color (#7fa7cf) this is exactly
  // linear-gradient(to top, #dfe9f3 0%, white 100%).
  return `linear-gradient(to top, ${lighten(color, 0.75)} 0%, #ffffff 100%)`;
}

/** Soft tint used inside the review card's hero area. */
export function cardTint(color: string): string {
  return lighten(color, 0.82);
}
