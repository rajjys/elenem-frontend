'use client';

import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { BAND_INK, SITE_PALETTE, siteColourVars, type SiteColour } from '@/lib/public-site/palette';

/**
 * A league site's two colours (PHASE5B_LEAGUE_SITES §4.6), picked from the curated palette —
 * never a free colour, so a league cannot make its own table unreadable in one theme or the other.
 * « Aucune » leaves the neutral header and the product's blue.
 */
export function SiteColourPicker({
  label,
  hint,
  value,
  onChange,
  name,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
}) {
  const options: { key: string; label: string; swatch: string | null }[] = [
    { key: '', label: 'Aucune', swatch: null },
    ...(Object.keys(SITE_PALETTE) as SiteColour[]).map((k) => ({ key: k, label: SITE_PALETTE[k].label, swatch: SITE_PALETTE[k].band })),
  ];
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <p className="mb-2 text-xs text-ink-muted">{hint}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.key;
          return (
            <label key={o.key || 'none'} className="cursor-pointer" title={o.label}>
              <input type="radio" name={name} value={o.key} checked={active} onChange={() => onChange(o.key)} className="peer sr-only" />
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-shadow peer-focus-visible:ring-2 peer-focus-visible:ring-accent',
                  active ? 'ring-2 ring-ink' : 'ring-1 ring-line',
                  !o.swatch && 'bg-surface-sunk text-[0.6rem] font-semibold text-ink-muted',
                )}
                style={o.swatch ? { background: o.swatch } : undefined}
              >
                {active && o.swatch && <Check className="h-4 w-4" style={{ color: BAND_INK }} aria-hidden />}
                {!o.swatch && (active ? <Check className="h-4 w-4 text-ink" aria-hidden /> : '–')}
              </span>
              <span className="sr-only">{o.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * What the league's site header will look like with these two colours — drawn with the site's own
 * variables and `league-site` class, so the accent switches with the theme exactly as it will there.
 */
export function SiteColourPreview({ name, primary, accent }: { name: string; primary: string; accent: string }) {
  const banded = !!primary && primary in SITE_PALETTE;
  return (
    <div aria-hidden className="league-site overflow-hidden rounded-lg border border-line" style={siteColourVars(primary || null, accent || null)}>
      <div
        className={cn('flex items-center gap-2 px-3 py-2.5 text-sm font-bold', banded ? 'bg-[var(--site-band)] text-[var(--site-band-ink)]' : 'bg-surface text-ink')}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-sunk text-[0.6rem] text-ink">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <span className="truncate">{name}</span>
      </div>
      <div className="h-0.5 bg-[var(--site-accent)]" />
      <div className="bg-canvas px-3 py-2.5 text-sm">
        <span className="font-bold text-ink">Classement</span>
        <span className="mt-1 block h-0.5 w-6 rounded-full bg-[var(--site-accent)]" />
        <span className="mt-1.5 block text-xs font-medium text-[var(--site-accent)]">Classement complet →</span>
      </div>
    </div>
  );
}
