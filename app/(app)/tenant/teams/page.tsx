'use client';

import { TeamsListView } from '@/components/team';

/** The organisation's clubs, across all of its competitions. */
export default function TenantTeamsPage() {
  return <TeamsListView scope="tenant" />;
}
