'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  History,
  LayoutGrid,
  Loader2,
  MapPin,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Button, ErrorState } from '@/components/ui';
import { useCurrentUser } from '@/hooks';
import { Roles } from '@/schemas';
import { BoxScoreSheet } from '@/components/game/box-score-sheet';
import { GameTimeline } from '@/components/game/game-timeline';
import { GameActionDialog, type GameAction } from '@/components/game/game-action-dialog';
import { FixtureDialog, ScoreDialog } from '@/components/calendar';
import { useCalendar, type CalendarEntry } from '@/services/calendar';
import { useGame, useGameAudit, type GameDetail } from '@/services/games';
import { useBoxScore, totalOf, type BoxScore } from '@/services/box-score';
import { cn } from '@/utils';

/**
 * One match, on its own page.
 *
 * **Fifteen per cent of the work happens here, and it is the fifteen per cent that has to be
 * right.** The calendar is where a fixture is scored and shoved around between other fixtures, and
 * it is deliberately terse — every control is squeezed in beside a month grid. This page is
 * reached when somebody stops to *look at one match*: to check a sheet, to answer a club, to
 * decide something. It should not read as a slice of the calendar pasted onto a wider background,
 * which is what the first version was: a scoreboard, a sheet, a collapsible and a rail of buttons,
 * in the order they happened to get built.
 *
 * So it is organised the way the questions arrive:
 *
 *  - **Aperçu** — what this match is, and the shape of how it went.
 *  - **Feuille de match** — who played, and what they did.
 *  - **Historique** — what has been done to this fixture, and why.
 *
 * And the actions are **separated**. On the calendar "Déplacer, reporter, supprimer…" is one entry
 * because there is room for one; here they are different decisions with different consequences —
 * one keeps the match and loses its date, one voids it, one removes it from the season — and they
 * are listed as such.
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

/** On the dark masthead, so the tones are the soft variants against ink rather than on surface. */
function statusTone(status: string): string {
  if (status === 'LIVE') return 'bg-negative-soft text-negative ring-negative/30';
  if (status === 'COMPLETED') return 'bg-positive-soft text-positive ring-positive/30';
  if (status === 'POSTPONED' || status === 'CANCELLED') {
    return 'bg-caution-soft text-caution ring-caution/30';
  }
  return 'bg-surface/15 text-surface ring-surface/25';
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const longDate = (d: Date) =>
  `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const timeOf = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

type Tab = 'overview' | 'sheet' | 'history';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = (params?.gameId as string) ?? '';

  const [tab, setTab] = useState<Tab>('overview');
  const [scoring, setScoring] = useState(false);
  const [moving, setMoving] = useState(false);
  const [action, setAction] = useState<GameAction | null>(null);

  const user = useCurrentUser();
  const game = useGame(gameId);
  const day = game.data ? isoDay(new Date(game.data.dateTime)) : null;

  // The rest of that day, which is what the slot editor needs to answer "is this hour free" and to
  // list what the two clubs are already committed to. The same request the calendar makes, so the
  // two screens reason from identical information.
  const dayCalendar = useCalendar({ from: day ?? '1970-01-01', to: day ?? '1970-01-01' });
  const audit = useGameAudit(gameId, true);
  // Read on every tab, not just the sheet's: the overview's comparison is built from it.
  const box = useBoxScore(gameId, !!game.data && game.data.status === 'COMPLETED');

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
    // Not the axios message: "Request failed with status code 404" is English, on a French-only
    // product, and tells the reader nothing they can act on.
    return (
      <ErrorState
        title="Match introuvable"
        error={
          {
            message:
              'Ce match n’existe plus, ou vous n’avez pas accès à la compétition à laquelle il appartient.',
          } as Error
        }
        reset={() => game.refetch()}
      />
    );
  }

  const g = game.data;
  const at = new Date(g.dateTime);
  const played = g.status === 'COMPLETED';
  const hasScore = g.homeScore != null && g.awayScore != null;
  const duration = entry?.durationMinutes ?? 100;
  const backHref = calendarHref(user?.roles ?? [], g.leagueId);

  const teamHref = (teamId: string) =>
    `/team/dashboard?ctxTeamId=${teamId}&ctxLeagueId=${g.leagueId}`;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Aperçu', icon: LayoutGrid },
    { key: 'sheet', label: 'Feuille de match', icon: ClipboardList },
    { key: 'history', label: 'Historique', icon: History },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      {/* Back first, and as a real control. The link to the calendar was a whisper at the bottom
          of a rail — on the one page most often reached *from* the calendar, that is the wrong
          end of the screen. */}
      <Link
        href={backHref}
        className="-ml-2 mt-5 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Retour au calendrier
      </Link>

      {/* The masthead. One block answering "which match, and how did it go" before anything else
          is read — dark, so the page has a head rather than a stack of equally-weighted cards. */}
      <section className="mt-3 overflow-hidden rounded-2xl bg-ink text-surface shadow-e2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-surface/10 px-5 py-3 text-sm text-surface/70">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
              statusTone(g.status),
            )}
          >
            {STATUS_LABELS[g.status] ?? g.status}
          </span>
          <span className="truncate">{g.league.name}</span>
          {g.season && <span className="text-surface/50">· {g.season.name}</span>}
          <span className="ml-auto flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="first-letter:uppercase">{longDate(at)}</span>
            <span className="tabular-nums">· {timeOf(at)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-6 sm:gap-6 sm:px-5 sm:py-8">
          <TeamSide team={g.homeTeam} role="domicile" align="end" href={teamHref(g.homeTeam.id)} />
          <div className="shrink-0 text-center">
            {hasScore ? (
              <p className="flex items-center justify-center gap-2 text-4xl font-bold tabular-nums sm:gap-4 sm:text-6xl">
                <span>{g.homeScore}</span>
                {/* A hairline rather than a dash: at this size an en dash is as heavy as the
                    digits and the three read as one number. */}
                <span className="h-0.5 w-3 shrink-0 rounded-full bg-surface/25 sm:w-5" aria-hidden />
                <span>{g.awayScore}</span>
              </p>
            ) : (
              <p className="text-3xl font-semibold tabular-nums text-surface/50 sm:text-4xl">
                {timeOf(at)}
              </p>
            )}
            {g.isForfeit && <p className="mt-1 text-xs font-medium text-caution">Forfait</p>}
          </div>
          <TeamSide team={g.awayTeam} role="visiteur" align="start" href={teamHref(g.awayTeam.id)} />
        </div>
      </section>

      {/* Tabs and the primary action share a row, the way the calendar's title shares one with
          "Nouveau match". The score is what anybody comes here to change. */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Sections du match">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              <t.icon className="h-4 w-4 shrink-0" aria-hidden />
              {t.label}
            </button>
          ))}
        </nav>
        {entry && (
          <Button variant="primary" className="mb-2" onClick={() => setScoring(true)}>
            {hasScore ? 'Corriger le score' : 'Saisir le score'}
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          {tab === 'overview' && (
            <Overview
              game={g}
              duration={duration}
              boxScore={box.data}
              onOpenSheet={() => setTab('sheet')}
            />
          )}

          {tab === 'sheet' &&
            (played ? (
              <BoxScoreSheet gameId={gameId} />
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-12 text-center text-sm text-ink-muted">
                La feuille se saisit après le match, à partir de la feuille des officiels.
                {!hasScore && ' Enregistrez d’abord le score final.'}
              </p>
            ))}

          {tab === 'history' &&
            (audit.isPending ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
              </div>
            ) : (
              <GameTimeline entries={audit.data ?? []} venues={dayCalendar.data?.venues ?? []} />
            ))}
        </div>

        {/* Each action on its own line, because each is its own decision. The two clubs are
            reachable from the masthead, so the "Équipes" card that used to sit here was a second
            door onto the same room. */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-line">
            <p className="border-b border-line bg-surface-sunk px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-ink-subtle">
              Actions
            </p>
            <div className="divide-y divide-line">
              <ActionRow
                icon={CalendarClock}
                label="Déplacer"
                hint="Changer la date, l’heure ou la salle"
                onClick={() => setMoving(true)}
                disabled={!entry}
              />
              {g.status === 'SCHEDULED' && (
                <ActionRow
                  icon={CheckCircle2}
                  label="Confirmer"
                  hint="Arrêter la date et la salle"
                  onClick={() => setAction('confirm')}
                />
              )}
              {g.status === 'POSTPONED' && (
                <ActionRow
                  icon={CalendarClock}
                  label="Reprogrammer"
                  hint="Remettre le match au calendrier"
                  onClick={() => setAction('schedule')}
                />
              )}
              {(g.status === 'SCHEDULED' || g.status === 'CONFIRMED') && (
                <ActionRow
                  icon={CalendarClock}
                  label="Reporter"
                  hint="Le match garde sa place, pas sa date"
                  onClick={() => setAction('postpone')}
                />
              )}
              {!played && !hasScore && (
                <ActionRow
                  icon={ArrowLeftRight}
                  label="Inverser les équipes"
                  hint="Le match a été saisi à l’envers"
                  onClick={() => setAction('invert')}
                />
              )}
              {g.status !== 'CANCELLED' && !played && (
                <ActionRow
                  icon={TriangleAlert}
                  label="Annuler"
                  hint="Le match ne sera pas joué"
                  onClick={() => setAction('cancel')}
                  tone="caution"
                />
              )}
              <ActionRow
                icon={Trash2}
                label="Supprimer"
                hint="Saisi par erreur"
                onClick={() => setAction('delete')}
                tone="danger"
              />
            </div>
          </div>
        </aside>
      </div>

      <ScoreDialog open={scoring} onClose={() => setScoring(false)} entry={entry} />
      {day && (
        <FixtureDialog
          open={moving}
          onClose={() => setMoving(false)}
          day={day}
          entry={entry}
          competitions={dayCalendar.data?.competitions ?? []}
          venues={dayCalendar.data?.venues ?? []}
          entriesThatDay={entriesThatDay}
          durationMinutes={duration}
        />
      )}
      <GameActionDialog
        action={action}
        gameId={gameId}
        matchup={`${g.homeTeam.name} – ${g.awayTeam.name}`}
        onClose={() => setAction(null)}
        onDeleted={() => router.push(backHref)}
      />
    </div>
  );
}

/**
 * What this match is, and the shape of how it went.
 *
 * The facts a secretary reads off, and — once a sheet exists — the two things worth turning a box
 * score into at a glance: who scored most, and how the two teams arrived at their totals. Both are
 * derived from data already on the page; neither is another request.
 */
function Overview({
  game: g,
  duration,
  boxScore,
  onOpenSheet,
}: {
  game: GameDetail;
  duration: number;
  boxScore: BoxScore | undefined;
  onOpenSheet: () => void;
}) {
  const at = new Date(g.dateTime);

  // Built from the sheet if there is one. Nothing otherwise — a comparison of two blanks is worse
  // than no comparison.
  const analysis = useMemo(() => {
    if (!boxScore || boxScore.columns.length === 0) return null;
    const cols = boxScore.columns;
    const sides = (['home', 'away'] as const).map((k) => {
      const side = boxScore[k];
      const per = Object.fromEntries(
        cols.map((c) => [c.code, side.players.reduce((t, p) => t + (p.stats[c.code] ?? 0), 0)]),
      );
      const best = side.players
        .map((p) => ({ p, total: totalOf(cols, p.stats) }))
        .sort((a, b) => b.total - a.total)[0];
      return {
        name: side.name,
        per: per as Record<string, number>,
        top: best && best.total > 0 ? best : null,
        appearances: side.players.filter((p) => p.played).length,
      };
    });
    return sides.some((s) => s.top || s.appearances > 0) ? { cols, sides } : null;
  }, [boxScore]);

  const facts: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Heure',
      value: (
        <span className="tabular-nums text-ink">
          {timeOf(at)} <span className="text-ink-subtle">· {duration} min</span>
        </span>
      ),
    },
    {
      label: 'Salle',
      value: g.homeVenue ? (
        <span className="flex items-center gap-1.5 text-ink">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
          {g.homeVenue.name}
        </span>
      ) : g.location ? (
        <span className="text-ink">{g.location}</span>
      ) : (
        <span className="text-ink-subtle">Pas encore attribuée</span>
      ),
    },
    { label: 'Compétition', value: <span className="text-ink">{g.league.name}</span> },
    ...(g.season
      ? [{ label: 'Saison', value: <span className="text-ink">{g.season.name}</span> }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <dl className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.label} className="bg-surface px-4 py-3">
            <dt className="text-xs uppercase tracking-wider text-ink-subtle">{f.label}</dt>
            <dd className="mt-1 text-sm">{f.value}</dd>
          </div>
        ))}
      </dl>

      {g.notes && (
        <p className="rounded-xl border border-line bg-surface-sunk px-4 py-3 text-sm text-ink-muted">
          {g.notes}
        </p>
      )}

      {analysis ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
            D&apos;après la feuille de match
          </h2>
          <div className="overflow-hidden rounded-xl border border-line">
            {/* Top scorers first, because that is the one line anybody repeats out loud. */}
            <div className="grid gap-px bg-line sm:grid-cols-2">
              {analysis.sides.map((s) => (
                <div key={s.name} className="bg-surface px-4 py-3">
                  <p className="truncate text-xs uppercase tracking-wider text-ink-subtle">
                    {s.name}
                  </p>
                  {s.top ? (
                    <p className="mt-1 text-sm text-ink">
                      <span className="font-semibold">
                        {s.top.p.lastName} {s.top.p.firstName}
                      </span>{' '}
                      <span className="tabular-nums text-ink-muted">
                        {s.top.total} {boxScore!.totalAbbr.toLowerCase()}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-ink-subtle">Pas encore de statistiques</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {s.appearances} joueur{s.appearances > 1 ? 's' : ''} sur la feuille
                  </p>
                </div>
              ))}
            </div>

            {/* One row per column the sport declares, the two clubs either side of its name. A
                comparison, not two tables side by side. */}
            <div className="divide-y divide-line border-t border-line">
              {analysis.cols.map((c) => {
                const h = analysis.sides[0].per[c.code] ?? 0;
                const a = analysis.sides[1].per[c.code] ?? 0;
                const max = Math.max(h, a, 1);
                return (
                  <div key={c.code} className="flex items-center gap-3 px-4 py-2">
                    <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
                      {h}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-surface-sunk">
                        <span
                          className="h-full rounded-full bg-accent/70"
                          style={{ width: `${(h / max) * 100}%` }}
                        />
                      </div>
                      <span
                        title={c.label}
                        className="shrink-0 cursor-help text-xs uppercase tracking-wide text-ink-subtle"
                      >
                        {c.abbr}
                      </span>
                      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunk">
                        <span
                          className="h-full rounded-full bg-accent/40"
                          style={{ width: `${(a / max) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {a}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        g.status === 'COMPLETED' && (
          <button
            type="button"
            onClick={onOpenSheet}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line px-4 py-6 text-sm text-ink-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-text"
          >
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
            Aucune feuille de match saisie — la remplir
          </button>
        )
      )}
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  hint,
  onClick,
  disabled,
  tone = 'neutral',
}: {
  icon: React.ElementType;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'caution' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'danger'
          ? 'hover:bg-negative-soft'
          : tone === 'caution'
            ? 'hover:bg-caution-soft'
            : 'hover:bg-surface-sunk',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          tone === 'danger'
            ? 'text-negative'
            : tone === 'caution'
              ? 'text-caution'
              : 'text-ink-subtle',
        )}
        aria-hidden
      />
      <span className="min-w-0">
        <span
          className={cn(
            'block text-sm font-medium',
            tone === 'danger' ? 'text-negative' : 'text-ink',
          )}
        >
          {label}
        </span>
        {/* The consequence in four words. These are rare acts and the verb alone does not
            distinguish "reporter" from "annuler" for somebody doing it twice a season. */}
        <span className="block text-xs text-ink-subtle">{hint}</span>
      </span>
    </button>
  );
}

