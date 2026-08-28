'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useCurrentUser } from '@/hooks';
import { Label } from '@/components/ui';

/**
 * Every player write needs a tenantId and a leagueId, but which ones depends entirely on who is
 * asking: a team admin has them implied by their team, a league admin by their league, a tenant
 * admin has to pick a league. Resolving that in one place keeps the create/edit/bulk dialogs from
 * each inventing their own version.
 */
export function useResolvedScope({
  leagueId,
  teamId,
  tenantId,
}: {
  leagueId?: string;
  teamId?: string;
  tenantId?: string;
}) {
  const user = useCurrentUser();

  // When only a team is known, look up its league and tenant.
  const { data: team } = useQuery({
    queryKey: ['team-scope', teamId],
    queryFn: async () => (await api.get(`/teams/${teamId}`)).data,
    enabled: !!teamId && (!leagueId || !tenantId),
  });

  // When only a league is known, look up its tenant and sport.
  const resolvedLeagueId = leagueId ?? team?.leagueId ?? user?.managingLeagueId ?? undefined;
  const { data: league } = useQuery({
    queryKey: ['league-scope', resolvedLeagueId],
    queryFn: async () => (await api.get(`/leagues/${resolvedLeagueId}`)).data,
    enabled: !!resolvedLeagueId && !tenantId,
  });

  return {
    leagueId: resolvedLeagueId,
    tenantId: tenantId ?? team?.tenantId ?? league?.tenantId ?? user?.tenantId ?? undefined,
    // Players carry a sportType; it always matches the organisation's.
    sportType: (league?.sportType ?? league?.tenant?.sportType ?? 'BASKETBALL') as string,
  };
}

/** Leagues the caller can write to. Scoped server-side, so no filtering needed here. */
export function LeaguePicker({
  value,
  onChange,
  label = 'Ligue',
  required,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  required?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['leagues-picker'],
    queryFn: async () => (await api.get('/leagues?pageSize=100')).data,
  });
  const leagues: { id: string; name: string }[] = data?.data ?? [];

  // A single option is not a choice — select it and stay out of the way.
  useEffect(() => {
    if (!value && leagues.length === 1) onChange(leagues[0].id);
  }, [leagues, value, onChange]);

  if (!isLoading && leagues.length <= 1) return null;

  return (
    <div>
      <Label>{label}{required && ' *'}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">Choisir une ligue…</option>
        {leagues.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
    </div>
  );
}

export function TeamPicker({
  leagueId,
  value,
  onChange,
  label = 'Équipe',
  required,
}: {
  leagueId?: string;
  value: string;
  onChange: (id: string) => void;
  label?: string;
  required?: boolean;
}) {
  const { data } = useQuery({
    queryKey: ['teams-picker', leagueId],
    queryFn: async () =>
      (await api.get(`/teams?pageSize=100${leagueId ? `&leagueId=${leagueId}` : ''}`)).data,
    enabled: !!leagueId,
  });
  const teams: { id: string; name: string }[] = data?.data ?? [];

  return (
    <div>
      <Label>{label}{required && ' *'}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!leagueId}
        className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-sunk disabled:text-ink-subtle"
      >
        <option value="">{leagueId ? 'Sans équipe' : 'Choisir d’abord une ligue'}</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}

/** Small controlled text input used by the player form; keeps the form file readable. */
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  const [touched, setTouched] = useState(false);
  const invalid = required && touched && !value.trim();
  return (
    <div>
      <Label>{label}{required && ' *'}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
          invalid
            ? 'border-negative focus:border-negative focus:ring-negative'
            : 'border-line focus:border-accent focus:ring-accent'
        }`}
      />
      {hint && !invalid && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {invalid && <p className="mt-1 text-xs text-negative">Ce champ est requis.</p>}
    </div>
  );
}
