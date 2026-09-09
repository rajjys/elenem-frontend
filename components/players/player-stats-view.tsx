'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowDown, ArrowUp, FileText, Loader2, Trophy } from 'lucide-react';
import { Input, PageHeader, PageShell, Pagination, SelectField, Tooltip } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useCurrentUser } from '@/hooks/useAuth';
import { Roles } from '@/schemas/enums';
import { useStandingsLeagues, useStandingsSeasons } from '@/services/standings';
import { usePlayerLeaderboard, type LeaderboardRow } from '@/services/player-stats';
import { cn } from '@/utils';
import { PlayerQuickView } from './player-quick-view';

/**
 * "The whole season" as a value, because it cannot be the absence of one.
 *
 * A Radix `Select.Item` refuses `value=""` — an empty string is how a Select is *cleared*, so an
 * option carrying one is indistinguishable from no selection and the component throws. The server
 * still receives an omitted `stageId` for this case: the sentinel lives on this side of the wire
 * only, where the control needs something to be.
 */
const WHOLE_SEASON = 'season';

/** Twenty-five rows. Nobody reads past the top twenty of a scorers' list. */
const PAGE_SIZE = 25;

/**
 * The scorers' list — one component for the organisation, the competition and the club, the way
 * `StandingsView` is one component for three scopes and `CalendarView` for two.
 *
 * **It is one table, and that is the design.** The owner asked for four things — meilleur marqueur,
 * moyenne par match, volume de trois points, matchs joués — and four leaderboards would each have
 * had to name a basketball statistic in its own code. The sport declares its columns
 * (`sport-stat-columns.ts`), the server sends them beside the rows, and every column here sorts:
 * best scorer is how it opens, volume of threes is a click on « 3 pts », appearances a click on
 * « MJ ». The same screen in a football league reads « Buts · PD · CJ · CR » with nothing changed.
 *
 * See `docs/PLAYERS_AND_STATS.md` §1.
 */
