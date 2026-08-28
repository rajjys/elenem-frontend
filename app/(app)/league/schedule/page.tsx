'use client';
import { FixtureGenerator } from '@/components/game/fixture-generator';
import { useCurrentUser } from '@/hooks';

export default function LeagueSchedulePage() {
  const user = useCurrentUser();
  return <FixtureGenerator leagueId={user?.managingLeagueId ?? undefined} />;
}
