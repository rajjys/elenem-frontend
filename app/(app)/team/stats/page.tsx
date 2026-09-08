'use client';

import { PlayerStatsView } from '@/components/players/player-stats-view';

/**
 * The club's scorers.
 *
 * Opens filtered to the club's own players, because that is what a club opens it for — and does
 * not lock the filter, because the competition's leaderboard is a published fact a club may read
 * for exactly the reason it may read the table.
 */
export default function TeamStatsPage() {
  return <PlayerStatsView scope="team" />;
}
