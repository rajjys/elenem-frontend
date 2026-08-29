'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Loader2,
  Trophy,
  Users,
  CalendarRange,
} from 'lucide-react';

import { Button, Input, Label, TextArea } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { Gender } from '@/schemas';
import { getApiErrorMessage } from '@/services/api';
import {
  LeagueEssentialsSchema,
  SeasonEssentialsSchema,
  parseTeamLines,
  suggestSeasonName,
  useCreateLeague,
  useCreateSeason,
  useCreateTeamsBulk,
  type BulkTeamResult,
  type LeagueEssentialsValues,
  type SeasonEssentialsValues,
} from '@/services/setup';

/**
 * The rest of setting a league up: competition, season, clubs.
 *
 * Runs signed in, so it lives in the app rather than the auth shell, but it is the same journey
 * the sign-up flow starts and it carries the same rail. Each step writes as it is completed —
 * unlike sign-up, where nothing could exist until the end, a league that exists is useful on its
 * own, and an organiser who stops after creating one has still got something.
 *
 * Every step is skippable. An organiser who only wanted an account should not be held here.
 */

type Step = 'league' | 'season' | 'teams' | 'done';

const STEPS: { key: Step; label: string; icon: typeof Trophy }[] = [
  { key: 'league', label: 'Ligue', icon: Trophy },
  { key: 'season', label: 'Saison', icon: CalendarRange },
  { key: 'teams', label: 'Équipes', icon: Users },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: Gender.MALE, label: 'Messieurs' },
  { value: Gender.FEMALE, label: 'Dames' },
  { value: Gender.MIXED, label: 'Mixte' },
];

/**
 * A yyyy-mm-dd string in the viewer's own day, not UTC's.
 *
 * `toISOString()` converts to UTC first, so at 00:30 in Kinshasa (UTC+1) it reports yesterday —
 * and the season a Congolese organiser creates at night starts on the wrong date.
 */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Rail({ current }: { current: Step }) {
  const index = STEPS.findIndex((s) => s.key === current);
  const active = index === -1 ? STEPS.length : index;

  return (
    <ol className="flex items-center gap-2 mb-8" aria-label="Progression">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < active;
        const isNow = i === active;
        return (
          <li key={step.key} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                done
                  ? 'bg-positive text-ink-inverted'
                  : isNow
                    ? 'bg-accent text-accent-ink'
                    : 'bg-surface-sunk text-ink-subtle ring-1 ring-line',
              ].join(' ')}
            >
              {done ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
            </span>
            <span
              className={[
                'text-[0.8125rem] truncate',
                isNow ? 'text-ink font-medium' : 'text-ink-subtle',
              ].join(' ')}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line min-w-3" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function StepFrame({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink text-balance">{title}</h1>
      {hint && <p className="mt-2 text-[0.9375rem] text-ink-muted">{hint}</p>}
      <div className="mt-7">{children}</div>
    </div>
  );
}

