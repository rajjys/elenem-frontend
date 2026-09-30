import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { siteGet, type PublicGame } from '@/lib/public-site/api';
import { formatDate, formatTime, mondayOf } from '@/lib/public-site/format';
import { withParams } from '@/lib/public-site/query';
import { ScoreHeader } from '@/components/league-site/score-header';
import { BoxScoreTable } from '@/components/league-site/box-score-table';
import { isPlayed } from '@/components/league-site/status-badge';

/**
 * One game (PHASE5B_LEAGUE_SITES §6, Match): the score, where and when, and the scoresheet when
 * the officials have entered one. Its title says the result once there is one — that is what a
 * link to it shows in a WhatsApp group.
 */

type Props = { params: Promise<{ tenantSlug: string; leagueSlug: string; gameSlug: string }> };

const load = async ({ params }: Props) => {
  const { tenantSlug, leagueSlug, gameSlug } = await params;
  return siteGet<PublicGame>(tenantSlug, `/games/${encodeURIComponent(leagueSlug)}/${encodeURIComponent(gameSlug)}`);
};

const code = (c: PublicGame['home']) => c.shortCode ?? c.name;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const game = await load(props);
  if (!game) return {};
  const played = isPlayed(game.status);
  const title = played
    ? `${code(game.home)} ${game.homeScore}–${game.awayScore} ${code(game.away)} · ${game.competition.name}`
    : `${code(game.home)} – ${code(game.away)} · ${formatDate(game.localDate)} ${formatTime(game.localTime)}`;
  const description = played
    ? `${game.home.name} ${game.homeScore}, ${game.away.name} ${game.awayScore}. ${game.competition.name}, ${formatDate(game.localDate, 'long')}.`
    : `${game.home.name} contre ${game.away.name}, ${formatDate(game.localDate, 'long')} à ${formatTime(game.localTime)}${game.hall ? `, ${game.hall}` : ''}.`;
  return { title, description: description.slice(0, 155) };
}

export default async function GamePage(props: Props) {
  const game = await load(props);
  if (!game) notFound();
  const played = isPlayed(game.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href={withParams('/games', {}, { week: mondayOf(game.localDate), c: game.competition.slug })}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Matchs de la semaine
      </Link>

      <ScoreHeader game={game} />

      {game.boxScore ? (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-ink">Feuille de marque</h2>
          <BoxScoreTable side={game.boxScore.home} columns={game.boxScore.columns} totalAbbr={game.boxScore.totalAbbr} />
          <BoxScoreTable side={game.boxScore.away} columns={game.boxScore.columns} totalAbbr={game.boxScore.totalAbbr} />
        </div>
      ) : (
        played && (
          <p className="rounded-xl border border-line bg-surface px-5 py-6 text-center text-sm text-ink-muted">
            La feuille de marque de ce match n’a pas été publiée.
          </p>
        )
      )}
    </div>
  );
}
