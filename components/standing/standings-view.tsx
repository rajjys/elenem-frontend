'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { AlertTriangle, FileDown, Loader2, RefreshCw, SlidersHorizontal, Trophy } from 'lucide-react';
import { PageHeader, PageShell, SelectField, Tooltip } from '@/components/ui';
import { cn, toastApiError } from '@/utils';
import { useCurrentUser, useScopeContext } from '@/hooks';
import { useStages } from '@/services/stages';
import { BracketView } from './bracket-view';
import { Roles } from '@/schemas';
import {
  useRecalculateStandings,
  useStandings,
  useStandingsLeagues,
  useStandingsSeasons,
  type StandingsColumn,
} from '@/services/standings';

/**
 * The league table.
 *
 * One component for every scope, the way `CalendarView` is — a tenant admin picks between their
 * competitions, a league admin's is chosen for them and the selector disappears rather than
 * offering a list of one. Before this, standings simply did not exist for a tenant admin: the
 * page lived at `/league/standings`, nothing in the organisation's sidebar pointed at it, and
 * reaching it meant knowing to drill into a competition first.
 *
 * **There is almost nothing to do here, and the design says so.** A table is derived from
 * completed games; you cannot edit a row, and a screen that implies you can is lying about where
 * the authority lives. So there is one control, it is quiet, and it is for the single case the
 * engine cannot notice on its own — the scoring rules changed underneath a table already computed.
 *
 * What the screen does owe the reader is grounds for believing it, because the artefact it is
 * replacing is a table a committee computes by hand and signs. Three things carry that:
 *
 *  - **when it was computed**, stated plainly;
 *  - **how many results it is derived from**, and how many played fixtures have not been entered —
 *    the gap between those two is the honest answer to "why is my club's record wrong", and it was
 *    invisible;
 *  - **the points rule**, written out in the table's own column names, so a row can be checked
 *    with a pencil. That is the thing a hand-made table has and a generated one usually loses.
 */
