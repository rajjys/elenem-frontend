'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Loader2 } from 'lucide-react';

import { Button, DatePicker, Input, Label } from '@/components/ui';
import { SplitShell } from '@/components/auth';
import { useAuthStore } from '@/store/auth.store';
import { Gender } from '@/schemas';
import { getApiErrorMessage } from '@/services/api';
import {
  LeagueEssentialsSchema,
  SeasonEssentialsSchema,
  suggestDivision,
  suggestSeasonName,
  useCreateLeague,
  useExistingLeagues,
  useCreateSeason,
  useCreateTeamsBulk,
  useUpdateLeague,
  useUpdateSeason,
  type BulkTeamResult,
  type LeagueEssentialsValues,
  type SeasonEssentialsValues,
} from '@/services/setup';
import { RankingRulesPanel } from './ranking-rules-panel';
import { SetupSummary } from './setup-summary';
import { TeamRowsEditor, emptyRows, filledRows, type EditableTeamRow } from './team-rows-editor';

/**
 * The signed-in half of onboarding: competition, season, clubs.
 *
 * On the same frame as sign-up, because it is the same journey — it looked like a different
 * product when it was a bare full-width column. The panel beside the form fills in as the
 * organiser works, so what they have built so far is visible rather than remembered.
 *
 * Each step writes when it completes; a league that exists is useful on its own. Going back
 * therefore means AMENDING what was created, not creating it twice, which is why the back
 * button issues an update rather than resetting the form.
 */

type Step = 'league' | 'season' | 'teams' | 'done';

const RAIL: { key: Step; label: string }[] = [
  { key: 'league', label: 'Ligue' },
  { key: 'season', label: 'Saison' },
  { key: 'teams', label: 'Équipes' },
];

