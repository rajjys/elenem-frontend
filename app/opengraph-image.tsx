import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { OG_IMAGE } from '@/content/seo';

/**
 * The card a dxscores.com link shows when it is pasted into WhatsApp, Facebook or X
 * (PHASE5A_PRODUCT_SITE §8.4). How this product spreads is a link in a WhatsApp group, so this is
 * the first thing most people will ever see of it.
 *
 * PNG at 1200×630, generated from the same mark and colours as the site: WhatsApp wants og:title,
 * og:description and an image under 600 KB, and does not read AVIF. League sites get their own
 * cards in 5B; until then they fall back to this one.
 *
 * Set in Inter, the site's typeface, read from assets/fonts at build time: the renderer's built-in
 * font has no bold, and fetching one from Google at build would make the build depend on it.
 */
export const alt = OG_IMAGE.alt;
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };
export const contentType = 'image/png';

const ROWS: [string, string][] = [
  ['Aigles BC', '19'],
  ['Étoile du Lac', '18'],
  ['Lions BC', '16'],
  ['Jeunesse Sportive', '14'],
];

export default async function OpengraphImage() {
  const [regular, extraBold] = await Promise.all(
    ['Inter-Regular.ttf', 'Inter-ExtraBold.ttf'].map((file) => readFile(join(process.cwd(), 'assets/fonts', file))),
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0a3a8d',
          color: '#ffffff',
          padding: '64px 72px',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 14,
                background: '#ffffff',
                color: '#0a3a8d',
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: -2,
              }}
            >
              dx
            </div>
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>DXScores</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>
              Organisez votre saison.
            </div>
            <div
              style={{ display: 'flex', fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: '#aec6ea' }}
            >
              Le classement se calcule tout seul.
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: 23, color: '#d6e2f5' }}>
            Calendrier · résultats · classement · site de la ligue — gratuit
          </div>
        </div>

        {/* A slice of a standings table: the artefact the product exists to produce. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 330,
            marginLeft: 40,
            alignSelf: 'center',
            background: '#ffffff',
            color: '#0b1017',
            borderRadius: 20,
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: '#4d5b70', marginBottom: 10 }}>
            Classement
          </div>
          {ROWS.map(([club, pts], i) => (
            <div
              key={club}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 22,
                padding: '10px 0',
                borderTop: i === 0 ? 'none' : '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex' }}>
                <span style={{ width: 28, color: '#8a96a8' }}>{i + 1}</span>
                <span>{club}</span>
              </div>
              <span style={{ fontWeight: 800 }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: extraBold, weight: 800, style: 'normal' },
      ],
    },
  );
}
