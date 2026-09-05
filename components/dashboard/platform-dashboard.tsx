'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Building2, CalendarCheck, Trophy, UserSquare2, Users } from 'lucide-react';
import { LoadingSpinner, PageHeader } from '@/components/ui';
import { usePlatformDashboard } from '@/services/dashboard';

/**
 * The founder's own screen.
 *
 * It reported "$89,230 monthly revenue", 324 active tenants, four named support tickets and five
 * services' uptime percentages — 659 lines of arrays written into the component. Elenem charges
 * nobody, has no ticketing system and no uptime monitor. A screen you open to find out whether
 * something is wrong, answering with invented figures, is worse than an empty one.
 *
 * Deliberately not redesigned, only made true: `/admin` is only ever seen by one person
 * (`ANALYSIS_2026-08` §8 Q3), so it gets the numbers that exist and nothing else until something
 * else is measured.
 */
export function PlatformDashboard() {
  const dashboard = usePlatformDashboard();

  if (dashboard.isLoading) return <LoadingSpinner />;
  if (dashboard.isError || !dashboard.data) {
    return <p className="mt-8 text-center text-sm text-negative">Chargement impossible.</p>;
  }

  const d = dashboard.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Plateforme"
        description="Ce qui existe, et ce qui s’est passé cette semaine."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Organisations" value={d.tenants} icon={Building2} href="/admin/tenants" />
        <Tile label="Compétitions" value={d.leagues} icon={Trophy} href="/admin/leagues" />
        <Tile label="Équipes" value={d.teams} icon={Building2} href="/admin/teams" />
        <Tile label="Joueurs" value={d.players} icon={UserSquare2} />
        <Tile label="Comptes" value={d.users} icon={Users} href="/admin/users" />
        <Tile label="Matchs" value={d.games} icon={CalendarCheck} href="/admin/games" />
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-3xl font-bold text-ink">{d.resultsThisWeek}</p>
          <p className="mt-1 text-sm text-ink-muted">
            résultats enregistrés cette semaine — le seul signe de vie réel que le produit mesure.
          </p>
        </div>
        {/* The one number here that should make somebody pick up a phone. */}
        <div
          className={`rounded-lg border p-4 ${
            d.tenantsWithoutFixtures > 0
              ? 'border-caution bg-caution-soft'
              : 'border-line bg-surface'
          }`}
        >
          <p className="text-3xl font-bold text-ink">{d.tenantsWithoutFixtures}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {d.tenantsWithoutFixtures === 1
              ? 'organisation inscrite sans aucun match. Elle s’est arrêtée quelque part.'
              : 'organisations inscrites sans aucun match. Elles se sont arrêtées quelque part.'}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Dernières organisations
        </h2>
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {d.recentTenants.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tenant/dashboard?ctxTenantId=${t.id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-sunk"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{t.name}</span>
                <span className="shrink-0 text-xs text-ink-muted">{t.tenantCode}</span>
                <span className="w-28 shrink-0 text-right text-xs text-ink-muted">
                  {t.leagues} {t.leagues === 1 ? 'compétition' : 'compétitions'}
                </span>
                <span className="w-24 shrink-0 text-right text-xs text-ink-muted">
                  {format(new Date(t.createdAt), 'd MMM yyyy', { locale: fr })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  href?: string;
}) {
  const body = (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-ink-muted">{label}</span>
        <Icon className="h-4 w-4 text-ink-muted" />
      </div>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-colors hover:brightness-95">
      {body}
    </Link>
  ) : (
    body
  );
}
