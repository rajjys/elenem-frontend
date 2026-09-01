'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, ChevronDown, Wand2 } from 'lucide-react';
import { Button, Label, LoadingSpinner, SelectField } from '@/components/ui';
import { ErrorState } from '@/components/ui/error-state';
import { useScopeContext } from '@/hooks';
import { toastApiError } from '@/utils';
import { useSeasonsForDownload, type CalendarEntry } from '@/services/calendar';
import {
  useDraftFixtures,
  usePublishDraft,
  useVenueOptions,
  type DraftParams,
} from '@/services/calendar-draft';
import { CalendarView } from './calendar-view';
import { DraftInsights } from './draft-insights';

/**
 * The draft workspace.
 *
 * `CALENDAR_MODULE.md` §3 in one screen: a fixture list is generated, laid over the calendar that
 * already exists, studied, and only then published. Nothing here writes until the last button.
 *
 * It replaces `/tenant/schedule`, which asked for a season and a start date and answered with a
 * list of matchdays. That list could not tell you the thing a fixture list is actually judged on —
 * whether it collides with the calendar the organisation already has. The month grid can, because
 * the draft and the existing fixtures are drawn on the same days.
 */

const WEEKDAYS = [
  { value: 1, short: 'Lun' },
  { value: 2, short: 'Mar' },
  { value: 3, short: 'Mer' },
  { value: 4, short: 'Jeu' },
  { value: 5, short: 'Ven' },
  { value: 6, short: 'Sam' },
  { value: 0, short: 'Dim' },
];

const isoDayOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function CalendarGenerate() {
  const scope = useScopeContext();

  const [seasonId, setSeasonId] = useState('');
  const [legs, setLegs] = useState<1 | 2>(1);
  const [from, setFrom] = useState(() => isoDayOf(new Date()));
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return isoDayOf(d);
  });
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([6, 0]);
  const [openingTime, setOpeningTime] = useState('13:30');
  const [slotsPerDay, setSlotsPerDay] = useState(3);
  const [venueId, setVenueId] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const seasons = useSeasonsForDownload(scope.leagueId);
  const venues = useVenueOptions();
  const draftMut = useDraftFixtures();
  const publishMut = usePublishDraft();

  const draft = draftMut.data ?? null;
  const published = publishMut.data ?? null;
  /**
   * A draft goes stale the moment its inputs change.
   *
   * Publishing what is on screen is only safe if what is on screen still matches what was asked
   * for; otherwise the organiser changes the window, reads the old grid, and publishes a fixture
   * list generated from different dates. Clearing on every edit is the cheap, obvious guard.
   */
  const invalidate = () => {
    if (draftMut.data) draftMut.reset();
    if (publishMut.data) publishMut.reset();
  };

  const params: DraftParams | null = seasonId
    ? {
        seasonId,
        legs,
        from,
        to,
        daysOfWeek,
        openingTime,
        slotsPerDay,
        ...(venueId ? { homeVenueId: venueId } : {}),
        ...(duration ? { gameDurationMinutes: Number(duration) } : {}),
      }
    : null;

  /**
   * The draft, reshaped as calendar entries so the grid can draw it without knowing what a draft
   * is. Unplaced fixtures are deliberately absent — they have no day to be drawn on, and the
   * insight panel is where they are reported.
   */
  const draftEntries: CalendarEntry[] = useMemo(() => {
    // Once published they are ordinary fixtures and the calendar reloads them for itself.
    // Leaving the overlay up drew each one twice — a dashed proposal on top of the game it had
    // just become — and the counter read "65 matchs · 15 en projet" for 65 real fixtures.
    if (!draft || published) return [];
    return draft.fixtures
      .filter((f) => f.dateTime)
      .map((f, i) => ({
        id: `draft:${i}`,
        dateTime: f.dateTime as string,
        durationMinutes: draft.gameDurationMinutes,
        status: 'DRAFT',
        leagueId: draft.leagueId,
        venueId: f.venueId,
        courtId: null,
        home: { id: f.homeTeamId, name: f.homeTeamName, shortCode: f.homeTeamShortCode },
        away: { id: f.awayTeamId, name: f.awayTeamName, shortCode: f.awayTeamShortCode },
        homeScore: null,
        awayScore: null,
      }));
  }, [draft, published]);

  /**
   * Where the grid opens: the draft's first month, not the reader's.
   *
   * Derived from the draft rather than from `draftEntries`, which empties on publication — the
   * grid would then have remounted back to today and dropped the organiser three months away
   * from the fixtures they had just created.
   */
  const firstDraftMonth = useMemo(() => {
    const first = draft?.fixtures.find((f) => f.dateTime)?.dateTime;
    return first ? new Date(first) : undefined;
  }, [draft]);

  const seasonOptions = (seasons.data?.data ?? []).map((s) => ({
    value: s.id,
    label: s.league?.name ? `${s.league.name} — ${s.name}` : s.name,
  }));

  function toggleDay(day: number) {
    invalidate();
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function runDraft() {
    if (!params) return;
    // A report about fixtures that were published a minute ago has nothing to say about the
    // draft replacing it on screen.
    publishMut.reset();
    draftMut.mutate(params, { onError: (e) => toastApiError(e) });
  }

  function runPublish() {
    if (!draft) return;
    publishMut.mutate(
      { seasonId: draft.seasonId, fixtures: draft.fixtures },
      {
        onSuccess: (report) => {
          if (report.skippedCount > 0) {
            toast.warning(`${report.createdCount} matchs créés, ${report.skippedCount} refusés.`);
          } else {
            toast.success(`${report.createdCount} matchs publiés au calendrier.`);
          }
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  if (seasons.isError) return <ErrorState title="Impossible de charger les saisons." />;

  const placeable = draft?.fixtures.filter((f) => f.dateTime).length ?? 0;
  const busy = draftMut.isPending || publishMut.isPending;

  return (
    <div className="grid gap-5 lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start">
      {/* ---------- what to generate ---------- */}
      <section className="space-y-4 rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-2">
        <div>
          {/* `htmlFor` rather than a bare heading: `SelectField` names itself from its `label`
              prop, so a visible label that is not tied to the control leaves a screen reader
              announcing an unnamed combo box next to text it has no reason to connect. */}
          <Label htmlFor="draft-season" required>
            Compétition
          </Label>
          {seasons.isPending ? (
            <div className="py-2">
              <LoadingSpinner />
            </div>
          ) : (
            <SelectField
              id="draft-season"
              label="Compétition"
              placeholder="Choisir une saison…"
              value={seasonId}
              onChange={(v) => {
                invalidate();
                setSeasonId(v);
              }}
              options={seasonOptions}
              className="w-full"
            />
          )}
        </div>

        <div>
          <Label>Format</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(
              [
                { v: 1, label: 'Aller simple', hint: 'chaque paire une fois' },
                { v: 2, label: 'Aller-retour', hint: 'aller et retour' },
              ] as const
            ).map((option) => (
              <button
                key={option.v}
                type="button"
                onClick={() => {
                  invalidate();
                  setLegs(option.v);
                }}
                aria-pressed={legs === option.v}
                className={`rounded-md border p-2.5 text-left text-sm transition ${
                  legs === option.v
                    ? 'border-accent bg-accent-soft text-accent-text'
                    : 'border-line hover:border-line-strong'
                }`}
              >
                <span className="block font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* A window, not a start date. The old generator asked when the season began and then ran
            off the end of it; what an organiser actually knows is the stretch of calendar they
            are allowed to use. */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Du</Label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                invalidate();
                setFrom(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <Label>Au</Label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                invalidate();
                setTo(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <Label>Jours de match</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                aria-pressed={daysOfWeek.includes(d.value)}
                className={`rounded-md border px-2.5 py-1.5 text-sm transition ${
                  daysOfWeek.includes(d.value)
                    ? 'border-accent bg-accent-soft font-medium text-accent-text'
                    : 'border-line text-ink-muted hover:border-line-strong'
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-subtle">
            Propre à cette compétition : la D1 peut jouer le week-end et le mercredi pendant que la
            D2 prend ce qui reste.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Premier match</Label>
            <input
              type="time"
              value={openingTime}
              onChange={(e) => {
                invalidate();
                setOpeningTime(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <Label>Matchs / jour</Label>
            <input
              type="number"
              min={1}
              max={12}
              value={slotsPerDay}
              onChange={(e) => {
                invalidate();
                setSlotsPerDay(Math.min(12, Math.max(1, Number(e.target.value) || 1)));
              }}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tabular-nums text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="flex w-full items-center gap-1 rounded-md py-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            aria-hidden
          />
          Salle et durée
        </button>

        {showAdvanced && (
          <div className="space-y-3 rounded-md border border-line bg-surface-sunk p-3">
            <SelectField
              id="draft-venue"
              label="Salle"
              placeholder="Aucune — dates seulement"
              value={venueId}
              onChange={(v) => {
                invalidate();
                setVenueId(v);
              }}
              options={(venues.data?.data ?? []).map((v) => ({ value: v.id, label: v.name }))}
              className="w-full"
            />
            <div>
              <Label>Durée d&apos;un match (min)</Label>
              <input
                type="number"
                min={30}
                max={360}
                placeholder={String(draft?.gameDurationMinutes ?? 100)}
                value={duration}
                onChange={(e) => {
                  invalidate();
                  setDuration(e.target.value === '' ? '' : Number(e.target.value));
                }}
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tabular-nums text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="mt-1 text-xs text-ink-subtle">
                Le temps pendant lequel la salle est occupée, échauffement et remise en place
                compris — pas le temps de jeu. Vide = la valeur du sport.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={runDraft}
            disabled={!seasonId || busy}
            isLoading={draftMut.isPending}
          >
            <Wand2 className="mr-1.5 h-4 w-4" aria-hidden />
            {draft ? 'Regénérer' : 'Générer'}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={runPublish}
            disabled={!draft || placeable === 0 || !!published || busy}
            isLoading={publishMut.isPending}
          >
            Publier
          </Button>
        </div>

        <p className="text-xs text-ink-subtle">
          {published
            ? `${published.createdCount} matchs sont maintenant au calendrier.`
            : draft
              ? `${placeable} match${placeable > 1 ? 's' : ''} seront ajoutés au calendrier. Rien n'est encore enregistré.`
              : "Rien n'est enregistré tant que vous n'avez pas publié."}
        </p>
      </section>

      {/* ---------- the draft, on the calendar it has to live in ---------- */}
      <div className="min-w-0 space-y-4">
        {published && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-positive/30 bg-positive-soft px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" aria-hidden />
            <p className="text-sm text-ink">
              <span className="font-medium">
                {published.createdCount} match{published.createdCount > 1 ? 's' : ''} publié
                {published.createdCount > 1 ? 's' : ''}
              </span>{' '}
              — ils sont maintenant sur le calendrier ci-dessous.
            </p>
            <Link
              href={scope.leagueId ? '/league/calendar' : '/tenant/calendar'}
              className="ml-auto text-sm font-medium text-accent-text hover:underline"
            >
              Voir le calendrier
            </Link>
          </div>
        )}

        {draft && !published && (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
            <span className="font-semibold text-ink">{draft.leagueName}</span>
            <span className="text-ink-muted">
              <span className="tabular-nums">{draft.teamCount}</span> équipes ·{' '}
              <span className="tabular-nums">{draft.requiredFixtureCount}</span> matchs au total
            </span>
            <span className="text-ink-muted">
              <span className="tabular-nums">{draft.existingFixtureCount}</span> déjà au calendrier
            </span>
            <span className="font-medium text-accent-text">
              <span className="tabular-nums">{placeable}</span> en projet
            </span>
            {draft.unplaced.length > 0 && (
              <span className="font-medium text-negative">
                <span className="tabular-nums">{draft.unplaced.length}</span> sans créneau
              </span>
            )}
            <span className="ml-auto text-xs text-ink-subtle">
              créneaux de {draft.gameDurationMinutes} min
            </span>
          </div>
        )}

        {draft && !published && <DraftInsights insights={draft.insights} />}

        {published && published.skippedCount > 0 && (
          <section className="rounded-lg border border-negative/30 bg-negative-soft px-4 py-3">
            <p className="text-sm font-medium text-ink">
              {published.skippedCount} match{published.skippedCount > 1 ? 's ont' : ' a'} été
              refusé{published.skippedCount > 1 ? 's' : ''} à la publication.
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-ink-muted">
              {published.results
                .filter((r) => r.error)
                .slice(0, 4)
                .map((r, i) => (
                  <li key={i}>{r.error}</li>
                ))}
            </ul>
          </section>
        )}

        {!draft && !published && !draftMut.isPending && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
            <CalendarDays className="mb-3 h-8 w-8 text-ink-subtle" aria-hidden />
            <p className="font-medium text-ink">Aucun projet pour l&apos;instant</p>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Choisissez une compétition et une période, puis générez. Les matchs déjà au
              calendrier sont pris en compte : ils occupent leur créneau et ne sont jamais
              recréés.
            </p>
          </div>
        )}

        {/* The grid is always mounted, so the organiser can look at the calendar they are about
            to add to before generating anything — which is the first thing anyone does. */}
        <CalendarView
          key={firstDraftMonth ? firstDraftMonth.toISOString().slice(0, 7) : 'empty'}
          draftEntries={draftEntries}
          initialMonth={firstDraftMonth}
        />
      </div>
    </div>
  );
}
