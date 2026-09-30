import { ImageResponse } from 'next/og';
import { siteGet, type PublicSite } from '@/lib/public-site/api';
import { CardFrame, Initials, OG_CACHE, OG_SIZE, bandOf, hostOf, initialsOf, logoData, ogFonts } from '@/lib/public-site/og';

/**
 * The league's card (PHASE5B_LEAGUE_SITES §9): its mark and name on its own colour, what the site
 * holds, and its address. What a link to its home page — or any page without a card of its own —
 * shows in WhatsApp.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  const site = await siteGet<PublicSite>(tenantSlug);
  if (!site) return new Response('Aucune ligue à cette adresse', { status: 404 });
  const logo = await logoData(site.logoUrl);

  return new ImageResponse(
    (
      <CardFrame band={bandOf(site.primaryColor)} league="Propulsé par DXScores" host={hostOf(tenantSlug)}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={128} height={128} alt="" style={{ borderRadius: 28, background: '#ffffff', objectFit: 'contain' }} />
        ) : (
          <Initials text={initialsOf(site.name)} size={128} radius={28} />
        )}
        <div style={{ display: 'flex', marginTop: 44, fontSize: site.name.length > 34 ? 56 : 70, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          {site.name}
        </div>
        <div style={{ display: 'flex', marginTop: 18, fontSize: 32, color: 'rgba(255,255,255,0.82)' }}>
          Calendrier, résultats et classement{site.city ? ` · ${site.city}` : ''}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 'auto', marginBottom: 30 }}>
          {site.competitions.slice(0, 4).map((c) => (
            <div key={c.slug} style={{ display: 'flex', padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', fontSize: 22 }}>
              {c.name}
            </div>
          ))}
        </div>
      </CardFrame>
    ),
    { ...OG_SIZE, fonts: await ogFonts(), headers: OG_CACHE },
  );
}
