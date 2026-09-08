'use client';

import { PlayerStatsView } from '@/components/players/player-stats-view';

/**
 * The organisation's scorers.
 *
 * Same argument as `/tenant/standings`: at LIPROBAKIN the person who publishes what the
 * competition produced every matchday is the organisation's community manager, not a league
 * administrator — so the screen has to exist on their surface, with the competition picker they
 * need and nobody else does.
 */
export default function TenantStatsPage() {
  return <PlayerStatsView scope="tenant" />;
}
