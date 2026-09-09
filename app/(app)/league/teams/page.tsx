'use client';

import { TeamsListView } from '@/components/team';
import { ContextRequired } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';

/** The competition's clubs. The league is known from the context, so there is no picker. */
export default function LeagueTeamsPage() {
  const { leagueId, isLoading } = useScopeContext();
  if (isLoading) return null;
  if (!leagueId) return <ContextRequired what="ligue" />;
  return <TeamsListView scope="league" />;
}
