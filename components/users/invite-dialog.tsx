'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MailWarning } from 'lucide-react';
import { Button, Modal, SelectField } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordChecklist, passwordMeetsRules } from '@/components/ui/password-checklist';
import { useInvite, isEmailNotVerified, type InviteRole } from '@/services/access';
import { useLeagues } from '@/services/leagues';
import { useTeams } from '@/services/teams';
import { useCurrentUser } from '@/hooks';
import { cn, toastApiError } from '@/utils';
import { ROLE_HINTS, roleLabel } from '@/utils/role-labels';

/** What the person will do, in the order an organiser thinks of it. */
const CHOICES: { role: InviteRole; label: string; hint: string }[] = [
  {
    role: 'MEMBER',
    label: 'Membre',
    hint: 'Un compte dans l’organisation, sans rien à gérer. Vous pourrez lui confier une compétition ou un club plus tard.',
  },
  { role: 'LEAGUE_ADMIN', label: roleLabel('LEAGUE_ADMIN'), hint: ROLE_HINTS.LEAGUE_ADMIN },
  { role: 'TEAM_ADMIN', label: roleLabel('TEAM_ADMIN'), hint: ROLE_HINTS.TEAM_ADMIN },
  { role: 'TENANT_ADMIN', label: roleLabel('TENANT_ADMIN'), hint: ROLE_HINTS.TENANT_ADMIN },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * « Inviter quelqu'un » (ROADMAP_V2 §15, U2): who, and what they will do.
 *
 * Until now an organisation's administrator could not add anybody to their own organisation — no
 * screen offered it. The API (`POST /access/invite`) decides every rule; this dialog asks the three
 * questions and says what happened.
 *
 * - **An invitation by e-mail** is the default: a 6-digit code and a link, valid three days, and
 *   the person chooses their own password. An address that already has an account in the
 *   organisation is simply given the role.
 * - **A password** instead, for the person standing next to you — nothing is e-mailed.
 * - **An unverified inviter** is told before they try, and offered the code: an invitation is mail
 *   sent in their name (D4). The API refuses it with `EMAIL_NOT_VERIFIED` all the same, and that
 *   lands in the same place.
 *
 * `preset` fixes the role and its scope, for « Inviter un administrateur » from a competition or a
 * club (U3).
 */
export function InviteDialog({
  open,
  onOpenChange,
  tenantId,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The organisation whose competitions and clubs are offered. */
  tenantId?: string;
  preset?: { role: InviteRole; leagueId?: string; teamId?: string; scopeLabel?: string };
}) {
  const me = useCurrentUser();
  const invite = useInvite();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>(preset?.role ?? 'MEMBER');
  const [leagueId, setLeagueId] = useState(preset?.leagueId ?? '');
  const [teamId, setTeamId] = useState(preset?.teamId ?? '');
  const [mode, setMode] = useState<'email' | 'password'>('email');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [refusedUnverified, setRefusedUnverified] = useState(false);

  const { data: leagues } = useLeagues(tenantId, open && role === 'LEAGUE_ADMIN' && !preset);
  const { data: teams } = useTeams({ tenantId, pageSize: 100 }, open && role === 'TEAM_ADMIN' && !preset);

  const leagueOptions = useMemo(
    () => (leagues?.data ?? []).map((l) => ({ value: l.id, label: l.name })),
    [leagues],
  );
  const teamOptions = useMemo(
    () =>
      (teams?.data ?? [])
        .map((t) => ({ value: t.id, label: t.league?.name ? `${t.name} · ${t.league.name}` : t.name }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
    [teams],
  );

  // Said before they try, not only after the refusal (D4).
  const unverified = mode === 'email' && (me?.isEmailVerified === false || refusedUnverified);

  const problems = {
    firstName: !firstName.trim(),
    lastName: !lastName.trim(),
    email: !EMAIL.test(email.trim()),
    scope: (role === 'LEAGUE_ADMIN' && !leagueId) || (role === 'TEAM_ADMIN' && !teamId),
    password: mode === 'password' && !passwordMeetsRules(password),
  };
  const valid = !Object.values(problems).some(Boolean);

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole(preset?.role ?? 'MEMBER');
    setLeagueId(preset?.leagueId ?? '');
    setTeamId(preset?.teamId ?? '');
    setMode('email');
    setPassword('');
    setTried(false);
    setRefusedUnverified(false);
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const submit = () => {
    setTried(true);
    if (!valid) return;
    const address = email.trim().toLowerCase();
    invite.mutate(
      {
        email: address,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        ...(role === 'LEAGUE_ADMIN' ? { leagueId } : {}),
        ...(role === 'TEAM_ADMIN' ? { teamId } : {}),
        ...(mode === 'password' ? { password } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      {
        onSuccess: (res) => {
          const name = [res.person.firstName, res.person.lastName].filter(Boolean).join(' ') || address;
          toast.success(
            !res.created
              ? `${name} avait déjà un compte : le rôle lui est confié.`
              : res.invited
                ? `Invitation envoyée à ${address}.`
                : `Compte créé pour ${name}. Communiquez-lui son mot de passe.`,
          );
          close(false);
        },
        onError: (e) => {
          if (isEmailNotVerified(e)) setRefusedUnverified(true);
          else toastApiError(e, 'L’invitation n’a pas pu être envoyée.');
        },
      },
    );
  };

  const fieldError = (show: boolean, text: string) =>
    tried && show ? <p className="mt-1 text-xs text-negative">{text}</p> : null;

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={preset?.scopeLabel ? `Inviter · ${preset.scopeLabel}` : 'Inviter quelqu’un'}
      className="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={invite.isPending || (unverified && mode === 'email')}>
            {invite.isPending ? 'Envoi…' : mode === 'email' ? 'Envoyer l’invitation' : 'Créer le compte'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="invite-first">Prénom</Label>
            <Input id="invite-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
            {fieldError(problems.firstName, 'Le prénom est requis.')}
          </div>
          <div>
            <Label htmlFor="invite-last">Nom</Label>
            <Input id="invite-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            {fieldError(problems.lastName, 'Le nom est requis.')}
          </div>
        </div>
        <div>
          <Label htmlFor="invite-email">Adresse e-mail</Label>
          <Input
            id="invite-email"
            type="email"
            autoComplete="off"
            placeholder="prenom@exemple.cd"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldError(problems.email, 'Adresse e-mail invalide.')}
          <p className="mt-1 text-xs text-ink-subtle">
            Si cette adresse a déjà un compte dans l’organisation, le rôle lui est simplement confié.
          </p>
        </div>

        {!preset && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Ce que cette personne fera</legend>
            <div className="grid gap-2" role="radiogroup">
              {CHOICES.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  role="radio"
                  aria-checked={role === c.role}
                  onClick={() => setRole(c.role)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-colors',
                    role === c.role ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-sunk',
                  )}
                >
                  <span className={cn('block text-sm font-medium', role === c.role ? 'text-accent-text' : 'text-ink')}>
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{c.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {!preset && role === 'LEAGUE_ADMIN' && (
          <div>
            <Label>Compétition</Label>
            <SelectField label="Compétition" placeholder="Choisir une compétition" value={leagueId} onChange={setLeagueId} options={leagueOptions} className="w-full" />
            {fieldError(problems.scope, 'Choisissez la compétition.')}
          </div>
        )}
        {!preset && role === 'TEAM_ADMIN' && (
          <div>
            <Label>Club</Label>
            <SelectField label="Club" placeholder="Choisir un club" value={teamId} onChange={setTeamId} options={teamOptions} className="w-full" />
            {fieldError(problems.scope, 'Choisissez le club.')}
          </div>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Accès</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['email', 'Invitation par e-mail', 'La personne choisit son mot de passe.'],
                ['password', 'Mot de passe', 'Vous le lui communiquez.'],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors',
                  mode === value ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-sunk',
                )}
              >
                <span className={cn('block text-sm font-medium', mode === value ? 'text-accent-text' : 'text-ink')}>{label}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>
              </button>
            ))}
          </div>
          {mode === 'password' && (
            <div className="mt-3">
              <Label htmlFor="invite-password">Mot de passe</Label>
              <PasswordInput
                id="invite-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordChecklist value={password} showFailures={tried} />
            </div>
          )}
        </fieldset>

        {unverified && (
          <div className="rounded-lg border border-caution/40 bg-caution-soft px-3.5 py-3 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-ink">
              <MailWarning className="h-4 w-4 shrink-0 text-caution" aria-hidden />
              Votre adresse n’est pas encore vérifiée
            </p>
            <p className="mt-1 text-ink-muted">
              L’invitation part en votre nom : vérifiez d’abord votre adresse (un code arrive par
              e-mail), ou définissez plutôt un mot de passe pour cette personne.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" asChild>
                <Link href="/verify-email">Vérifier mon adresse</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode('password')}>
                Définir un mot de passe
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
