'use client';

import { StandingsView } from '@/components/standing/standings-view';

/**
 * Where the club stands.
 *
 * The same table as `/league/standings`, on the club's own surface — because `/league/*` is gated
 * to competition administrators in the middleware, and a club administrator is not one. The
 * competition is resolved from their team, and the row for their own club is marked.
 *
 * This is the fact a club administrator opens the product for, and until now their sidebar had
 * two entries, neither of which was it.
 */
export default function TeamStandingsPage() {
  return <StandingsView scope="league" />;
}
