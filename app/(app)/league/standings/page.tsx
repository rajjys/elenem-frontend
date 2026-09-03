'use client';

import { StandingsView } from '@/components/standing/standings-view';

/**
 * A competition's table.
 *
 * A thin wrapper, like the calendar pages: `StandingsView` is one component serving both league
 * and organisation scope, so the two tables can never drift apart while still living where a
 * reader expects to find them.
 */
export default function LeagueStandingsPage() {
  return <StandingsView scope="league" />;
}
