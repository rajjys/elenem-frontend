'use client';

import { PlayerStatsView } from '@/components/players/player-stats-view';

/** The competition's scorers. The league is known from the context, so there is no picker. */
export default function LeagueStatsPage() {
  return <PlayerStatsView scope="league" />;
}
