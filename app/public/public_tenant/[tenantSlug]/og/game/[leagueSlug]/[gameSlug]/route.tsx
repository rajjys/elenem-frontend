import { ImageResponse } from 'next/og';
import { siteGet, type PublicClubRef, type PublicGame, type PublicSite } from '@/lib/public-site/api';
import { formatDate, formatTime } from '@/lib/public-site/format';
import { CardFrame, Initials, OG_CACHE, OG_SIZE, bandOf, hostOf, initialsOf, ogFonts } from '@/lib/public-site/og';

/**
 * A game's card (PHASE5B_LEAGUE_SITES §9): the two clubs, and the score large once it is played —
 * or the day and the kickoff before. A result posted in a WhatsApp group is read from this image.
 */
const STATE: Record<string, string> = {
  COMPLETED: 'Terminé',
  FORFEIT: 'Forfait',
  POSTPONED: 'Reporté',
  CANCELLED: 'Annulé',
  AWAITING_RESULT: 'Résultat à venir',
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantSlug: string; leagueSlug: string; gameSlug: string }> },
) {
  const { tenantSlug, leagueSlug, gameSlug } = await params;
  const [site, game] = await Promise.all([
    siteGet<PublicSite>(tenantSlug),
    siteGet<PublicGame>(tenantSlug, `/games/${encodeURIComponent(leagueSlug)}/${encodeURIComponent(gameSlug)}`),
  ]);
  if (!site || !game) return new Response('Match introuvable', { status: 404 });

  const played = game.status === 'COMPLETED' || game.status === 'FORFEIT';
  const home = game.homeScore ?? 0;
  const away = game.awayScore ?? 0;
  const context = [
    game.competition.name,
    game.phase && game.phase.format !== 'LEAGUE' ? game.phase.name : null,
    game.matchday ? `Journée ${game.matchday}` : null,
  ].filter(Boolean);

  return new ImageResponse(
    (
      <CardFrame band={bandOf(site.primaryColor)} league={site.name} host={hostOf(tenantSlug)}>
        <div style={{ display: 'flex', justifyContent: 'center', fontSize: 26, color: 'rgba(255,255,255,0.8)' }}>{context.join(' · ')}</div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Club club={game.home} faded={played && home < away} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {played ? (
              <div style={{ display: 'flex', fontSize: 132, fontWeight: 800, letterSpacing: -4 }}>
                <span style={{ opacity: home < away ? 0.55 : 1 }}>{home}</span>
                <span style={{ margin: '0 22px', opacity: 0.55 }}>–</span>
                <span style={{ opacity: away < home ? 0.55 : 1 }}>{away}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', fontSize: 36 }}>{formatDate(game.localDate)}</div>
                <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>{formatTime(game.localTime)}</div>
              </div>
            )}
            {STATE[game.status] && (
              <div style={{ display: 'flex', marginTop: 10, padding: '6px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', fontSize: 24 }}>
                {STATE[game.status]}
              </div>
            )}
          </div>
          <Club club={game.away} faded={played && away < home} />
        </div>
      </CardFrame>
    ),
    { ...OG_SIZE, fonts: await ogFonts(), headers: OG_CACHE },
  );
}

function Club({ club, faded }: { club: PublicClubRef; faded: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 300, opacity: faded ? 0.6 : 1 }}>
      <Initials text={initialsOf(club.name, 2)} size={132} radius={66} />
      <div style={{ display: 'flex', marginTop: 20, fontSize: 34, fontWeight: 800, textAlign: 'center', justifyContent: 'center', lineHeight: 1.15 }}>
        {club.name}
      </div>
    </div>
  );
}