export function PlayerStatsView({
  scope,
}: {
  /** Which surface this is mounted on. Decides which pickers exist, not what the reader may see. */
  scope: 'tenant' | 'league' | 'team';
}) {
  const ctx = useScopeContext();
  const user = useCurrentUser();

  // A club administrator is refused this list outright — they are not choosing a competition, they
  // are in one — so it is not even asked for outside the organisation's surface.
  const leagues = useStandingsLeagues(scope === 'tenant');
  const options = useMemo(() => leagues.data?.data ?? [], [leagues.data]);

  const isOrganiser = (user?.roles ?? []).some(
    (r) => r === Roles.SYSTEM_ADMIN || r === Roles.TENANT_ADMIN || r === Roles.LEAGUE_ADMIN,
  );

  const [leagueId, setLeagueId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [stageId, setStageId] = useState(WHOLE_SEASON);
  const [minGames, setMinGames] = useState(1);
  const [open, setOpen] = useState<LeaderboardRow | null>(null);

  useEffect(() => {
    if (leagueId) return;
    const fromScope = scope === 'tenant' ? undefined : ctx.leagueId;
    const next = fromScope ?? options[0]?.id;
    if (next) setLeagueId(next);
  }, [leagueId, scope, ctx.leagueId, options]);

  // Only a competition's administrator can list its seasons, so only they are offered the picker.
  // Left empty, the server answers with the current season — which is how a club administrator
  // gets a list at all rather than an empty frame (`GAME_AND_STANDINGS` §3.5).
  const seasons = useStandingsSeasons(isOrganiser ? leagueId || undefined : undefined);
  const seasonOptions = useMemo(() => seasons.data?.data ?? [], [seasons.data]);

  useEffect(() => {
    if (!seasonOptions.length) return;
    if (seasonOptions.some((s) => s.id === seasonId)) return;
    const league = options.find((l) => l.id === leagueId);
    setSeasonId(league?.currentSeasonId ?? seasonOptions[seasonOptions.length - 1].id);
  }, [seasonOptions, seasonId, options, leagueId]);

  // A different season is a different set of phases, so the phase stops meaning anything.
  useEffect(() => setStageId(WHOLE_SEASON), [seasonId]);

  /**
   * The club's own screen opens on its own players, and does not lock them there.
   *
   * Where a club's scorer ranks in the championship is the second question a club asks, right after
   * how many he has — and the leaderboard is a published fact about a competition, readable by a
   * club for exactly the reason its table is (`GAME_AND_STANDINGS` §3.1). So the filter is a
   * two-chip toggle rather than a hidden default: what is being shown is stated, and the other
   * answer is one click away.
   */
  const myTeamId = user?.managingTeamId ?? ctx.teamId ?? '';
  const [onlyMyTeam, setOnlyMyTeam] = useState(true);
  const teamId = scope === 'team' && onlyMyTeam ? myTeamId : '';

  const stageFilter = stageId === WHOLE_SEASON ? undefined : stageId;

  const query = usePlayerLeaderboard({
    leagueId: leagueId || undefined,
    seasonId: seasonId || undefined,
    stageId: stageFilter,
    teamId: teamId || undefined,
    minGames,
  });
  const data = query.data;
  const columns = useMemo(() => data?.columns ?? [], [data]);

  /**
   * What the table is ordered by. `total` on open, because "who scored most" is the question the
   * screen is for and every other one is a click away.
   */
  const [sort, setSort] = useState<string>('total');
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const toggle = (key: string) => {
    // Back to the top: sorting by threes and staying on page 3 shows you ranks 51-75 of a list you
    // have just reordered, which is nobody's intent.
    setPage(1);
    if (sort === key) return setAsc((v) => !v);
    setSort(key);
    setAsc(false); // A new column always starts at "most", which is what a leaderboard means.
  };

  const rows = useMemo(() => {
    const value = (r: LeaderboardRow) =>
      sort === 'total' ? r.total
        : sort === 'average' ? r.average
        : sort === 'gamesPlayed' ? r.gamesPlayed
        : (r.stats[sort] ?? 0);
    const sorted = [...(data?.rows ?? [])].sort(
      (a, b) =>
        (asc ? value(a) - value(b) : value(b) - value(a)) ||
        b.total - a.total ||
        a.lastName.localeCompare(b.lastName, 'fr'),
    );
    return sorted;
  }, [data?.rows, sort, asc]);

  /**
   * Paged, because a competition's whole squad list is not a leaderboard.
   *
   * Goma D1 Messieurs already returns 49 rows on three entered sheets; Kinshasa's 25 clubs are
   * 250 players before a single one of them scores. Nobody reads past the top twenty of a
   * scorers' list, and the ones who want the tail can sort or filter to it.
   *
   * Sorted and paged on the client on purpose. The rows are the phase's, they arrive in one
   * response, and every column is sortable — asking the server to re-rank on each click would be
   * a round trip for an ordering the browser already has the data for.
   */
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  // A filter that shortens the list must not strand the reader on a page past its end.
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const stageOptions = data?.stages ?? [];

  return (
    <PageShell>
      {/* Same header shape as the table and the roster: title and primary action on one line, the
          controls that decide what is shown underneath. This screen has no primary action — a
          leaderboard is derived and there is nothing to do to it — so the row is controls only. */}
      <PageHeader
        title="Statistiques des joueurs"
        description="Calculées à partir des feuilles de match — jamais saisies à la main."
      >
        <div className="flex flex-wrap items-center gap-2">
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
          {/* The whole season first, and it is the default. A table belongs to a phase because a
              table decides who advances; a leaderboard decides nothing, and the award a league
              hands out is for the season. A season with one phase never shows this control. */}
          {stageOptions.length > 1 && (
            <SelectField
              label="Phase"
              placeholder="Phase"
              value={stageId}
              onChange={setStageId}
              className="w-48"
              options={[
                { value: WHOLE_SEASON, label: 'Toute la saison' },
                ...stageOptions.map((st) => ({ value: st.id, label: st.name })),
              ]}
            />
          )}
          {scope === 'team' && myTeamId && (
            <div className="inline-flex overflow-hidden rounded-lg border border-line" role="group">
              {[
                { on: true, label: 'Mon club' },
                { on: false, label: 'Tout le championnat' },
              ].map((o) => (
                <button
                  key={String(o.on)}
                  type="button"
                  onClick={() => setOnlyMyTeam(o.on)}
                  aria-pressed={onlyMyTeam === o.on}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    onlyMyTeam === o.on
                      ? 'bg-surface-sunk font-medium text-ink'
                      : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
          {/* Visible rather than implicit. Sorting by the per-game column with no floor puts
              whoever played once and scored eleven at the top, and a hidden qualifier is how a
              leaderboard becomes something to argue about. */}
          <label className="flex items-center gap-1.5 text-sm text-ink-muted">
            <span className="whitespace-nowrap">Min. matchs</span>
            <Input
              type="number"
              min={1}
              max={200}
              value={minGames}
              onChange={(e) => setMinGames(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 text-center tabular-nums"
              aria-label="Nombre minimum de matchs joués"
            />
          </label>
        </div>
      </PageHeader>

      {scope === 'tenant' && options.length > 1 && data && (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink">
          <Trophy className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
          {data.leagueName}
          <span className="font-normal text-ink-subtle">· {data.seasonName}</span>
        </p>
      )}

      {query.isPending && leagueId ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
        </div>
      ) : !data ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-16 text-center text-sm text-ink-muted">
          Aucune compétition à afficher pour le moment.
        </p>
      ) : columns.length === 0 ? (
        /* A sport with no scoresheet declared. The honest answer, rather than offering
           basketball's columns to a golf league. */
        <p className="rounded-lg border border-dashed border-line px-4 py-16 text-center text-sm text-ink-muted">
          Ce sport n&apos;a pas encore de feuille de match, il n&apos;y a donc pas de statistiques
          individuelles à afficher.
        </p>
      ) : (
        <>
          {/* How much of the record this is derived from. A leaderboard here is ordinarily
              *incomplete* rather than wrong — the community manager types a sheet up only when
              somebody sends him a photo of one — and without this the reader has no way to tell
              which it is. Same statement the table makes about missing results. */}
          <CoverageNote
            withSheet={data.gamesWithSheet}
            completed={data.gamesCompleted}
            leagueId={data.leagueId}
            scope={scope}
          />

          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-16 text-center text-sm text-ink-muted">
              {data.belowMinimum > 0
                ? `Aucun joueur n’a joué ${minGames} matchs. Abaissez le minimum pour en voir davantage.`
                : 'Aucune feuille de match n’a encore été saisie. Les statistiques apparaîtront dès la première.'}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm sm:min-w-[40rem]">
                  <thead>
                    <tr className="border-b border-line bg-surface-sunk text-[0.6875rem] uppercase tracking-wide text-ink-subtle">
                      <th scope="col" className="w-9 px-2 py-2 text-center font-medium">#</th>
                      <th scope="col" className="min-w-[10rem] px-2 py-2 text-left font-medium">Joueur</th>
                      <th scope="col" className="hidden min-w-[6rem] px-2 py-2 text-left font-medium sm:table-cell">
                        Club
                      </th>
                      <SortHeader label="Matchs joués" abbr="MJ" k="gamesPlayed" sort={sort} asc={asc} onSort={toggle} />
                      {columns.map((c) => (
                        <SortHeader
                          key={c.code}
                          label={c.label}
                          abbr={c.abbr}
                          k={c.code}
                          sort={sort}
                          asc={asc}
                          onSort={toggle}
                          // Everything but the total hides on a phone: eight numeric columns at
                          // 390px push the one the reader came for behind a horizontal scroll.
                          hideOnPhone
                        />
                      ))}
                      <SortHeader label={data.totalLabel} abbr={data.totalAbbr} k="total" sort={sort} asc={asc} onSort={toggle} strong />
                      <SortHeader label={`${data.totalLabel} par match`} abbr="Moy." k="average" sort={sort} asc={asc} onSort={toggle} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {pageRows.map((row, i) => (
                      <tr
                        key={row.playerId}
                        onClick={() => setOpen(row)}
                        className="cursor-pointer transition-colors hover:bg-surface-sunk"
                      >
                        {/* The rank is the row's position in the whole ordering, not on this
                            page: « 21 » on page two, not « 1 » again. */}
                        <td className="px-2 py-2 text-center tabular-nums text-ink-subtle">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-2 py-2">
                          <span className="font-medium text-ink">
                            {row.firstName} {row.lastName}
                          </span>
                          {row.jerseyNumber !== null && (
                            <span className="ml-1.5 text-xs tabular-nums text-ink-subtle">
                              #{row.jerseyNumber}
                            </span>
                          )}
                          <span className="block text-xs text-ink-subtle sm:hidden">
                            {row.teamName ?? '—'}
                          </span>
                        </td>
                        <td className="hidden px-2 py-2 text-ink-muted sm:table-cell">
                          {row.teamName ?? '—'}
                          {/* One scorer, two shirts. A cell that silently picked one of them is a
                              cell somebody eventually argues with. */}
                          {row.multipleTeams && (
                            <Tooltip label="A joué pour plusieurs clubs cette saison">
                              <span className="ml-1 cursor-help text-xs text-ink-subtle">·2</span>
                            </Tooltip>
                          )}
                        </td>
                        <td className="px-1 py-2 text-center tabular-nums text-ink-muted">{row.gamesPlayed}</td>
                        {columns.map((c) => (
                          <td
                            key={c.code}
                            className={cn(
                              'hidden px-1 py-2 text-center tabular-nums sm:table-cell',
                              c.weight === 0 ? 'text-ink-subtle' : 'text-ink-muted',
                            )}
                          >
                            {row.stats[c.code] ?? 0}
                          </td>
                        ))}
                        <td className="px-1 py-2 text-center font-semibold tabular-nums text-ink">
                          {row.total}
                        </td>
                        <td className="px-1 py-2 text-center tabular-nums text-ink-muted">
                          {row.average.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}

          {data.belowMinimum > 0 && rows.length > 0 && (
            <p className="mt-2 text-xs text-ink-subtle">
              {data.belowMinimum} joueur{data.belowMinimum > 1 ? 's' : ''} masqué
              {data.belowMinimum > 1 ? 's' : ''} : moins de {minGames} match
              {minGames > 1 ? 's' : ''} joué{minGames > 1 ? 's' : ''}.
            </p>
          )}
        </>
      )}

      {open && (
        <PlayerQuickView
          playerId={open.playerId}
          seasonId={data?.seasonId}
          stageId={stageFilter}
          onOpenChange={(o) => !o && setOpen(null)}
        />
      )}
    </PageShell>
  );
}

/**
 * The gap between what was played and what was typed up.
 *
 * Not framed as a warning below about half coverage, and framed as one above it: at LIPROBAKIN the
 * sheet is the exception rather than the rule, and a permanent amber banner on the ordinary state
 * of the data is a banner nobody reads by the second week.
 */
function CoverageNote({
  withSheet,
  completed,
  leagueId,
  scope,
}: {
  withSheet: number;
  completed: number;
  leagueId: string;
  scope: 'tenant' | 'league' | 'team';
}) {
  if (completed === 0) return null;
  const missing = completed - withSheet;
  const calendarHref = scope === 'tenant' ? '/tenant/calendar' : `/league/calendar?ctxLeagueId=${leagueId}`;

  return (
    <p
      className={cn(
        'mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3.5 py-2.5 text-sm',
        withSheet === 0
          ? 'border-caution/40 bg-caution-soft text-ink'
          : 'border-line bg-surface-sunk text-ink-muted',
      )}
    >
      {withSheet === 0 ? (
        <AlertTriangle className="h-4 w-4 shrink-0 text-caution" aria-hidden />
      ) : (
        <FileText className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
      )}
      {withSheet} feuille{withSheet > 1 ? 's' : ''} de match sur {completed} match
      {completed > 1 ? 's' : ''} joué{completed > 1 ? 's' : ''}.
      {missing > 0 && scope !== 'team' && (
        <>
          <span>Les autres n&apos;ont qu&apos;un score final.</span>
          <Link
            href={calendarHref}
            className="font-medium text-accent-text underline underline-offset-2 transition-colors hover:text-ink"
          >
            Ouvrir le calendrier
          </Link>
        </>
      )}
    </p>
  );
}

function SortHeader({
  label,
  abbr,
  k,
  sort,
  asc,
  onSort,
  hideOnPhone,
  strong,
}: {
  label: string;
  abbr: string;
  k: string;
  sort: string;
  asc: boolean;
  onSort: (k: string) => void;
  hideOnPhone?: boolean;
  strong?: boolean;
}) {
  const active = sort === k;
  return (
    <th
      scope="col"
      className={cn(
        'w-12 px-1 py-2 text-center font-medium',
        strong && 'text-ink',
        active && 'text-ink',
        hideOnPhone && 'hidden sm:table-cell',
      )}
      aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
    >
      <Tooltip label={`${label} — trier`}>
        <button
          type="button"
          onClick={() => onSort(k)}
          className="inline-flex items-center gap-0.5 uppercase tracking-wide transition-colors hover:text-ink"
        >
          {abbr}
          {active &&
            (asc ? (
              <ArrowUp className="h-3 w-3" aria-hidden />
            ) : (
              <ArrowDown className="h-3 w-3" aria-hidden />
            ))}
        </button>
      </Tooltip>
    </th>
  );
}