export function StandingsView({
  /**
   * Which surface this is, and therefore what may be done on it.
   *
   * `team` is the club's own copy and is **read-only for everybody**, including the tenant admin
   * who could edit the same table from `/league/standings`. A screen whose controls appear or
   * disappear depending on who is looking at it is a screen nobody can be shown how to use — and
   * on a club's page, the presence of "Recalculer" invites the reading that a club can move its
   * own position.
   */
  scope,
}: {
  scope: 'tenant' | 'league' | 'team';
}) {
  const ctx = useScopeContext();
  const user = useCurrentUser();

  // Skipped entirely on a league-scoped screen whose competition is already known — which is also
  // what keeps this working for a club administrator, who is refused the list outright.
  const leagues = useStandingsLeagues(scope === 'tenant');
  // Everything a reader can *do* to a table, decided once. The club's surface allows none of it,
  // whoever is looking; elsewhere it follows the role.
  const readOnly =
    scope === 'team' ||
    !(user?.roles ?? []).some(
      (r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN || r === Roles.LEAGUE_ADMIN,
    );
  const options = useMemo(() => leagues.data?.data ?? [], [leagues.data]);

  const [leagueId, setLeagueId] = useState('');
  const [seasonId, setSeasonId] = useState('');

  // A league-scoped screen takes its competition from the context, and a tenant-scoped one opens
  // on the first — a table nobody asked to see beats an empty frame with two dropdowns on it.
  useEffect(() => {
    if (leagueId) return;
    const fromScope = scope === 'tenant' ? undefined : ctx.leagueId;
    const next = fromScope ?? options[0]?.id;
    if (next) setLeagueId(next);
  }, [leagueId, scope, ctx.leagueId, options]);

  /**
   * Only a competition's administrator can list its seasons, and only they are offered the picker.
   *
   * A club administrator was asking anyway and being refused on every visit — a 403 in their
   * console, a wasted request on a connection that pays by the megabyte, and the answer was never
   * going to change. Not asking is the fix; the refusal itself is correct (`GAME_AND_STANDINGS`
   * §3.5 — they administer a team, not a competition).
   */
  const seasons = useStandingsSeasons(readOnly ? undefined : leagueId || undefined);
  const seasonOptions = useMemo(() => seasons.data?.data ?? [], [seasons.data]);

  // Only ever to *change* season. Left empty, the server answers with the current one — so a
  // reader who cannot list seasons still gets the table, rather than an empty frame.
  useEffect(() => {
    if (!seasonOptions.length) return;
    if (seasonOptions.some((s) => s.id === seasonId)) return;
    const league = options.find((l) => l.id === leagueId);
    setSeasonId(league?.currentSeasonId ?? seasonOptions[seasonOptions.length - 1].id);
  }, [seasonOptions, seasonId, options, leagueId]);

  /**
   * Which phase, and which pool inside it.
   *
   * Both left empty until the reader changes them, so the server answers with the phase being
   * played — which is what a club administrator gets, since they cannot list seasons or phases and
   * would otherwise see an empty frame. The controls appear only past one option, the same rule
   * the season picker already follows.
   */
  const [stageId, setStageId] = useState('');
  const [groupId, setGroupId] = useState('');

  const standings = useStandings(
    leagueId || undefined,
    seasonId || undefined,
    stageId || undefined,
    groupId || undefined,
  );
  const stages = useStages(seasonId || undefined);
  const stageOptions = useMemo(() => stages.data ?? [], [stages.data]);

  // A season change is a different set of phases, so the phase and pool stop meaning anything.
  useEffect(() => {
    setStageId('');
    setGroupId('');
  }, [seasonId]);
  const recalc = useRecalculateStandings();

  const data = standings.data;
  const columns = data?.columns ?? [];
  // Where the missing scores are entered. The banner says a number is incomplete; without this it
  // does not say what to do about it.
  const calendarHref =
    scope === 'tenant' ? '/tenant/calendar' : `/league/calendar?ctxLeagueId=${leagueId}`;

  // Null rather than undefined: `undefined === undefined` would highlight every row for a reader
  // who administers no club.
  const myTeamId = user?.managingTeamId ?? ctx.teamId ?? null;

  return (
    <PageShell>
      {/* One header shape for every screen: the title and the primary action on the same line, the
          controls that decide *what* is shown underneath it. The bespoke row this replaced put
          « Publier » in among the pickers, at a different height and a different inset from
          « Nouveau joueur » two clicks away. */}
      <PageHeader
        title="Classement"
        description="Calculé à partir des matchs terminés — jamais saisi à la main."
        action={
          /* The export renders a table. A knockout has a bracket, and offering to publish a
             classement that does not exist is the screen promising something it cannot do. */
          /* And only once there is a table to publish. A league whose season has not started has
             an empty classement, and offering to export it is the screen promising a document that
             would come out blank. */
          !readOnly && data && data.stageFormat !== 'KNOCKOUT' && data.rows.length > 0
            ? {
                label: 'Publier',
                href: `/league/standings/export?ctxLeagueId=${data.leagueId}&seasonId=${data.seasonId}`,
                icon: FileDown,
              }
            : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* A single competition is not a choice, and a dropdown offering one option is furniture
              that has to be read before it can be dismissed. */}
          {scope === 'tenant' && options.length > 1 && (
            <SelectField
              label="Compétition"
              placeholder="Compétition"
              value={leagueId}
              onChange={setLeagueId}
              className="w-64"
              options={options.map((l) => ({ value: l.id, label: l.name }))}
            />
          )}
          {seasonOptions.length > 1 && (
            <SelectField
              label="Saison"
              placeholder="Saison"
              value={seasonId}
              onChange={setSeasonId}
              className="w-44"
              options={seasonOptions.map((s) => ({ value: s.id, label: s.name }))}
            />
          )}
          {/* A table belongs to a phase, not to a season — EUBAGO publish « le classement phase de
              6 » — so a season with more than one gets a switcher, and one with a single phase
              never learns the word. */}
          {stageOptions.length > 1 && (
            <SelectField
              label="Phase"
              placeholder="Phase"
              value={stageId || data?.stageId || ''}
              onChange={(v) => {
                setStageId(v);
                setGroupId('');
              }}
              className="w-48"
              options={stageOptions.map((st) => ({ value: st.id, label: st.name }))}
            />
          )}
          {/* A pool is a table of its own. */}
          {(data?.groups.length ?? 0) > 1 && (
            <SelectField
              label="Poule"
              placeholder="Poule"
              value={groupId || data?.groupId || ''}
              onChange={setGroupId}
              className="w-36"
              options={(data?.groups ?? []).map((g) => ({ value: g.id, label: g.name }))}
            />
          )}
        </div>
      </PageHeader>

      {scope === 'tenant' && options.length > 1 && data && (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink">
          <Trophy className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
          {data.leagueName}
          <span className="font-normal text-ink-subtle">· {data.seasonName}</span>
        </p>
      )}

      {standings.isPending && leagueId ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
        </div>
      ) : !data ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-16 text-center text-sm text-ink-muted">
          Aucune compétition à classer pour le moment.
        </p>
      ) : data.stageFormat === 'KNOCKOUT' ? (
        /* A knockout produces a bracket, not a table — `StageFormat` says so and this obeys it,
           rather than any screen having to ask "is this a play-off". */
        <BracketView stageId={data.stageId} stageName={data.stageName} />
      ) : data.rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-16 text-center text-sm text-ink-muted">
          Aucun match n&apos;a encore été joué dans cette saison. Le classement apparaîtra dès le
          premier résultat enregistré.
        </p>
      ) : (
        <>
          {/* Played but not entered. This is the difference between a table that is wrong and a
              table that is incomplete, and only one of those is anybody's fault. */}
          {/* Not on a club's page: it is a note to whoever enters results, and there is nothing
              a club administrator can do about it but worry. */}
          {data.pendingResults > 0 && !readOnly && (
            <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-caution/40 bg-caution-soft px-3.5 py-2.5 text-sm text-ink">
              <AlertTriangle className="h-4 w-4 shrink-0 text-caution" aria-hidden />
              {data.pendingResults} match{data.pendingResults > 1 ? 's' : ''} dont la date est
              passée {data.pendingResults > 1 ? 'n’ont' : 'n’a'} pas encore de score.
              {/* A link, not a button. A call to action promises something specific, and this
                  cannot deliver it — the calendar is a month, not the four fixtures in question,
                  so "Saisir les scores" was a promise the destination does not keep. */}
              <Link
                href={calendarHref}
                className="font-medium text-accent-text underline underline-offset-2 transition-colors hover:text-ink"
              >
                Ouvrir le calendrier
              </Link>
            </p>
          )}

          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm sm:min-w-[36rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-sunk text-[0.6875rem] uppercase tracking-wide text-ink-subtle">
                    <th scope="col" className="w-9 px-2 py-2 text-center font-medium">
                      #
                    </th>
                    <th scope="col" className="min-w-[9rem] px-2 py-2 text-left font-medium">
                      Équipe
                    </th>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        scope="col"
                        className={cn(
                          'w-12 px-1 py-2 text-center font-medium',
                          c.key === 'points' && 'text-ink',
                          !PHONE_COLUMNS.has(c.key) && 'hidden sm:table-cell',
                        )}
                      >
                        <Tooltip label={c.label}>
                          <span className="cursor-help">{c.abbr}</span>
                        </Tooltip>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.rows.map((row) => {
                    const mine = row.teamId === myTeamId;
                    return (
                      <tr
                        key={row.teamId}
                        className={cn(
                          'transition-colors hover:bg-surface-sunk',
                          mine && 'bg-accent-soft',
                        )}
                      >
                        {/* The band is a stripe on the rank, not a wash over the row: the row
                            already carries the reader's own club, and two full-width tints
                            fighting each other is how a table stops being readable. It is also
                            how the published bulletin marks it. */}
                        <td
                          className={cn(
                            'relative px-2 py-2 text-center text-sm tabular-nums text-ink-muted',
                            row.band === 'QUALIFICATION' &&
                              'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-positive',
                            row.band === 'RELEGATION' &&
                              'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-negative',
                          )}
                        >
                          {row.rank}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="hidden h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface-sunk sm:block">
                              {row.logoUrl && (
                                <Image
                                  src={row.logoUrl}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            {/* The most obvious thing to want from a league table is the club you
                                just read — but only where the reader may open it. A club
                                administrator gets ten links to nine dashboards they are refused,
                                which is worse than plain text. */}
                            {readOnly ? (
                              <span
                                className={cn(
                                  'min-w-0 truncate',
                                  mine ? 'font-semibold text-ink' : 'text-ink',
                                )}
                              >
                                {row.teamName}
                              </span>
                            ) : (
                              <Link
                                href={`/team/dashboard?ctxTeamId=${row.teamId}&ctxLeagueId=${data.leagueId}`}
                                className={cn(
                                  'min-w-0 truncate underline-offset-4 hover:underline',
                                  mine ? 'font-semibold text-ink' : 'text-ink',
                                )}
                              >
                                {row.teamName}
                              </Link>
                            )}
                          </div>
                        </td>
                        {columns.map((c) => (
                          <td
                            key={c.key}
                            className={cn(
                              'px-1 py-2 text-center tabular-nums',
                              c.key === 'points'
                                ? 'font-semibold text-ink'
                                : 'text-ink-muted',
                              !PHONE_COLUMNS.has(c.key) && 'hidden sm:table-cell',
                            )}
                          >
                            {formatCell(c, row[c.key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* The grounds for believing the table, at the foot of it — where a signed bulletin
                puts them. */}
            <div className="space-y-1.5 border-t border-line bg-surface-sunk px-3.5 py-3 text-xs text-ink-muted">
              {/* The legend, only when there is something to explain. A coloured stripe with no
                  key is decoration; with one it is the competition's promise in writing. */}
              {(data.rules.bands.qualification || data.rules.bands.relegation) && (
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {data.rules.bands.qualification && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-1 shrink-0 rounded-sm bg-positive" aria-hidden />
                      {data.rules.bands.qualification.label}
                      <span className="text-ink-subtle">
                        (1–{data.rules.bands.qualification.count})
                      </span>
                    </span>
                  )}
                  {data.rules.bands.relegation && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-1 shrink-0 rounded-sm bg-negative" aria-hidden />
                      {data.rules.bands.relegation.label}
                      <span className="text-ink-subtle">
                        ({data.rows.length - data.rules.bands.relegation.count + 1}–
                        {data.rows.length})
                      </span>
                    </span>
                  )}
                </p>
              )}
              <p>
                <span className="font-medium text-ink">{data.rules.formula}</span>
                {data.rules.tieBreakers.length > 0 && (
                  <>
                    {' · '}
                    En cas d&apos;égalité : {data.rules.tieBreakers.join(', puis ').toLowerCase()}
                  </>
                )}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  {data.gamesCounted} résultat{data.gamesCounted > 1 ? 's' : ''} pris en compte
                  {data.lastCalculated && ` · calculé le ${whenCalculated(data.lastCalculated)}`}
                </span>
                {!readOnly && (
                  <>
                    {/* Quiet on purpose: a result already rebuilds the table, so this is never the
                        fix for a row that looks wrong. It is for a scoring rule that changed after
                        the fact — rare, and invisible to the engine when it happens. */}
                    <button
                      type="button"
                      onClick={() =>
                        recalc.mutate(
                          // The table's own season, not the picker's — which is empty for a
                          // reader who cannot list seasons.
                          { leagueId, seasonId: data.seasonId },
                          {
                            onSuccess: () => toast.success('Classement recalculé.'),
                            onError: (e) => toastApiError(e),
                          },
                        )
                      }
                      disabled={recalc.isPending}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-ink-subtle transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
                    >
                      <RefreshCw
                        className={cn('h-3 w-3', recalc.isPending && 'animate-spin')}
                        aria-hidden
                      />
                      Recalculer
                    </button>
                    <Link
                      href={`/league/settings?ctxLeagueId=${data.leagueId}&tab=classement`}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-ink-subtle transition-colors hover:bg-surface hover:text-ink"
                    >
                      <SlidersHorizontal className="h-3 w-3" aria-hidden />
                      Règles du classement
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

/**
 * The columns a phone keeps.
 *
 * The full table is eight numeric columns, which at 390px pushes PTS off the right edge — so the
 * one column the reader came for is the one they have to go looking for. These three are the
 * classic pocket league table: how many played, the differential, and the points. The rest are
 * still there from `sm` up, where the width exists.
 */
const PHONE_COLUMNS = new Set(['gamesPlayed', 'goalDifference', 'points']);

/** Goal difference is the one column where the sign is the information. */
function formatCell(column: StandingsColumn, value: number): string {
  if (column.key === 'goalDifference' && value > 0) return `+${value}`;
  return String(value);
}

function whenCalculated(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}