function isoDate(d: Date): string {
  // Not toISOString(): that converts to UTC first, so at 00:30 in Kinshasa it reports yesterday.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Rail({ current, onJump }: { current: Step; onJump: (s: Step) => void }) {
  const index = RAIL.findIndex((s) => s.key === current);
  const active = index === -1 ? RAIL.length : index;

  return (
    <ol className="flex items-center gap-2 mb-7" aria-label="Progression">
      {RAIL.map((step, i) => {
        const done = i < active;
        const isNow = i === active;
        return (
          <li key={step.key} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
            {/* A completed step is a way back to what you entered, not just a marker. */}
            <button
              type="button"
              disabled={!done}
              onClick={() => done && onJump(step.key)}
              className={[
                'flex items-center gap-2 min-w-0 rounded-md',
                done ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold transition-colors',
                  done
                    ? 'bg-positive text-ink-inverted'
                    : isNow
                      ? 'bg-accent text-accent-ink'
                      : 'bg-surface-sunk text-ink-subtle ring-1 ring-line',
                ].join(' ')}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={[
                  'text-[0.8125rem] truncate',
                  isNow ? 'text-ink font-medium' : 'text-ink-subtle',
                ].join(' ')}
              >
                {step.label}
              </span>
            </button>
            {i < RAIL.length - 1 && <span className="h-px flex-1 bg-line min-w-3" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: Gender.MALE, label: 'Messieurs' },
  { value: Gender.FEMALE, label: 'Dames' },
  { value: Gender.MIXED, label: 'Mixte' },
];

export function SetupWizard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const sportType = user?.tenant?.sportType as string | undefined;

  const [step, setStep] = useState<Step>('league');
  const [league, setLeague] = useState<{ id: string; name: string } | null>(null);
  const [season, setSeason] = useState<{ id: string; name: string } | null>(null);
  const [teamRows, setTeamRows] = useState<EditableTeamRow[]>(() => emptyRows(3));
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [outcome, setOutcome] = useState<BulkTeamResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const existingLeagues = useExistingLeagues(user?.tenantId ?? undefined);
  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
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
      // A season here is a school year more often than a calendar one. A starting point, not a rule.
      endDate: isoDate(new Date(new Date().setMonth(new Date().getMonth() + 9))),
    },
  });

  const teams = useMemo(() => filledRows(teamRows), [teamRows]);

  // The division follows the chosen category until the organiser types one, so creating a second
  // competition does not silently produce a second "D1 Messieurs".
  const leagueGender = leagueForm.watch('gender');
  const divisionEdited = useRef(false);
  useEffect(() => {
    if (divisionEdited.current || league) return;
    leagueForm.setValue('division', suggestDivision(existingLeagues.data?.data, leagueGender));
  }, [leagueGender, existingLeagues.data, league, leagueForm]);
  const seasonStart = seasonForm.watch('startDate');
  const startsInPast = useMemo(
    () => !!seasonStart && new Date(seasonStart) < new Date(new Date().toDateString()),
    [seasonStart],
  );

  const busy =
    createLeague.isPending ||
    updateLeague.isPending ||
    createSeason.isPending ||
    updateSeason.isPending ||
    createTeams.isPending;

  async function submitLeague(values: LeagueEssentialsValues) {
    setFailure(null);
    if (!user?.tenantId) {
      setFailure("Votre organisation n'a pas pu être identifiée. Rechargez la page.");
      return;
    }
    try {
      const saved = league
        ? await updateLeague.mutateAsync({ ...values, id: league.id })
        : await createLeague.mutateAsync({ ...values, tenantId: user.tenantId });
      setLeague({ id: saved.id, name: saved.name });
      setStep('season');
    } catch (error) {
      setFailure(getApiErrorMessage(error));
    }
  }

  async function submitSeason(values: SeasonEssentialsValues) {
    setFailure(null);
    if (!league) return;
    try {
      const saved = season
        ? await updateSeason.mutateAsync({ ...values, id: season.id })
        : await createSeason.mutateAsync({ ...values, leagueId: league.id });
      setSeason({ id: saved.id, name: saved.name });
      setStep('teams');
    } catch (error) {
      setFailure(getApiErrorMessage(error));
    }
  }

  async function submitTeams() {
    setFailure(null);
    if (!league || teams.length === 0) return;
    setProgress({ done: 0, total: teams.length });
    try {
      const result = await createTeams.mutateAsync({
        rows: teams,
        leagueId: league.id,
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

  const aside = (
    <SetupSummary
      organisation={user?.tenant?.name}
      league={league?.name}
      season={season?.name}
      teamCount={step === 'done' ? (outcome?.created.length ?? 0) : teams.length}
      teamsSaved={step === 'done'}
      current={step}
    />
  );

  const errorBanner = failure && (
    <p
      className="mb-5 flex items-start gap-2 rounded-lg border border-negative/30 bg-negative-soft px-3.5 py-2.5 text-sm text-ink"
      role="alert"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-negative" aria-hidden />
      {failure}
    </p>
  );

  // ---------------------------------------------------------------- league
  if (step === 'league') {
    return (
      <SplitShell
        homeHref="/tenant/dashboard"
        aside={aside}
        title="Votre première compétition"
        subtitle="Le championnat ou la coupe que vos équipes disputent. Vous pourrez en ajouter d'autres."
      >
        <Rail current={step} onJump={setStep} />
        {errorBanner}

        {/* Keyed per step. Without it React sees an <Input> in the same position across steps,
            reuses the DOM node, and the field arrives carrying the previous step's text — going
            back to the league name showed the season's. */}
        <form key="league-step" onSubmit={leagueForm.handleSubmit(submitLeague)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="leagueName">Nom de la compétition</Label>
            <Input
              id="leagueName"
              placeholder="Championnat Provincial Messieurs"
              transform="name"
              maxCharacters={100}
              autoTrim
              {...leagueForm.register('name')}
            />
            {leagueForm.formState.errors.name && (
              <p className="text-negative text-xs" role="alert">
                {leagueForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {GENDERS.map((g) => {
                  const selected = leagueForm.watch('gender') === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => leagueForm.setValue('gender', g.value)}
                      aria-pressed={selected}
                      className={[
                        'h-11 rounded-lg border px-1 text-[0.8125rem] font-medium transition-colors',
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
            </div>
          </div>
          <p className="text-xs text-ink-subtle -mt-2">
            Messieurs et Dames sont deux compétitions distinctes, chacune avec son classement.
          </p>

          <RankingRulesPanel sportType={sportType} />

          <div className="flex items-center gap-2.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => router.push('/tenant/dashboard')}
              disabled={busy}
            >
              Je le ferai plus tard
            </Button>
            <Button type="submit" variant="primary" className="flex-1 h-11" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="ml-2">Enregistrement…</span>
                </>
              ) : (
                <>
                  Suivant : la saison
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </SplitShell>
    );
  }

  // ---------------------------------------------------------------- season
  if (step === 'season') {
    return (
      <SplitShell
        homeHref="/tenant/dashboard"
        aside={aside}
        title="La saison en cours"
        subtitle={`${league?.name ?? 'Votre ligue'} a besoin d'une saison pour accueillir des matchs.`}
      >
        <Rail current={step} onJump={setStep} />
        {errorBanner}

        <form key="season-step" onSubmit={seasonForm.handleSubmit(submitSeason)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="seasonName">Nom de la saison</Label>
            <Input
              id="seasonName"
              placeholder="Saison 2026-2027"
              maxCharacters={60}
              autoTrim
              {...seasonForm.register('name')}
            />
            {seasonForm.formState.errors.name && (
              <p className="text-negative text-xs" role="alert">
                {seasonForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Début</Label>
              <DatePicker
                id="startDate"
                value={seasonForm.watch('startDate')}
                onChange={(iso) => seasonForm.setValue('startDate', iso, { shouldValidate: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Fin</Label>
              <DatePicker
                id="endDate"
                value={seasonForm.watch('endDate')}
                onChange={(iso) => seasonForm.setValue('endDate', iso, { shouldValidate: true })}
                invalid={!!seasonForm.formState.errors.endDate}
              />
              {seasonForm.formState.errors.endDate && (
                <p className="text-negative text-xs" role="alert">
                  {seasonForm.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* A league arriving mid-season is the ordinary case, not an edge one: they hear about
              Elenem in February with half the fixtures played. Saying so stops the past date
              reading like a mistake. */}
          <p className="text-xs text-ink-subtle">
            {startsInPast
              ? 'Saison déjà commencée : vous pourrez saisir les matchs déjà joués comme ceux à venir.'
              : 'Votre saison a déjà commencé ? Reculez la date de début — les matchs passés restent saisissables.'}
          </p>

          <div className="flex items-center gap-2.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => setStep('league')}
              disabled={busy}
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Retour
            </Button>
            <Button type="submit" variant="primary" className="flex-1 h-11" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="ml-2">Enregistrement…</span>
                </>
              ) : (
                <>
                  Suivant : les équipes
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </SplitShell>
    );
  }

  // ---------------------------------------------------------------- teams
  if (step === 'teams') {
    return (
      <SplitShell
        homeHref="/tenant/dashboard"
        aside={aside}
        title="Les équipes engagées"
        subtitle="Ajoutez celles que vous connaissez déjà. Les autres peuvent être ajoutées à tout moment."
      >
        <Rail current={step} onJump={setStep} />
        {errorBanner}

        <div key="teams-step" className="space-y-5">
          <TeamRowsEditor rows={teamRows} onChange={setTeamRows} />

          {progress && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                <div
                  className="h-full bg-accent transition-[width]"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-subtle">
                {progress.done} / {progress.total} enregistrées…
              </p>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => setStep('season')}
              disabled={busy}
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Retour
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1 h-11"
              onClick={submitTeams}
              disabled={busy || teams.length === 0}
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="ml-2">Enregistrement…</span>
                </>
              ) : (
                'Terminer la configuration'
              )}
            </Button>
          </div>

          <p className="text-xs text-ink-subtle text-center">
            {teams.length === 0
              ? 'Ajoutez au moins une équipe, ou '
              : `${teams.length} équipe${teams.length > 1 ? 's' : ''} prête${teams.length > 1 ? 's' : ''} à être enregistrée${teams.length > 1 ? 's' : ''}. `}
            <button
              type="button"
              onClick={() => setStep('done')}
              disabled={busy}
              className="underline underline-offset-2 hover:text-ink-muted"
            >
              terminer sans équipes pour l&apos;instant
            </button>
            .
          </p>
        </div>
      </SplitShell>
    );
  }

  // ---------------------------------------------------------------- done
  return (
    <SplitShell
      homeHref="/tenant/dashboard"
      aside={aside}
      align="center"
      title={`${league?.name ?? 'Votre ligue'} est prête.`}
      subtitle={
        outcome && outcome.created.length > 0
          ? `${outcome.created.length} équipe${outcome.created.length > 1 ? 's' : ''} enregistrée${outcome.created.length > 1 ? 's' : ''}${season ? ` pour ${season.name}` : ''}.`
          : 'Vous pourrez ajouter vos équipes quand vous voudrez.'
      }
    >
      <div className="space-y-6">
        {outcome && outcome.failed.length > 0 && (
          <div className="rounded-lg border border-caution/40 bg-caution-soft px-4 py-3 text-left">
            <p className="text-sm font-medium text-ink">
              {outcome.failed.length} ligne{outcome.failed.length > 1 ? 's' : ''} non ajoutée
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
          <ul className="flex flex-wrap justify-center gap-1.5">
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

        <div className="space-y-2.5">
          <Button
            variant="primary"
            className="w-full h-11"
            onClick={() => router.push('/tenant/dashboard')}
          >
            Aller au tableau de bord
            <ArrowRight size={16} className="ml-2" />
          </Button>
          <p className="text-xs text-ink-subtle">
            Prochaine étape : générer le calendrier depuis la page de la saison.
          </p>
        </div>
      </div>
    </SplitShell>
  );
}
