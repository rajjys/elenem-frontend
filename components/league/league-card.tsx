'use client';

import Link from 'next/link';
import { CalendarDays, MoreVertical, Settings, Trash, UserSquare2, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SeasonStatusBadge } from '@/components/ui';
import type { LeagueDetails } from '@/schemas';
import { cn } from '@/utils';

/**
 * One competition, as a door.
 *
 * The card this replaces was written before the design system and showed it: `p-2` on a bare
 * border with `hover:bg-line/30`, two nested `<Link>`s wrapping the row *and* the footer with the
 * action menu between them — so opening the menu navigated — and two facts of which one was always
 * wrong. « 0 Managers » was on every card in the product, because `managingUsers` is not on the
 * list payload and never has been. Its menu also offered « Ajouter Manager », pointing at
 * `/league/managers`, a route that does not exist.
 *
 * What is on it now is what the endpoint actually sends and a reader actually wants: how many clubs
 * and how many players are registered, which season is running, and what state that season is in.
 * One link over the identity, one menu beside it, nothing nested.
 *
 * Cards rather than rows, still, for the reason `LeaguesListView` gives: a competition is entered,
 * not compared against its neighbours.
 */
export function LeagueCard({
  league,
  href,
  onDelete,
  canManage,
}: {
  league: LeagueDetails;
  href: string;
  onDelete?: () => void;
  canManage?: boolean;
}) {
  const teams = league.teams?.length ?? 0;
  const players = league.players?.length ?? 0;
  const season = league.currentSeason;

  const category =
    league.gender === 'FEMALE' ? 'Dames' : league.gender === 'MIXED' ? 'Mixte' : 'Messieurs';

  return (
    <div className="group relative rounded-xl border border-line bg-surface transition-colors hover:border-line-strong">
      {/* One link, over the whole card, with the menu lifted above it. Nesting a second link inside
          the first is what made the action menu navigate instead of opening. */}
      <Link href={href} className="block rounded-xl px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate pr-8 font-semibold text-ink">{league.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
              {league.division && (
                <span className="rounded bg-surface-sunk px-1.5 py-0.5 font-medium text-ink-subtle">
                  {league.division}
                </span>
              )}
              <span>{category}</span>
              {league.isActive === false && (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-ink-subtle">Archivée</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
            {teams} club{teams > 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserSquare2 className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
            {players} joueur{players > 1 ? 's' : ''}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5',
              !season && 'text-caution',
            )}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
            {season?.name ?? 'Aucune saison'}
          </span>
          {season?.status && <SeasonStatusBadge status={season.status} />}
        </div>
      </Link>

      {canManage && (
        <div className="absolute right-3 top-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions pour ${league.name}`}
                className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink"
              >
                <MoreVertical className="h-4 w-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/league/settings?ctxLeagueId=${league.id}`}
                  className="flex w-full items-center"
                >
                  <Settings className="mr-2 h-4 w-4" aria-hidden />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onSelect={onDelete}
                  className="text-negative focus:bg-negative-soft focus:text-negative"
                >
                  <Trash className="mr-2 h-4 w-4" aria-hidden />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
