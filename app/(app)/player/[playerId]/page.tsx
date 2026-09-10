'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, Shirt } from 'lucide-react';
import { ErrorState, SelectField } from '@/components/ui';
import { useSurfaceLink } from '@/hooks/useSurfaceLink';
import { useBackLink } from '@/hooks/useBackLink';
import { usePlayerStats, canOpenGame } from '@/services/player-stats';
import { useCurrentUser } from '@/hooks';
import { cn } from '@/utils';

/**
 * One player, on their own page.
 *
 * The dialog on the roster holds the common case — the season line and the last five games — so
 * this exists for the two things it cannot: **the whole game log**, and **a shareable address**.
 * A link into a modal is not something you can send someone, and « combien il a marqué contre
 * Katindo » is a question about a specific row.
 *
 * Everything on it is derived from the scoresheets on request. There is no stored season total to
 * be out of step with the sheet somebody typed, which is the point of the whole module
 * (`docs/PLAYERS_AND_STATS.md` §0).
 */
export default function PlayerPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const router = useRouter();
  const surfaceLink = useSurfaceLink();
  const back = useBackLink();
  const user = useCurrentUser();

  const [seasonId, setSeasonId] = useState('');
  const [stageId, setStageId] = useState('');

  const stageFilter = stageId || undefined;

  const { data, isPending, isError, refetch } = usePlayerStats(
    playerId,
    seasonId || undefined,
    stageFilter,
  );

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ErrorState
          title="Joueur introuvable"
          error={
            new Error('Cette fiche n’existe pas, ou vous n’avez pas accès à cette compétition.')
          }
          reset={() => refetch()}
        />
      </div>
    );
  }


  const fullName = `${data.firstName} ${data.lastName}`;
  const scoring = data.columns.filter((c) => c.weight !== 0);
  const other = data.columns.filter((c) => c.weight === 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Back to where the reader came from, named — the statistics table if that is where they
          opened this scorer, the roster if it was the roster. It used to be « Retour aux joueurs »
          to a route chosen by role, which was right for nobody who had arrived from anywhere else. */}
      {back && (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1 text-sm text-ink-subtle transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {back.label}
        </Link>
      )}

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar url={data.profileImageUrl} name={fullName} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{fullName}</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {[
                data.teamName,
                data.position,
                data.jerseyNumber !== null ? `#${data.jerseyNumber}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Sans club'}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              {data.tenantName} · {data.leagueName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Only ever offered when there is more than one — the same rule the table's pickers
              follow. The server answers with the current season when nothing is named, so a club
              administrator who cannot list seasons still gets a page. */}
          {data.seasons.length > 1 && (
            <SelectField
              label="Saison"
              placeholder="Saison"
              value={seasonId || data.seasonId}
              onChange={(v) => {
                setSeasonId(v);
                setStageId('');
              }}
              className="w-44"
              options={data.seasons.map((s) => ({ value: s.id, label: s.name }))}
            />
          )}
          {data.stages.length > 1 && (
            <SelectField
              label="Phase"
              placeholder="Toute la saison"
              value={stageId}
              onChange={setStageId}
              className="w-48"
              options={data.stages.map((st) => ({ value: st.id, label: st.name }))}
            />
          )}
        </div>
      </header>

      {data.columns.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-16 text-center text-sm text-ink-muted">
          Ce sport n&apos;a pas encore de feuille de match, il n&apos;y a donc pas de statistiques
          individuelles à afficher.
        </p>
      ) : (
        <>
          <section className="mb-6" aria-label="Bilan de la saison">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              <Figure label="Matchs joués" abbr="MJ" value={data.gamesPlayed} />
              {scoring.map((c) => (
                <Figure key={c.code} label={c.label} abbr={c.abbr} value={data.stats[c.code] ?? 0} />
              ))}
              <Figure label={data.totalLabel} abbr={data.totalAbbr} value={data.total} strong />
              <Figure
                label={`${data.totalLabel} par match`}
                abbr="Moy."
                value={data.average.toFixed(1)}
              />
              {/* Recorded and worth nothing — fouls, cards. Kept visually quiet so the row does
                  not read as though a foul contributed to the total. */}
              {other.map((c) => (
                <Figure
                  key={c.code}
                  label={c.label}
                  abbr={c.abbr}
                  value={data.stats[c.code] ?? 0}
                  quiet
                />
              ))}
            </div>
          </section>

          <section aria-label="Matchs joués">
            <h2 className="mb-2 text-sm font-medium text-ink">
              Matchs {stageFilter ? 'de la phase' : 'de la saison'}
              <span className="ml-1.5 font-normal text-ink-subtle">({data.games.length})</span>
            </h2>

            {data.games.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-14 text-center text-sm text-ink-muted">
                Aucune feuille de match n&apos;a été saisie pour ce joueur.
                <span className="mt-1 block text-xs text-ink-subtle">
                  Un match sans feuille garde son score final : il n&apos;attribue simplement aucune
                  statistique individuelle.
                </span>
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface-sunk text-[0.6875rem] uppercase tracking-wide text-ink-subtle">
                        <th scope="col" className="px-3 py-2 text-left font-medium">Date</th>
                        <th scope="col" className="px-2 py-2 text-left font-medium">Adversaire</th>
                        <th scope="col" className="hidden px-2 py-2 text-center font-medium sm:table-cell">
                          Score
                        </th>
                        {data.columns.map((c) => (
                          <th
                            key={c.code}
                            scope="col"
                            className="hidden w-12 px-1 py-2 text-center font-medium sm:table-cell"
                            title={c.label}
                          >
                            {c.abbr}
                          </th>
                        ))}
                        <th scope="col" className="w-14 px-2 py-2 text-center font-medium text-ink">
                          {data.totalAbbr}
                        </th>
                        <th scope="col" className="w-8 px-1 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.games.map((g) => {
                        // The whole row opens the match — the chevron is the affordance, not the
                        // hit area. Nothing on this page is unsaved, so leaving costs nothing.
                        //
                        // Unless the reader may not open it: a club administrator reading another
                        // club's scorer sees that club's whole season, and `_validateUserScope`
                        // refuses every one of those fixtures. The row stays, without the door.
                        const openable = canOpenGame(g, user);
                        return (
                        <tr
                          key={g.gameId}
                          onClick={openable ? () => router.push(surfaceLink(`/game/${g.gameId}`)) : undefined}
                          title={openable ? undefined : 'Vous ne pouvez consulter que les matchs de votre club.'}
                          className={cn(
                            'transition-colors',
                            openable && 'cursor-pointer hover:bg-surface-sunk',
                          )}
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-ink-muted">
                            {new Date(g.dateTime).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            <span className="ml-1.5 hidden text-xs text-ink-subtle lg:inline">
                              {g.stageName}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-ink">
                            <span className="text-ink-subtle">{g.isHome ? 'vs' : 'à'}</span>{' '}
                            {g.opponentName}
                            {/* Which shirt they wore. Silent when it is the club they play for
                                today, which is every row until somebody transfers. */}
                            {g.teamId !== data.teamId && (
                              <span className="ml-1.5 text-xs text-ink-subtle">({g.teamName})</span>
                            )}
                          </td>
                          <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                            {g.teamScore === null ? (
                              <span className="text-ink-subtle">—</span>
                            ) : (
                              <span
                                className={cn(
                                  g.outcome === 'WIN'
                                    ? 'text-positive'
                                    : g.outcome === 'LOSS'
                                      ? 'text-negative'
                                      : 'text-ink-muted',
                                )}
                              >
                                {g.teamScore}–{g.opponentScore}
                              </span>
                            )}
                          </td>
                          {data.columns.map((c) => (
                            <td
                              key={c.code}
                              className={cn(
                                'hidden px-1 py-2 text-center tabular-nums sm:table-cell',
                                c.weight === 0 ? 'text-ink-subtle' : 'text-ink-muted',
                              )}
                            >
                              {g.stats[c.code] ?? 0}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center font-semibold tabular-nums text-ink">
                            {g.total}
                          </td>
                          <td className="px-1 py-2 text-right">
                            {openable && (
                              <ChevronRight
                                className="ml-auto h-4 w-4 text-ink-subtle"
                                aria-hidden
                              />
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Figure({
  label,
  abbr,
  value,
  strong,
  quiet,
}: {
  label: string;
  abbr: string;
  value: number | string;
  strong?: boolean;
  quiet?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line px-2.5 py-2.5 text-center',
        strong ? 'bg-surface-sunk' : 'bg-surface',
      )}
      title={label}
    >
      <p
        className={cn(
          'tabular-nums',
          strong ? 'text-xl font-semibold text-ink' : 'text-lg font-medium',
          quiet ? 'text-ink-subtle' : 'text-ink',
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.6875rem] uppercase tracking-wide text-ink-subtle">
        {abbr}
      </p>
    </div>
  );
}

/** Initials until item 17 wires S3. A broken image icon is worse than a tinted square. */
function Avatar({ url, name }: { url: string | null; name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-sunk text-xl font-semibold text-ink-subtle"
      aria-hidden
    >
      {initials || <Shirt className="h-6 w-6" />}
    </div>
  );
}