export function SetupWizard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>('league');
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState('');
  const [teamsBlock, setTeamsBlock] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [outcome, setOutcome] = useState<BulkTeamResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const createLeague = useCreateLeague();
  const createSeason = useCreateSeason();
  const createTeams = useCreateTeamsBulk();

  const leagueForm = useForm<LeagueEssentialsValues>({
    resolver: zodResolver(LeagueEssentialsSchema),
    defaultValues: { name: '', gender: Gender.MALE, division: 'D1' },
  });

  const seasonForm = useForm<SeasonEssentialsValues>({
    resolver: zodResolver(SeasonEssentialsSchema),
    defaultValues: {
      name: suggestSeasonName(new Date()),
      startDate: isoDate(new Date()),
      // A season is a school year here more often than a calendar one; nine months is the shape
      // of the calendar LIPROBAKIN publish, and it is a starting point, not a rule.
      endDate: isoDate(new Date(new Date().setMonth(new Date().getMonth() + 9))),
    },
  });

  const parsedTeams = useMemo(() => parseTeamLines(teamsBlock), [teamsBlock]);
  const seasonStart = seasonForm.watch('startDate');
  const startsInPast = useMemo(
    () => !!seasonStart && new Date(seasonStart) < new Date(new Date().toDateString()),
    [seasonStart],
  );

  async function onLeagueSubmit(values: LeagueEssentialsValues) {
    setFailure(null);
    if (!user?.tenantId) {
      setFailure("Votre organisation n'a pas pu être identifiée. Rechargez la page.");
      return;
    }
    try {
      const league = await createLeague.mutateAsync({ ...values, tenantId: user.tenantId });
      setLeagueId(league.id);
      setLeagueName(league.name);
      setStep('season');
    } catch (error) {
      setFailure(getApiErrorMessage(error));
    }
  }

  async function onSeasonSubmit(values: SeasonEssentialsValues) {
    setFailure(null);
    if (!leagueId) return;
    try {
      await createSeason.mutateAsync({ ...values, leagueId });
      setStep('teams');
    } catch (error) {
      setFailure(getApiErrorMessage(error));
    }
  }

  async function onTeamsSubmit() {
    setFailure(null);
    if (!leagueId || parsedTeams.length === 0) return;
    setProgress({ done: 0, total: parsedTeams.length });
    try {
      const result = await createTeams.mutateAsync({
        rows: parsedTeams,
        leagueId,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setOutcome(result);
      setStep('done');
    } catch (error) {
      setFailure(getApiErrorMessage(error));
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-8 sm:py-12">
      <Rail current={step} />

      {failure && (
        <p
          className="mb-5 flex items-start gap-2 rounded-lg border border-negative/30 bg-negative-soft px-3.5 py-2.5 text-sm text-ink"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden />
          {failure}
        </p>
      )}

      {/* ---------------- league ---------------- */}
      {step === 'league' && (
        <StepFrame
          title="Créons votre première compétition"
          hint="Une ligue, une coupe, un championnat — ce que vos équipes disputent. Vous pourrez en ajouter d'autres."
        >
          <form onSubmit={leagueForm.handleSubmit(onLeagueSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="leagueName">Nom de la compétition</Label>
              <Input
                id="leagueName"
                placeholder="Championnat Provincial Messieurs"
                {...leagueForm.register('name')}
              />
              {leagueForm.formState.errors.name && (
                <p className="text-negative text-xs" role="alert">
                  {leagueForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map((g) => {
                  const selected = leagueForm.watch('gender') === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => leagueForm.setValue('gender', g.value)}
                      aria-pressed={selected}
                      className={[
                        'rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        selected
                          ? 'border-accent bg-accent-soft text-accent-text'
                          : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
                      ].join(' ')}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
              {/* Men's and women's championships are separate competitions sharing a calendar, so
                  this is the field that keeps their tables apart. */}
              <p className="text-xs text-ink-subtle">
                Messieurs et Dames sont deux compétitions distinctes, avec chacune son classement.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="division">Division</Label>
              <Input
                id="division"
                transform="uppercase"
                maxCharacters={8}
                placeholder="D1"
                {...leagueForm.register('division')}
              />
              {leagueForm.formState.errors.division && (
                <p className="text-negative text-xs" role="alert">
                  {leagueForm.formState.errors.division.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                onClick={() => router.push('/tenant/dashboard')}
              >
                Plus tard
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 h-11"
                disabled={createLeague.isPending}
              >
                {createLeague.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="ml-2">Création…</span>
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </StepFrame>
      )}

      {/* ---------------- season ---------------- */}
      {step === 'season' && (
        <StepFrame
          title="La saison en cours"
          hint={`${leagueName} a besoin d'une saison pour accueillir des matchs.`}
        >
          <form onSubmit={seasonForm.handleSubmit(onSeasonSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="seasonName">Nom de la saison</Label>
              <Input id="seasonName" placeholder="Saison 2026-2027" {...seasonForm.register('name')} />
              {seasonForm.formState.errors.name && (
                <p className="text-negative text-xs" role="alert">
                  {seasonForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Début</Label>
                <Input id="startDate" type="date" {...seasonForm.register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Fin</Label>
                <Input id="endDate" type="date" {...seasonForm.register('endDate')} />
                {seasonForm.formState.errors.endDate && (
                  <p className="text-negative text-xs" role="alert">
                    {seasonForm.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* A league arriving mid-season is the ordinary case, not an edge one: they hear about
                Elenem in February with half the fixtures already played. Saying so here stops the
                past date reading like a mistake. */}
            <p className="text-xs text-ink-subtle">
              {startsInPast
                ? 'Saison déjà commencée : vous pourrez saisir les matchs déjà joués comme les matchs à venir.'
                : 'Votre saison a déjà commencé ? Reculez la date de début, les matchs passés restent saisissables.'}
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                onClick={() => setStep('teams')}
              >
                Ignorer
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 h-11"
                disabled={createSeason.isPending}
              >
                {createSeason.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="ml-2">Création…</span>
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </StepFrame>
      )}

      {/* ---------------- teams ---------------- */}
      {step === 'teams' && (
        <StepFrame
          title="Les équipes engagées"
          hint="Une équipe par ligne. Collez-les depuis votre liste — vous n'avez rien d'autre à saisir."
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="teams">Équipes</Label>
              <TextArea
                id="teams"
                rows={9}
                spellCheck={false}
                value={teamsBlock}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTeamsBlock(e.target.value)}
                placeholder={'BC Virunga\nAS Vita Club\nChaux Sport\nNew Generation'}
                className="font-mono text-sm"
              />
              <p className="text-xs text-ink-subtle">
                {parsedTeams.length > 0
                  ? `${parsedTeams.length} équipe${parsedTeams.length > 1 ? 's' : ''} détectée${parsedTeams.length > 1 ? 's' : ''}. Un sigle est généré automatiquement (vous pourrez le modifier).`
                  : 'Un sigle court est généré pour chaque équipe. Vous pouvez aussi écrire « BC Virunga, VIR ».'}
              </p>
            </div>

            {progress && (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                  <div
                    className="h-full bg-accent transition-[width]"
                    style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-ink-subtle">
                  {progress.done} / {progress.total} créées…
                </p>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                onClick={() => setStep('done')}
                disabled={createTeams.isPending}
              >
                Ignorer
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 h-11"
                onClick={onTeamsSubmit}
                disabled={createTeams.isPending || parsedTeams.length === 0}
              >
                {createTeams.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="ml-2">Création…</span>
                  </>
                ) : (
                  `Ajouter ${parsedTeams.length || ''} équipe${parsedTeams.length > 1 ? 's' : ''}`.trim()
                )}
              </Button>
            </div>
          </div>
        </StepFrame>
      )}

      {/* ---------------- done ---------------- */}
      {step === 'done' && (
        <StepFrame
          title="Votre ligue est prête."
          hint={
            outcome
              ? `${outcome.created.length} équipe${outcome.created.length > 1 ? 's' : ''} enregistrée${outcome.created.length > 1 ? 's' : ''} dans ${leagueName}.`
              : `${leagueName} est en place.`
          }
        >
          <div className="space-y-5">
            {outcome && outcome.failed.length > 0 && (
              <div className="rounded-lg border border-caution/40 bg-caution-soft px-4 py-3">
                <p className="text-sm font-medium text-ink">
                  {outcome.failed.length} ligne{outcome.failed.length > 1 ? 's' : ''} n&apos;
                  {outcome.failed.length > 1 ? 'ont' : 'a'} pas pu être ajoutée
                  {outcome.failed.length > 1 ? 's' : ''} :
                </p>
                <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                  {outcome.failed.map((f) => (
                    <li key={f.name}>
                      <span className="font-medium text-ink">{f.name}</span> — {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {outcome && outcome.created.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {outcome.created.map((t) => (
                  <li
                    key={t.id ?? t.name}
                    className="rounded-full bg-surface-sunk px-2.5 py-1 text-xs text-ink-muted"
                  >
                    {t.name}
                    {t.shortCode && <span className="ml-1.5 text-ink-subtle">{t.shortCode}</span>}
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2.5 pt-1">
              <Button
                variant="primary"
                className="w-full h-11"
                onClick={() => router.push('/tenant/dashboard')}
              >
                Aller au tableau de bord
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <p className="text-center text-xs text-ink-subtle">
                Prochaine étape : générer le calendrier depuis la page de la saison.
              </p>
            </div>
          </div>
        </StepFrame>
      )}
    </div>
  );
}
