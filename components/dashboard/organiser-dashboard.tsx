'use client';

import React from 'react';
import Link from 'next/link';
import { format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  ListOrdered,
  Trophy,
  Users,
} from 'lucide-react';
import { Avatar, Button, LoadingSpinner, SeasonStatusBadge } from '@/components/ui';
import { SeasonStatus } from '@/schemas';
import { useContextualLink, useScopeContext } from '@/hooks';
import { useSurfaceLink } from '@/hooks/useSurfaceLink';
import {
  useOrganiserDashboard,
  type DashboardCompetition,
  type DashboardFixture,
} from '@/services/dashboard';

/**
 * What an organiser owes their competitions right now.
 *
 * One component for the organisation and for a single competition, because they are the same
 * question at two widths — the tenant scope fans out over competitions and the league scope is the
 * same panels with the fan-out removed. That is what `CalendarView` and `StandingsView` both
 * turned out to be, and it is why the two screens this replaces had drifted so far apart while
 * showing the same three counters.
 *
 * The thing it exists to say is at the top and it is a number:
 *
 *   **how many results are still to be typed in.**
 *
 * A2 and A3 say one community manager enters a whole weekend in a sitting, from photographs of
 * scoresheets and messages. The number was computable from data the product has had since the
 * standings engine was written, and no dashboard showed it. What they showed instead was
 * *Ligues · Équipes · Athlètes*, three counts that do not change from one Saturday to the next,
 * beside a ticket-sales card whose value was the literal `0` and whose trend was the literal `3.6`.
 *
 * See docs/SEASON_AND_DASHBOARDS.md §5.
 */
