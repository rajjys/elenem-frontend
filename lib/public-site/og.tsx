import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import { SITE_PALETTE, type SiteColour } from './palette';

/**
 * The league sites' share cards (PHASE5B_LEAGUE_SITES §9): 1200×630 PNGs drawn per request by
 * route handlers under /og, because WhatsApp is how a result travels in Goma and a bare link
 * travels badly.
 *
 * Route handlers rather than the opengraph-image file convention: that one would emit the internal
 * /public/public_tenant/… path, which the middleware rewrites a second time into a 404. Set in
 * Inter, the sites' typeface, read from assets/fonts (packaged with these routes in next.config).
 */

export const OG_SIZE = { width: 1200, height: 630 };

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 800; style: 'normal' }[]> | null = null;

/** The two weights, read once per server instance. */
export function ogFonts() {
  fonts ??= Promise.all(
    (['Regular', 'ExtraBold'] as const).map(async (w) => ({
      name: 'Inter',
      data: await readFile(join(process.cwd(), 'assets/fonts', `Inter-${w}.ttf`)),
      weight: (w === 'Regular' ? 400 : 800) as 400 | 800,
      style: 'normal' as const,
    })),
  );
  return fonts;
}

/** The league's band colour, or DXScores blue when it has chosen none. */
export function bandOf(primary: string | null | undefined): string {
  return primary && primary in SITE_PALETTE ? SITE_PALETTE[primary as SiteColour].band : '#0a3a8d';
}

/** Initials for a mark: one letter per word up to `max` — or, for a one-word name, its first two. */
export function initialsOf(name: string, max = 3): string {
  const words = name.split(/[\s'’-]+/).filter((w) => w && !/^(de|du|des|la|le|les|d|l|et)$/i.test(w));
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words.slice(0, max).map((w) => w[0]).join('') || name.slice(0, 2)).toUpperCase();
}

/** The frame every card shares: the league's band behind, its name and address along the bottom. */
export function CardFrame({
  band,
  league,
  host,
  children,
}: {
  band: string;
  league: string;
  host: string;
  children: ReactNode;
}) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: band, color: '#ffffff', fontFamily: 'Inter', padding: '52px 64px 44px' }}>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>{children}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, color: 'rgba(255,255,255,0.78)' }}>
        <div style={{ display: 'flex', fontWeight: 800, color: '#ffffff' }}>{league}</div>
        <div style={{ display: 'flex' }}>{host}</div>
      </div>
    </div>
  );
}

/** A white square with the league's or a club's initials, for when there is no logo. */
export function Initials({ text, size, radius }: { text: string; size: number; radius: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: radius, background: '#ffffff', color: '#0b1017', fontSize: size * 0.36, fontWeight: 800, letterSpacing: -1 }}>
      {text}
    </div>
  );
}

/** « demo.dxscores.app » — the address on a card, as a reader would type it. */
export function hostOf(slug: string): string {
  return `${slug}.${process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'dxscores.app'}`;
}

/**
 * A league's or club's logo as a data URL, or null. Fetched here, with a short timeout and only as
 * PNG or JPEG, rather than left to the image renderer: a slow or broken logo host must cost a card
 * its logo, never the card.
 */
export async function logoData(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/^image\/(png|jpe?g)/.test(type)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length > 1_500_000 ? null : `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Cards change when a score does; their address carries a version, so a day's cache is safe. */
export const OG_CACHE = { 'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800' };
