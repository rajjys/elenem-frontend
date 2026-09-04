'use client';

import { StandingsView } from '@/components/standing/standings-view';

/**
 * Where the club stands.
 *
 * The same table as `/league/standings`, on the club's own surface — because `/league/*` is gated
 * to competition administrators in the middleware, and a club administrator is not one. The
 * competition is resolved from their team, and the row for their own club is marked.
 *
 * **Read-only for everybody**, including a tenant admin who happens to open this route: this is
 * the club's copy of the table, and a "Recalculer" button on it invites the reading that a club
 * can move its own position. The same person edits the same table from `/league/standings`.
 */
export default function TeamStandingsPage() {
  return <StandingsView scope="team" />;
}