export function OrganiserDashboard({ scope }: { scope: 'tenant' | 'league' }) {
  const ctx = useScopeContext();
  const { buildLink } = useContextualLink();

  const dashboard = useOrganiserDashboard({
    ...(scope === 'tenant' && ctx.tenantId ? { tenantId: ctx.tenantId } : {}),
    ...(scope === 'league' && ctx.leagueId ? { leagueId: ctx.leagueId } : {}),
  });

  if (dashboard.isLoading) return <LoadingSpinner />;
  if (dashboard.isError || !dashboard.data) {
    return (
      <p className="mt-8 text-center text-sm text-negative">
        Le tableau de bord n’a pas pu être chargé.
      </p>
    );
  }

  const data = dashboard.data;
  const only = data.competitions.length === 1 ? data.competitions[0] : null;
  const totalMissing = data.competitions.reduce((n, c) => n + c.missingResults, 0);

  const calendarHref =
    scope === 'tenant'
      ? buildLink('/tenant/calendar')
      : buildLink('/league/calendar', only ? { ctxLeagueId: only.id } : undefined);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface px-4 py-3 shadow-e1">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={only?.name ?? data.organisationName} size={40} className="rounded-full" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-ink md:text-xl">
              {only ? only.name : data.organisationName}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span>{only ? data.organisationName : data.organisationCode}</span>
              {only?.season && <SeasonStatusBadge status={only.season.status} />}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Button variant="outline" size="sm" asChild>
            <Link href={calendarHref}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Nouveau match
            </Link>
          </Button>
          {scope === 'tenant' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={'/onboarding'}>
                <Trophy className="mr-2 h-4 w-4" />
                Nouvelle compétition
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* The headline, and only when there is one. A dashboard that always shows a warning box has
          taught its reader to stop seeing it — the same lesson the verification banner learned
          (CALENDAR_MODULE §10). */}
      {totalMissing > 0 && (
        <MissingResultsPanel
          total={totalMissing}
          fixtures={data.awaitingResults}
          calendarHref={calendarHref}
          showCompetition={data.competitions.length > 1}
        />
      )}

      <section className="space-y-3">
        {data.competitions.length > 1 && (
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Compétitions
          </h2>
        )}
        {data.competitions.length === 0 && (
          <EmptyOrganisation createHref={'/onboarding'} />
        )}
        {data.competitions.map((c) => (
          <CompetitionCard
            key={c.id}
            competition={c}
            buildLink={buildLink}
            // On a single competition the header above has already said its name and its state,
            // and the missing-results panel has already said the number. A card that repeats all
            // three immediately underneath is the league dashboard's old habit of showing the same
            // fact twice, in a new place.
            standalone={!!only}
          />
        ))}
      </section>

      {data.upcoming.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Prochaines rencontres
            </h2>
            <Link href={calendarHref} className="text-sm font-medium text-ink-muted nav-hover">
              Calendrier complet
            </Link>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {data.upcoming.map((f) => (
              <FixtureRow
                key={f.id}
                fixture={f}
                showCompetition={data.competitions.length > 1}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- */

function MissingResultsPanel({
  total,
  fixtures,
  calendarHref,
  showCompetition,
}: {
  total: number;
  fixtures: DashboardFixture[];
  calendarHref: string;
  showCompetition: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-caution bg-caution-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 max-w-2xl items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-caution" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">
              {total} {total === 1 ? 'résultat manquant' : 'résultats manquants'}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Ces rencontres ont eu lieu et leur score n’a pas été saisi. Le classement reste
              incomplet tant qu’elles manquent — ce n’est pas qu’il est faux.
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" asChild>
          <Link href={calendarHref}>Saisir les scores</Link>
        </Button>
      </div>
      <ul className="divide-y divide-caution/30 border-t border-caution/40 bg-surface">
        {fixtures.map((f) => (
          <FixtureRow key={f.id} fixture={f} showCompetition={showCompetition} overdue />
        ))}
      </ul>
      {/* Say that the list is a sample, or the reader takes the eight rows for the whole backlog
          and stops when they run out. Oldest first, because the fixture that has been waiting
          longest is the one a club is asking about. */}
      {total > fixtures.length && (
        <p className="border-t border-caution/40 bg-surface px-4 py-2 text-xs text-ink-muted">
          Les {fixtures.length} plus anciennes sur {total}. Le calendrier les porte toutes.
        </p>
      )}
    </section>
  );
}

function CompetitionCard({
  competition: c,
  buildLink,
  standalone = false,
}: {
  competition: DashboardCompetition;
  buildLink: (path: string, params?: Record<string, string>) => string;
  standalone?: boolean;
}) {
  const link = (path: string) => buildLink(path, { ctxLeagueId: c.id });

  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {!standalone && <h3 className="font-semibold text-ink">{c.name}</h3>}
          <p className={`text-sm text-ink-muted ${standalone ? '' : 'mt-0.5'}`}>
            {c.teamCount} {c.teamCount === 1 ? 'équipe' : 'équipes'} · {c.playerCount} athlètes
          </p>
        </div>
        {!standalone &&
          (c.season ? (
            <SeasonStatusBadge status={c.season.status} />
          ) : (
            <span className="text-xs text-ink-muted">Aucune saison</span>
          ))}
      </div>

      <div className="mt-3">
        {/* The state the product could not previously be in, and the one that most needs saying:
            the phase is over, the next has no fixtures, and nothing else would have told them.
            Above the phase content because it supersedes it — there is nothing left to report
            about a phase that has finished. */}
        {c.awaitingNextStage && c.stage && (
          <div className="mb-3 rounded-md border border-accent bg-accent-soft px-3 py-2.5">
            <p className="text-sm font-medium text-ink">
              « {c.stage.name} » est terminée. Toutes les rencontres ont un résultat.
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              La phase suivante n’a encore aucune rencontre. C’est le moment de la composer.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" asChild>
                <Link href={link('/league/calendar')}>Programmer la suite</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={link('/league/seasons')}>Revoir le format</Link>
              </Button>
            </div>
          </div>
        )}
        {!c.season && <NoSeason href={link('/league/seasons')} />}
        {c.season?.status === SeasonStatus.PLANNING && <PreSeason competition={c} link={link} />}
        {c.season?.status === SeasonStatus.ACTIVE && (
          <InSeason competition={c} link={link} standalone={standalone} />
        )}
        {c.season?.status === SeasonStatus.COMPLETED && <PostSeason competition={c} link={link} />}
        {c.season?.status === SeasonStatus.CANCELED && (
          <p className="text-sm text-ink-muted">
            Cette saison a été annulée. Son classement ne fait pas foi.
          </p>
        )}
      </div>
    </article>
  );
}

/** Pre-season: what is missing, each line linking to the thing that fixes it. */
function PreSeason({
  competition: c,
  link,
}: {
  competition: DashboardCompetition;
  link: (p: string) => string;
}) {
  // A season opens itself on its first result, so a competition sitting in preparation with
  // fixtures already behind it is one typed score away from being under way. That is worth saying
  // outright rather than leaving the organiser to discover it.
  const blockers: { label: string; href: string }[] = [];
  if (c.teamCount < 2) blockers.push({ label: 'Aucune équipe inscrite', href: link('/league/teams') });
  if (c.teamsWithoutPlayers > 0)
    blockers.push({
      label: `${c.teamsWithoutPlayers} ${c.teamsWithoutPlayers === 1 ? 'équipe sans joueurs' : 'équipes sans joueurs'}`,
      // The players screen, not the clubs one. « Trois équipes sans joueurs » is a complaint about
      // the *roster*, and the clubs list has no way to act on it — the reader arrived wanting to
      // add names and was handed a list of clubs to click through first.
      href: link('/league/players'),
    });
  if (c.fixtureCount === 0)
    blockers.push({ label: 'Aucune rencontre au calendrier', href: link('/league/calendar') });

  return (
    <div className="space-y-3">
      {c.missingResults > 0 ? (
        <p className="text-sm text-ink">
          {c.missingResults}{' '}
          {c.missingResults === 1
            ? 'rencontre est passée sans résultat'
            : 'rencontres sont passées sans résultat'}
          . La saison s’ouvrira d’elle-même au premier score saisi.
        </p>
      ) : (
        <p className="text-sm text-ink-muted">
          {c.fixtureCount > 0
            ? `${c.fixtureCount} rencontres au calendrier. La saison s’ouvrira au premier résultat.`
            : 'La saison se prépare.'}
        </p>
      )}

      {blockers.length > 0 && (
        <ul className="space-y-1 text-sm">
          {blockers.map((b) => (
            <li key={b.label}>
              <Link href={b.href} className="text-caution nav-hover">
                {b.label} →
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CardActions link={link} />
    </div>
  );
}

/** In season: progress, and what is owed. */
function InSeason({
  competition: c,
  link,
  standalone = false,
}: {
  competition: DashboardCompetition;
  link: (p: string) => string;
  standalone?: boolean;
}) {
  const pct = c.fixtureCount ? Math.round((c.playedCount / c.fixtureCount) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Per pool in a GROUPS phase: one bar across four pools says nothing about whether any of
          them can be settled. */}
      {c.pools.length > 1 ? (
        <div className="space-y-2">
          {c.pools.map((p) => {
            const pp = p.fixtureCount ? Math.round((p.playedCount / p.fixtureCount) * 100) : 0;
            return (
              <div key={p.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted">
                    {p.playedCount} / {p.fixtureCount}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-sunk">
                  <div className="h-full rounded-full bg-positive" style={{ width: `${pp}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-ink">
            {c.playedCount} / {c.fixtureCount} rencontres jouées
          </span>
          <span className="text-ink-muted">{pct}%</span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunk"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-positive" style={{ width: `${pct}%` }} />
        </div>
      </div>
      )}

      {/* In a knockout a missing result is not an incomplete table — it stops the next round
          being drawn at all, which is a materially stronger thing to say. */}
      {c.missingResults > 0 && c.stage?.format === 'KNOCKOUT' ? (
        <p className="text-sm text-caution">
          Le tour suivant ne peut pas être composé — {c.missingResults}{' '}
          {c.missingResults === 1 ? 'rencontre sans résultat' : 'rencontres sans résultat'}.
        </p>
      ) : (
        c.missingResults > 0 &&
        !standalone && (
          <p className="text-sm text-caution">
            {c.missingResults}{' '}
            {c.missingResults === 1 ? 'résultat manquant' : 'résultats manquants'}
          </p>
        )
      )}

      {c.plannedCount > 0 && (
        <p className="text-sm text-ink-muted">
          {c.plannedCount}{' '}
          {c.plannedCount === 1 ? 'rencontre à définir' : 'rencontres à définir'} — salle réservée,
          équipes à désigner.
        </p>
      )}

      <CardActions link={link} publishable={c.playedCount > 0} />
    </div>
  );
}

/** Post-season: the outcome, and the one move forward. */
function PostSeason({
  competition: c,
  link,
}: {
  competition: DashboardCompetition;
  link: (p: string) => string;
}) {
  return (
    <div className="space-y-3">
      {c.champion ? (
        <p className="flex items-center gap-2 text-sm text-ink">
          <Trophy className="h-4 w-4 text-caution" />
          <span>
            <span className="font-semibold">{c.champion.name}</span> termine en tête de{' '}
            {c.season?.name}.
          </span>
        </p>
      ) : (
        <p className="text-sm text-ink-muted">Saison terminée.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={link('/league/standings')}>
            <ListOrdered className="mr-2 h-4 w-4" />
            Classement final
          </Link>
        </Button>
        <Button variant="primary" size="sm" asChild>
          <Link href={link('/league/seasons')}>Ouvrir la saison suivante</Link>
        </Button>
      </div>
    </div>
  );
}

function NoSeason({ href }: { href: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-muted">
        Sans saison, cette compétition ne peut recevoir aucun match : c’est la saison qui porte le
        calendrier et le classement.
      </p>
      <Button variant="primary" size="sm" asChild>
        <Link href={href}>Créer une saison</Link>
      </Button>
    </div>
  );
}

function CardActions({
  link,
  publishable = false,
}: {
  link: (p: string) => string;
  publishable?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={link('/league/calendar')}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendrier
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={link('/league/standings')}>
          <ListOrdered className="mr-2 h-4 w-4" />
          Classement
        </Link>
      </Button>
      {publishable && (
        <Button variant="outline" size="sm" asChild>
          <Link href={link('/league/standings/export')}>Publier le classement</Link>
        </Button>
      )}
      <Button variant="ghost" size="sm" asChild>
        <Link href={link('/league/teams')}>
          <Users className="mr-2 h-4 w-4" />
          Équipes
        </Link>
      </Button>
    </div>
  );
}

function EmptyOrganisation({ createHref }: { createHref: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center">
      <p className="text-sm font-medium text-ink">Aucune compétition pour l’instant.</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        Une compétition porte les équipes, le calendrier et le classement. C’est la première chose à
        créer.
      </p>
      <Button variant="primary" className="mt-4" asChild>
        <Link href={createHref}>Créer une compétition</Link>
      </Button>
    </div>
  );
}

export function FixtureRow({
  fixture: f,
  showCompetition,
  overdue = false,
}: {
  fixture: DashboardFixture;
  showCompetition: boolean;
  overdue?: boolean;
}) {
  const surfaceLink = useSurfaceLink();
  const played = f.homeScore !== null && f.awayScore !== null;
  return (
    <li>
      <Link
        href={surfaceLink(`/game/${f.id}`)}
        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-sunk"
      >
        <span
          className={`w-28 shrink-0 text-xs ${overdue ? 'font-medium text-caution' : 'text-ink-muted'}`}
        >
          {formatWhen(f.dateTime)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {f.homeShortCode ?? f.homeTeam}
          <span className="mx-2 text-ink-muted">–</span>
          {f.awayShortCode ?? f.awayTeam}
        </span>
        {played && (
          <span className="shrink-0 text-sm font-semibold text-ink">
            {f.homeScore} – {f.awayScore}
          </span>
        )}
        {showCompetition && (
          <span className="hidden shrink-0 truncate text-xs text-ink-muted sm:block sm:max-w-[14rem]">
            {f.leagueName}
          </span>
        )}
      </Link>
    </li>
  );
}

/** "Aujourd'hui 14:30", "Demain 16:10", else "sam. 20 sept. 14:30". */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Aujourd’hui ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Demain ${format(d, 'HH:mm')}`;
  return format(d, 'EEE d MMM HH:mm', { locale: fr });
}
