'use client';

import { StandingsView } from '@/components/standing/standings-view';

/**
 * The organisation's tables.
 *
 * Standings had no entry point at all for a tenant admin: the page lived under `/league`, nothing
 * in the organisation's sidebar pointed at it, and reaching it meant knowing to open a competition
 * first. At LIPROBAKIN the person who publishes the table is the tenant's community manager, not
 * a league administrator — so the one screen he needs was the one screen his sidebar did not have.
 */
export default function TenantStandingsPage() {
  return <StandingsView scope="tenant" />;
}
