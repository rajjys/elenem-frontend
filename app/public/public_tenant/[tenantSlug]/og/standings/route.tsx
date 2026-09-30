import { ImageResponse } from 'next/og';
import { siteGet, type PublicSite, type PublicStandings } from '@/lib/public-site/api';
import { formatInstant } from '@/lib/public-site/format';
import { CardFrame, OG_CACHE, OG_SIZE, bandOf, hostOf, ogFonts } from '@/lib/public-site/og';

/**
 * The standings card (PHASE5B_LEAGUE_SITES §9): the top eight on the league's colour, with when it
 * was computed. The image supporters will share most — it is what the federation's graphic designer
 * redraws by hand every week today.
 */
export async function GET(req: Request, { params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  const c = new URL(req.url).searchParams.get('c') ?? undefined;
  const [site, table] = await Promise.all([
    siteGet<PublicSite>(tenantSlug),
    siteGet<PublicStandings>(tenantSlug, '/standings', { c }),
  ]);
  if (!site || !table) return new Response('Classement introuvable', { status: 404 });
  const rows = table.rows.slice(0, 8);

  return new ImageResponse(
    (
      <CardFrame band={bandOf(site.primaryColor)} league={site.name} host={hostOf(tenantSlug)}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.8)' }}>
            {`Classement · ${table.updatedAt ? `mis à jour le ${formatInstant(table.updatedAt, site.timezone)}` : table.season.name}`}
          </div>
          <div style={{ display: 'flex', fontSize: table.competition.name.length > 36 ? 38 : 44, fontWeight: 800, letterSpacing: -1 }}>
            {table.competition.name}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18, marginBottom: 22, padding: '6px 28px', borderRadius: 18, background: '#ffffff', color: '#0b1017' }}>
          <div style={{ display: 'flex', padding: '8px 0', fontSize: 18, fontWeight: 800, color: '#5f6e85' }}>
            <div style={{ display: 'flex', width: 50 }}>#</div>
            <div style={{ display: 'flex', flex: 1 }}>ÉQUIPE</div>
            <div style={{ display: 'flex', width: 80, justifyContent: 'flex-end' }}>MJ</div>
            <div style={{ display: 'flex', width: 90, justifyContent: 'flex-end', color: '#0b1017' }}>PTS</div>
          </div>
          {rows.map((r) => (
            <div key={r.rank} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #e2e8f0', fontSize: 23 }}>
              <div style={{ display: 'flex', width: 50, color: '#5f6e85' }}>{r.rank}</div>
              <div style={{ display: 'flex', flex: 1, fontWeight: r.rank === 1 ? 800 : 400 }}>{r.club.name}</div>
              <div style={{ display: 'flex', width: 80, justifyContent: 'flex-end', color: '#5f6e85' }}>{r.gamesPlayed}</div>
              <div style={{ display: 'flex', width: 90, justifyContent: 'flex-end', fontWeight: 800 }}>{r.points}</div>
            </div>
          ))}
        </div>
      </CardFrame>
    ),
    { ...OG_SIZE, fonts: await ogFonts(), headers: OG_CACHE },
  );
}
