'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  History,
  Loader2,
  MapPin,
  Pencil,
  Shield,
  Trophy,
} from 'lucide-react';
import { Button, ErrorState } from '@/components/ui';
import { useCurrentUser } from '@/hooks';
import { Roles } from '@/schemas';
import { BoxScoreSheet } from '@/components/game/box-score-sheet';
import { FixtureDialog, ScoreDialog } from '@/components/calendar';
import { useCalendar, type CalendarEntry } from '@/services/calendar';
import { useGame, useGameAudit } from '@/services/games';
import { cn } from '@/utils';

/**
 * One match, on its own page.
 *
 * **Why a page at all**, when the calendar's day panel already scores, moves and deletes a
 * fixture without leaving the grid. Three reasons, and only three:
 *
 *  1. It is the **shareable address** of a match. A link into a 22rem drawer is not a thing you
 *     can send someone.
 *  2. It has **room the drawer does not**. The scoresheet is a table of five columns across two
 *     rosters; in the drawer it has to overlay the calendar as a dialog, here it simply sits on
 *     the page.
 *  3. It can show **what happened to this fixture** — the audit trail, which is the answer to
 *     "why is this on Sunday now" and has never had a surface outside a collapsible inside a
 *     dialog.
 *
 * Everything else it does, it does by reusing the calendar's own dialogs, because a fixture must
 * not be movable in two subtly different ways depending on which screen you found it from.
 *
 * It replaces `/game/[gameId]/dashboard` (a live-score console with increment buttons, built for
 * a scorer at courtside that this market does not have — see ROADMAP_V2 §1.2), `/game/manage`
 * (which rendered the words "Game Management page") and `/game/create` (a 690-line wizard the
 * calendar's fixture dialog replaced).
 */

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programmé',
  CONFIRMED: 'Confirmé',
  LIVE: 'En direct',
  COMPLETED: 'Terminé',
  POSTPONED: 'Reporté',
  CANCELLED: 'Annulé',
  DRAFT: 'Brouillon',
};

