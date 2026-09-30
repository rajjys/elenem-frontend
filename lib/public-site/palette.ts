import type { CSSProperties } from 'react';

/**
 * A league's two colours (PHASE5B_LEAGUE_SITES §4.6), chosen from this list rather than a free
 * picker, so no league can make its own table unreadable in one theme or the other.
 *
 * Each colour has three uses, each checked at WCAG AA (4.5:1) or better:
 *   - `band` — the header behind white text (primary);
 *   - `light` — links and the active tab on the light theme's page and cards (accent);
 *   - `dark` — the same on the dark theme's.
 * Never used for wins, losses or table bands: those keep the semantic tokens.
 *
 * Keys are what `brandingTheme.primaryColor` / `secondaryColor` store. The picker in the
 * organisation settings comes with 5B.7.
 */
export const SITE_PALETTE = {
  bleu: { label: 'Bleu', band: '#0a3a8d', light: '#1d4ed8', dark: '#8fb3ff' },
  vert: { label: 'Vert', band: '#14532d', light: '#15803d', dark: '#4ade80' },
  rouge: { label: 'Rouge', band: '#991b1b', light: '#b91c1c', dark: '#fca5a5' },
  orange: { label: 'Orange', band: '#9a3412', light: '#c2410c', dark: '#fdba74' },
  or: { label: 'Or', band: '#854d0e', light: '#a16207', dark: '#facc15' },
  violet: { label: 'Violet', band: '#5b21b6', light: '#6d28d9', dark: '#c4b5fd' },
  turquoise: { label: 'Turquoise', band: '#115e59', light: '#0f766e', dark: '#5eead4' },
  ardoise: { label: 'Ardoise', band: '#1e293b', light: '#334155', dark: '#cbd5e1' },
} as const;

export type SiteColour = keyof typeof SITE_PALETTE;

/** The text on a band: every band colour above is checked against it at AA or better. */
export const BAND_INK = '#ffffff';

const colour = (key: string | null | undefined) =>
  key && key in SITE_PALETTE ? SITE_PALETTE[key as SiteColour] : null;

/**
 * The CSS variables a league site's frame reads. Unset ones fall back, in `globals.css`, to the
 * product's own tokens: a league that has chosen nothing gets a neutral header and DXScores blue.
 */
export function siteColourVars(primary: string | null, accent: string | null): CSSProperties {
  const band = colour(primary);
  const link = colour(accent) ?? band;
  return {
    ...(band ? { '--site-band': band.band, '--site-band-ink': BAND_INK } : {}),
    ...(link ? { '--site-accent-light': link.light, '--site-accent-dark': link.dark } : {}),
  } as CSSProperties;
}

export const hasBand = (primary: string | null) => colour(primary) !== null;
