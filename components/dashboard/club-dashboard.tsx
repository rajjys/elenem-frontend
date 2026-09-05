'use client';

import React from 'react';
import Link from 'next/link';
import { ListOrdered, Users } from 'lucide-react';
import { Avatar, Button, LoadingSpinner, SeasonStatusBadge } from '@/components/ui';
import { useContextualLink, useScopeContext } from '@/hooks';
import { useClubDashboard } from '@/services/dashboard';
import { FixtureRow } from './organiser-dashboard';

/**
 * What a club opens the product to find out.
 *
 * The screen this replaces fetched nothing. It rendered a hardcoded English club called *Lightning
 * Strikers*, "Premier League Division A · Founded 2018", four invented footballers with goals and
 * assists, three results against Thunder Bolts and Fire Dragons, and three announcements. Logged in
 * as a real club administrator the breadcrumb read `VIR › Tableau de bord` above none of it — and
 * until this sprint's first fix that reader had no sidebar either, so it was the whole product they
 * could see.
 *
 * Three questions and no more: where do we stand, when do we play next, how did the last ones go. A
 * club administers nothing here that it can change except its roster, so this screen carries almost
 * no verbs — which is the honest shape and the reason it is a separate component rather than the
 * organiser's with a narrower scope.
 */
export function ClubDashboard() {
  const ctx = useScopeContext();
  const { buildLink } = useContextualLink();
  const dashboard = useClubDashboard(ctx.teamId ?? undefined);

  if (dashboard.isLoading) return <LoadingSpinner />;
  if (dashboard.isError || !dashboard.data) {
    return (
      <p className="mt-8 text-center text-sm text-negative">
        Le tableau de bord n’a pas pu être chargé.
      </p>
    );
  }

  const d = dashboard.data;
  const s = d.standing;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface px-4 py-3 shadow-e1">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={d.logoUrl ?? undefined} name={d.teamName} size={44} className="rounded-full" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-ink md:text-xl">
              {d.teamName}
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span className="truncate">{d.leagueName}</span>
              {d.season && <SeasonStatusBadge status={d.season.status} />}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildLink('/team/roster')}>
            <Users className="mr-2 h-4 w-4" />
            {d.playerCount} {d.playerCount === 1 ? 'joueur' : 'joueurs'}
          </Link>
        </Button>
      </header>

      {/* Where the club stands, which is the single fact it opens the product for. */}
      {s ? (
        <section className="rounded-lg border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold leading-none text-ink">{s.rank}</span>
              <span className="text-sm text-ink-muted">
                sur {s.totalTeams} · {s.points} {s.pointsLabel}
              </span>
            </div>
            <dl className="flex gap-5 text-sm">
              <Stat label="Joués" value={s.gamesPlayed} />
              <Stat label="Gagnés" value={s.wins} tone="positive" />
              <Stat label="Perdus" value={s.losses} tone="negative" />
            </dl>
            <Button variant="outline" size="sm" asChild>
              <Link href={buildLink('/team/standings')}>
                <ListOrdered className="mr-2 h-4 w-4" />
                Classement
              </Link>
            </Button>
          </div>

          {d.form.length > 0 && (
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
              <span className="text-xs uppercase tracking-wide text-ink-muted">Forme</span>
              {/* Most recent last, read left to right like the rest of the page. */}
              {[...d.form].reverse().map((r, i) => (
                <span
                  key={i}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    r === 'V'
                      ? 'bg-positive-soft text-positive'
                      : r === 'D'
                        ? 'bg-negative-soft text-negative'
                        : 'bg-surface-sunk text-ink-muted'
                  }`}
                  title={r === 'V' ? 'Victoire' : r === 'D' ? 'Défaite' : 'Match nul'}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-line bg-surface p-6 text-center">
          <p className="text-sm font-medium text-ink">Pas encore de classement.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
            Le classement se construit à partir des matchs joués. Il apparaîtra dès que votre club
            aura une rencontre au résultat enregistré.
          </p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <FixtureList
          title="Prochaines rencontres"
          empty="Aucune rencontre programmée."
          fixtures={d.upcoming}
          href={buildLink('/team/standings')}
        />
        <FixtureList
          title="Derniers résultats"
          empty="Aucun match joué pour l’instant."
          fixtures={d.recent}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd
        className={`text-lg font-semibold ${
          tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function FixtureList({
  title,
  empty,
  fixtures,
  href,
}: {
  title: string;
  empty: string;
  fixtures: React.ComponentProps<typeof FixtureRow>['fixture'][];
  href?: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      {fixtures.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-ink-muted">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {fixtures.map((f) => (
            <FixtureRow key={f.id} fixture={f} showCompetition={false} />
          ))}
        </ul>
      )}
      {href && fixtures.length > 0 && (
        <Link href={href} className="mt-2 inline-block text-sm text-ink-muted nav-hover">
          Voir le classement →
        </Link>
      )}
    </section>
  );
}
