'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Shield, Trophy } from 'lucide-react';
import { Button, ConfirmDialog, SelectField } from '@/components/ui';
import { useGrantAccess, useRevokeAccess, type AdminRole } from '@/services/access';
import { useLeagues } from '@/services/leagues';
import { useTeams } from '@/services/teams';
import type { UserResponse } from '@/services/users';
import { ROLE_HINTS, roleLabel } from '@/utils/role-labels';
import { toastApiError } from '@/utils';

type Held = { role: AdminRole; label: string; over: string | null; icon: React.ElementType };

/**
 * « Rôles et responsabilités »: what this person runs, by name, and the means to change it
 * (ROADMAP_V2 §15, U3) — the person's end of what the competition and club panels do from theirs.
 *
 * Shown to those who may decide it (`useCanManageAccess`); the API holds the rules (the owner, the
 * last administrator, one competition and one club per person) and its refusals are shown as they
 * come.
 */
export function UserResponsibilities({ user }: { user: UserResponse }) {
  const grant = useGrantAccess();
  const revoke = useRevokeAccess();
  const [adding, setAdding] = useState<null | 'LEAGUE_ADMIN' | 'TEAM_ADMIN'>(null);
  const [picked, setPicked] = useState('');
  const [naming, setNaming] = useState(false);
  const [removing, setRemoving] = useState<Held | null>(null);

  const tenantId = user.tenantId ?? undefined;
  const roles = user.roles as string[];
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

  const held: Held[] = [
    roles.includes('TENANT_ADMIN') && { role: 'TENANT_ADMIN' as const, label: roleLabel('TENANT_ADMIN'), over: null, icon: Building2 },
    roles.includes('LEAGUE_ADMIN') && {
      role: 'LEAGUE_ADMIN' as const, label: roleLabel('LEAGUE_ADMIN'), over: user.managingLeague?.name ?? null, icon: Trophy,
    },
    roles.includes('TEAM_ADMIN') && {
      role: 'TEAM_ADMIN' as const, label: roleLabel('TEAM_ADMIN'), over: user.managingTeam?.name ?? null, icon: Shield,
    },
  ].filter(Boolean) as Held[];

  // What may still be given: one competition, one club (and a club only to someone who runs
  // nothing larger — the rule AccessService applies).
  const canAdd = user.isActive && !roles.includes('SYSTEM_ADMIN');
  const canGetLeague = canAdd && !roles.includes('LEAGUE_ADMIN');
  const canGetTeam = canAdd && !roles.some((r) => ['TEAM_ADMIN', 'TENANT_ADMIN', 'LEAGUE_ADMIN'].includes(r));
  const canGetOrg = canAdd && !roles.includes('TENANT_ADMIN');

  const { data: leagues } = useLeagues(tenantId, adding === 'LEAGUE_ADMIN');
  const { data: teams } = useTeams({ tenantId, pageSize: 100 }, adding === 'TEAM_ADMIN');
  const options = useMemo(() => {
    if (adding === 'LEAGUE_ADMIN') return (leagues?.data ?? []).map((l) => ({ value: l.id, label: l.name }));
    if (adding === 'TEAM_ADMIN') {
      return (teams?.data ?? [])
        .map((t) => ({ value: t.id, label: t.league?.name ? `${t.name} · ${t.league.name}` : t.name }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    }
    return [];
  }, [adding, leagues, teams]);

  const give = (role: AdminRole, scope: { leagueId?: string; teamId?: string } = {}) =>
    grant.mutate(
      { userId: user.id, role, ...scope },
      {
        onSuccess: () => {
          toast.success(`Rôle confié à ${name}.`);
          setAdding(null);
          setPicked('');
        },
        onError: (e) => toastApiError(e),
      },
    );

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-ink">Rôles et responsabilités</h2>

      {held.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-4 text-sm text-ink-muted">
          Membre de l’organisation : cette personne ne gère rien pour l’instant.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {held.map((h) => (
            <li key={h.role} className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <h.icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {h.label}
                    {h.over && <span className="font-normal text-ink-muted"> · {h.over}</span>}
                  </p>
                  <p className="text-xs text-ink-subtle">{ROLE_HINTS[h.role]}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setRemoving(h)}>
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      )}

      {(canGetOrg || canGetLeague || canGetTeam) && (
        <div className="mt-3 space-y-3">
          {adding ? (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line p-3">
              <div className="min-w-0 flex-1">
                <SelectField
                  label={adding === 'LEAGUE_ADMIN' ? 'Compétition' : 'Club'}
                  placeholder={adding === 'LEAGUE_ADMIN' ? 'Choisir une compétition' : 'Choisir un club'}
                  value={picked}
                  onChange={setPicked}
                  options={options}
                  className="w-full"
                />
              </div>
              <Button
                variant="primary"
                disabled={!picked || grant.isPending}
                onClick={() => give(adding, adding === 'LEAGUE_ADMIN' ? { leagueId: picked } : { teamId: picked })}
              >
                Confier
              </Button>
              <Button variant="ghost" onClick={() => { setAdding(null); setPicked(''); }}>
                Annuler
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canGetLeague && (
                <Button size="sm" variant="outline" onClick={() => setAdding('LEAGUE_ADMIN')}>
                  <Trophy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Confier une compétition
                </Button>
              )}
              {canGetTeam && (
                <Button size="sm" variant="outline" onClick={() => setAdding('TEAM_ADMIN')}>
                  <Shield className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Confier un club
                </Button>
              )}
              {canGetOrg && (
                <Button size="sm" variant="outline" onClick={() => setNaming(true)}>
                  <Building2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Confier l’administration de l’organisation
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={naming}
        onOpenChange={setNaming}
        title={`Confier l’administration de l’organisation à ${name} ?`}
        description="Cette personne pourra gérer les compétitions, les clubs, le calendrier et les utilisateurs de l’organisation — y compris nommer et retirer d’autres administrateurs."
        confirmLabel="Confier"
        onConfirm={() => give('TENANT_ADMIN')}
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={removing ? `Retirer « ${removing.label}${removing.over ? ` · ${removing.over}` : ''} » ?` : ''}
        description={`${name} perd ce rôle et ce qu’il permettait de gérer. Son compte reste actif.`}
        confirmLabel="Retirer"
        tone="danger"
        onConfirm={() =>
          removing
            ? revoke
                .mutateAsync({ userId: user.id, role: removing.role })
                .then(() => toast.success(`Rôle retiré à ${name}.`))
            : undefined
        }
      />
    </section>
  );
}