function TeamSide({
  team,
  role,
  align,
  href,
}: {
  team: { name: string; shortCode?: string | null; logoUrl?: string | null };
  role: string;
  align: 'start' | 'end';
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-surface/10',
        align === 'end' ? 'flex-row-reverse text-right' : 'text-left',
      )}
    >
      {/* Initials until there is a crest. An empty grey disc between the club's name and the
          score is furniture that has to be looked past; the short code is the thing the league's
          own paperwork uses anyway. */}
      <span className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface/15 text-sm font-semibold tracking-wide text-surface/70 sm:flex">
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt=""
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          (team.shortCode ?? team.name.slice(0, 3)).toUpperCase().slice(0, 3)
        )}
      </span>
      <div className="min-w-0">
        {/* On a phone the full name truncates to "AS G…", which names nothing. The short code is
            the league's own abbreviation and fits whole — the full name returns from sm up, where
            there is room for it. */}
        <p className="truncate text-base font-semibold leading-tight underline-offset-4 group-hover:underline sm:text-xl">
          <span className="sm:hidden">
            {team.shortCode ?? team.name}
          </span>
          <span className="hidden sm:inline">{team.name}</span>
        </p>
        <p className="text-xs text-surface/50">{role}</p>
      </div>
    </Link>
  );
}

/** The calendar the reader is entitled to. A league admin has no `/tenant/calendar` to go to. */
function calendarHref(roles: string[], leagueId: string): string {
  if (roles.includes(Roles.TENANT_ADMIN) || roles.includes(Roles.SYSTEM_ADMIN)) {
    return '/tenant/calendar';
  }
  return `/league/calendar?ctxLeagueId=${leagueId}`;
}