function statusTone(status: string): string {
  if (status === 'LIVE') return 'bg-negative-soft text-negative ring-negative/30';
  if (status === 'COMPLETED') return 'bg-positive-soft text-positive ring-positive/30';
  if (status === 'POSTPONED' || status === 'CANCELLED') {
    return 'bg-caution-soft text-caution ring-caution/30';
  }
  return 'bg-surface-sunk text-ink-muted ring-line';
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function longDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function timeOf(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function GamePage() {
  const params = useParams();
  const gameId = (params?.gameId as string) ?? '';

  const [scoring, setScoring] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const user = useCurrentUser();
  const game = useGame(gameId);
  const day = game.data ? isoDay(new Date(game.data.dateTime)) : null;

  // The rest of that day, which is what the editor needs to answer "is this hour free" and to
  // list what the two clubs are already committed to. One request, and it is the same one the
  // calendar makes — so the two screens reason from identical information.
  const dayCalendar = useCalendar({ from: day ?? '1970-01-01', to: day ?? '1970-01-01' });

  const audit = useGameAudit(gameId, showHistory);

  const entriesThatDay = dayCalendar.data?.entries ?? [];
  const entry: CalendarEntry | null = useMemo(() => {
    const found = entriesThatDay.find((e) => e.id === gameId);
    if (found) return found;
    // The calendar can legitimately not hold it — a competition filtered out of the caller's
    // scope, a fixture just created elsewhere — and the dialogs only need the fixture's own
    // fields, so build one rather than refusing to open them.
    const g = game.data;
    if (!g) return null;
    return {
      id: g.id,
      dateTime: g.dateTime,
      durationMinutes: 100,
      status: g.status,
      leagueId: g.leagueId,
      venueId: g.homeVenueId ?? null,
      courtId: null,
      home: { id: g.homeTeam.id, name: g.homeTeam.name, shortCode: g.homeTeam.shortCode ?? '' },
      away: { id: g.awayTeam.id, name: g.awayTeam.name, shortCode: g.awayTeam.shortCode ?? '' },
      homeScore: g.homeScore ?? null,
      awayScore: g.awayScore ?? null,
    };
  }, [entriesThatDay, gameId, game.data]);

  if (game.isPending) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-ink-subtle" aria-hidden />
      </div>
    );
  }

  if (game.isError || !game.data) {
    return (
      <ErrorState
        title="Match introuvable"
        error={game.error as Error}
        reset={() => game.refetch()}
      />
    );
  }

  const g = game.data;
  const at = new Date(g.dateTime);
  const played = g.status === 'COMPLETED';
  const hasScore = g.homeScore != null && g.awayScore != null;
  const duration = entry?.durationMinutes ?? 100;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* The scoreboard. Two clubs either side of the number that settled it — the shape a result
          is read in, and the same one the calendar's drawer uses so the eye does not have to
          relearn it on arrival. */}
      <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
              statusTone(g.status),
            )}
          >
            {STATUS_LABELS[g.status] ?? g.status}
          </span>
          <span className="flex items-center gap-1.5 text-ink-muted">
            <Trophy className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
            {g.league.name}
            {g.season ? <span className="text-ink-subtle">· {g.season.name}</span> : null}
          </span>
          <span className="flex items-center gap-1.5 text-ink-muted">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
            <span className="first-letter:uppercase">{longDate(at)}</span>
            <span className="tabular-nums">{timeOf(at)}</span>
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3 sm:gap-6">
          <TeamSide team={g.homeTeam} role="domicile" align="end" />
          <div className="shrink-0 text-center">
            {hasScore ? (
              <p className="text-3xl font-bold tabular-nums text-ink sm:text-5xl">
                {g.homeScore} <span className="text-ink-subtle">–</span> {g.awayScore}
              </p>
            ) : (
              <p className="text-2xl font-semibold tabular-nums text-ink-subtle sm:text-3xl">
                {timeOf(at)}
              </p>
            )}
            {g.isForfeit && (
              <p className="mt-1 text-xs font-medium text-caution">Forfait</p>
            )}
          </div>
          <TeamSide team={g.awayTeam} role="visiteur" align="start" />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {/* The sheet, inline. This is the page's reason to exist: five columns across two
              rosters do not belong in a 22rem drawer, and on the calendar it has to overlay the
              grid as a dialog. Here it is simply the content. */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
              <ClipboardList className="h-4 w-4" aria-hidden />
              Feuille de match
            </h2>
            {played ? (
              <BoxScoreSheet gameId={gameId} />
            ) : (
              <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
                La feuille se saisit après le match, à partir de la feuille des officiels.
                {!hasScore && ' Enregistrez d’abord le score final.'}
              </p>
            )}
          </section>

          {/* What happened to this fixture, and why. It existed only as a collapsible inside the
              editor dialog, which is the last place someone asking "why did this move?" would
              look. */}
          <section>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              className="flex items-center gap-2 rounded-md text-sm font-semibold uppercase tracking-wide text-ink-subtle transition-colors hover:text-ink"
            >
              <History className="h-4 w-4" aria-hidden />
              Historique
              <span className="text-xs font-normal normal-case tracking-normal text-ink-subtle">
                {showHistory ? 'masquer' : 'afficher'}
              </span>
            </button>
            {showHistory && (
              <div className="mt-3 rounded-lg border border-line">
                {audit.isPending ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-ink-subtle" aria-hidden />
                  </div>
                ) : !audit.data?.length ? (
                  <p className="px-4 py-6 text-center text-sm text-ink-muted">
                    Rien n&apos;a changé depuis la création de ce match.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {audit.data.map((a) => (
                      <li key={a.id} className="px-3.5 py-2.5 text-sm">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium text-ink">{auditLabel(a.action)}</span>
                          <span className="text-xs tabular-nums text-ink-subtle">
                            {new Date(a.at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {a.by && <span className="text-xs text-ink-subtle">· {a.by}</span>}
                        </div>
                        {a.reason && <p className="mt-0.5 text-ink-muted">{a.reason}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>

        {/* The rail: the facts, then the things you can do about them. Same actions as the
            calendar's day panel, same dialogs — a fixture must not be movable in two subtly
            different ways depending on the screen you found it from. */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <dl className="divide-y divide-line rounded-lg border border-line">
            <Row label="Heure">
              <span className="tabular-nums text-ink">
                {timeOf(at)}
                <span className="text-ink-subtle"> · {duration} min</span>
              </span>
            </Row>
            <Row label="Salle">
              {g.homeVenue ? (
                <span className="flex items-center gap-1.5 text-ink">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                  {g.homeVenue.name}
                </span>
              ) : g.location ? (
                <span className="text-ink">{g.location}</span>
              ) : (
                <span className="text-ink-subtle">Pas encore attribuée</span>
              )}
            </Row>
            <Row label="Compétition">
              <span className="text-ink">{g.league.name}</span>
            </Row>
            {g.season && (
              <Row label="Saison">
                <span className="text-ink">{g.season.name}</span>
              </Row>
            )}
          </dl>

          {entry && (
            <div className="space-y-2">
              <Button variant="primary" className="w-full" onClick={() => setScoring(true)}>
                {hasScore ? 'Corriger le score' : 'Saisir le score'}
              </Button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Déplacer, reporter, supprimer…
              </button>
            </div>
          )}

          <div className="rounded-lg border border-line">
            <p className="border-b border-line px-3 py-2 text-xs uppercase tracking-wider text-ink-subtle">
              Équipes
            </p>
            {[g.homeTeam, g.awayTeam].map((t) => (
              <Link
                key={t.id}
                href={`/team/dashboard?ctxTeamId=${t.id}&ctxLeagueId=${g.leagueId}`}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink transition-colors hover:bg-surface-sunk"
              >
                <Shield className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
              </Link>
            ))}
          </div>

          {/* Back to the grid this fixture lives on — the reader's own, not the organisation's.
              A league admin has no `/tenant/calendar` to go to. */}
          <Link
            href={calendarHref(user?.roles ?? [], g.leagueId)}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-ink-subtle transition-colors hover:text-ink"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Voir le calendrier
          </Link>
        </aside>
      </div>

      <ScoreDialog open={scoring} onClose={() => setScoring(false)} entry={entry} />
      {day && (
        <FixtureDialog
          open={editing}
          onClose={() => setEditing(false)}
          day={day}
          entry={entry}
          competitions={dayCalendar.data?.competitions ?? []}
          venues={dayCalendar.data?.venues ?? []}
          entriesThatDay={entriesThatDay}
          durationMinutes={duration}
        />
      )}
    </div>
  );
}

/** The calendar the reader is entitled to. A league admin has no `/tenant/calendar` to go to. */
function calendarHref(roles: string[], leagueId: string): string {
  if (roles.includes(Roles.TENANT_ADMIN) || roles.includes(Roles.SYSTEM_ADMIN)) {
    return '/tenant/calendar';
  }
  return `/league/calendar?ctxLeagueId=${leagueId}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 px-3 py-2.5 text-sm">
      <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-ink-subtle">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

function TeamSide({
  team,
  role,
  align,
}: {
  team: { name: string; shortCode?: string | null; logoUrl?: string | null };
  role: string;
  align: 'start' | 'end';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-3',
        align === 'end' ? 'flex-row-reverse text-right' : 'text-left',
      )}
    >
      <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-sunk sm:block">
        {team.logoUrl && (
          <Image
            src={team.logoUrl}
            alt=""
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold leading-tight text-ink sm:text-lg">
          {team.name}
        </p>
        <p className="text-xs text-ink-subtle">{role}</p>
      </div>
    </div>
  );
}

/**
 * Audit actions in French.
 *
 * The trail is read by the person defending a decision to a club, so an enum name in the middle of
 * it — `BOX_SCORE_CORRECTED` — is the one line they cannot use.
 */
const AUDIT_LABELS: Record<string, string> = {
  GAME_CREATED: 'Match créé',
  GAME_MOVED: 'Match déplacé',
  GAME_DELETED: 'Match supprimé',
  GAME_INVERTED: 'Domicile et visiteur inversés',
  SCORE_REPORTED: 'Score enregistré',
  SCORE_CORRECTED: 'Score corrigé',
  STATUS_CHANGED: 'État modifié',
  GAME_POSTPONED: 'Match reporté',
  GAME_CANCELLED: 'Match annulé',
  GAME_CONFIRMED: 'Match confirmé',
  BOX_SCORE_RECORDED: 'Feuille de match saisie',
  BOX_SCORE_CORRECTED: 'Feuille de match corrigée',
  PLAYER_ADDED_FROM_BOX_SCORE: 'Joueur ajouté depuis la feuille',
};

function auditLabel(action: string): string {
  return AUDIT_LABELS[action] ?? action.replaceAll('_', ' ').toLowerCase();
}
