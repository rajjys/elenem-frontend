'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, GripVertical, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, toastApiError } from '@/utils';
import { useScopeContext } from '@/hooks';
import {
  RANKING_METRICS,
  TIE_BREAKERS,
  useRecalculateStandings,
  useStandings,
  useUpdateStandingsRules,
} from '@/services/standings';

/**
 * The rules that produce a table.
 *
 * The standings screen states them under every table — `PTS = 2 × MG + MP`, the tie-break order,
 * the coloured bands — and this is where they are set. Keeping the two together is the point: a
 * value nobody can see is a value nobody can check, and a value nobody can change is one they
 * will keep computing by hand.
 *
 * **Saving does not recalculate.** Changing what a win is worth invalidates every row of every
 * season this competition has played, and quietly rewriting history because somebody opened a
 * settings screen is the thing this product exists not to do. So the save is quiet, the screen
 * then says the table is out of date, and rebuilding it is a second, deliberate act.
 *
 * Bands are **off by default**, and that is a decision rather than an oversight: a green top eight
 * is a promise the federation has made about its playoff, and LIPROBAKIN's changes every season
 * (ROADMAP_V2 §6, A4). Shipping a guess would put a promise on screen that nobody made.
 */
export default function StandingsRulesPage() {
  const ctx = useScopeContext();
  const leagueId = ctx.leagueId;

  const standings = useStandings(leagueId);
  const updateMut = useUpdateStandingsRules();
  const recalcMut = useRecalculateStandings();

  const server = standings.data?.rules;
  const columns = standings.data?.columns ?? [];

  const [form, setForm] = useState<{
    rankingMetric: string;
    winPoints: number;
    drawPoints: number;
    lossPoints: number;
    forfeitPoints: number;
    tieBreakerOrder: string[];
    qualificationCount: number;
    qualificationLabel: string;
    relegationCount: number;
    relegationLabel: string;
  } | null>(null);

  /** Set once the table has been saved under new rules and not yet rebuilt. */
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!standings.data || form) return;
    const r = standings.data.rules;
    setForm({
      rankingMetric: r.rankingMetric,
      winPoints: r.winPoints,
      drawPoints: r.drawPoints,
      lossPoints: r.lossPoints,
      forfeitPoints: r.forfeitPoints,
      // The response carries the tie-breakers already translated for reading; the form needs the
      // codes, so it matches them back by label. A criterion we have no French for is dropped
      // rather than shown as an enum name.
      tieBreakerOrder: r.tieBreakers
        .map((label) => TIE_BREAKERS.find((t) => t.label === label)?.value)
        .filter((v): v is string => !!v),
      qualificationCount: r.bands.qualification?.count ?? 0,
      qualificationLabel: r.bands.qualification?.label ?? '',
      relegationCount: r.bands.relegation?.count ?? 0,
      relegationLabel: r.bands.relegation?.label ?? '',
    });
  }, [standings.data, form]);

  const dirty = useMemo(() => {
    if (!form || !server) return false;
    return (
      form.rankingMetric !== server.rankingMetric ||
      form.winPoints !== server.winPoints ||
      form.drawPoints !== server.drawPoints ||
      form.lossPoints !== server.lossPoints ||
      form.forfeitPoints !== server.forfeitPoints ||
      form.qualificationCount !== (server.bands.qualification?.count ?? 0) ||
      form.qualificationLabel !== (server.bands.qualification?.label ?? '') ||
      form.relegationCount !== (server.bands.relegation?.count ?? 0) ||
      form.relegationLabel !== (server.bands.relegation?.label ?? '') ||
      form.tieBreakerOrder.join() !==
        server.tieBreakers
          .map((l) => TIE_BREAKERS.find((t) => t.label === l)?.value)
          .filter(Boolean)
          .join()
    );
  }, [form, server]);

  if (!leagueId) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-muted">
        Ouvrez une compétition pour modifier ses règles de classement.
      </p>
    );
  }

  if (standings.isPending || !form) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
      </div>
    );
  }

  const teamCount = standings.data?.rows.length ?? 0;
  const set = <K extends keyof NonNullable<typeof form>>(key: K, value: NonNullable<typeof form>[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const abbr = (key: string) => columns.find((c) => c.key === key)?.abbr ?? key;
  const hasDraws = columns.some((c) => c.key === 'draws');

  function save() {
    if (!form) return;
    updateMut.mutate(
      {
        leagueId: leagueId!,
        rankingMetric: form.rankingMetric,
        winPoints: form.winPoints,
        drawPoints: form.drawPoints,
        lossPoints: form.lossPoints,
        forfeitPoints: form.forfeitPoints,
        tieBreakerOrder: form.tieBreakerOrder,
        qualificationCount: form.qualificationCount,
        qualificationLabel: form.qualificationCount ? form.qualificationLabel.trim() : '',
        relegationCount: form.relegationCount,
        relegationLabel: form.relegationCount ? form.relegationLabel.trim() : '',
      },
      {
        onSuccess: () => {
          toast.success('Règles enregistrées.');
          setStale(true);
        },
        onError: (e) => toastApiError(e),
      },
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href={`/league/standings?ctxLeagueId=${leagueId}`}
        className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Retour au classement
      </Link>

      <header className="mb-6 mt-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Règles du classement</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ce qu&apos;un résultat vaut, comment les égalités se départagent, et quelles places le
          tableau met en couleur. Rien ici ne touche à un résultat.
        </p>
      </header>

      {/* Saving deliberately leaves the table alone; this is the second, explicit act. */}
      {stale && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-caution/40 bg-caution-soft px-3.5 py-3 text-sm text-ink">
          <span className="min-w-0 flex-1">
            Les règles ont changé. Le classement affiché a été calculé avec les anciennes — il ne
            changera qu&apos;une fois recalculé.
          </span>
          <Button
            variant="primary"
            className="h-8 px-3 text-sm"
            isLoading={recalcMut.isPending}
            onClick={() =>
              recalcMut.mutate(
                { leagueId: leagueId!, seasonId: standings.data!.seasonId },
                {
                  onSuccess: () => {
                    toast.success('Classement recalculé.');
                    setStale(false);
                  },
                  onError: (e) => toastApiError(e),
                },
              )
            }
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', recalcMut.isPending && 'animate-spin')} aria-hidden />
            Recalculer maintenant
          </Button>
        </div>
      )}

      <div className="space-y-6">
        <Section
          title="Points"
          hint={`Ce que rapporte chaque issue. Le tableau affiche la règle sous le classement, en toutes lettres.`}
        >
          <div className="grid gap-3 sm:grid-cols-4">
            <NumberField label={`Victoire (${abbr('wins')})`} value={form.winPoints} min={0} max={10} onChange={(v) => set('winPoints', v)} />
            {hasDraws && (
              <NumberField label={`Nul (${abbr('draws')})`} value={form.drawPoints} min={0} max={10} onChange={(v) => set('drawPoints', v)} />
            )}
            <NumberField label={`Défaite (${abbr('losses')})`} value={form.lossPoints} min={0} max={10} onChange={(v) => set('lossPoints', v)} />
            <NumberField label={`Forfait (${abbr('forfeits')})`} value={form.forfeitPoints} min={0} max={10} onChange={(v) => set('forfeitPoints', v)} />
          </div>
          <p className="mt-3 rounded-md bg-surface-sunk px-3 py-2 text-sm text-ink">
            <span className="font-medium">{preview(form, abbr, hasDraws)}</span>
          </p>
        </Section>

        <Section
          title="Ordre du tableau"
          hint="Sur quoi le classement est trié avant de départager les égalités."
        >
          <div className="space-y-2">
            {RANKING_METRICS.map((m) => (
              <label
                key={m.value}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                  form.rankingMetric === m.value
                    ? 'border-accent bg-accent-soft'
                    : 'border-line hover:border-line-strong',
                )}
              >
                <input
                  type="radio"
                  name="metric"
                  checked={form.rankingMetric === m.value}
                  onChange={() => set('rankingMetric', m.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{m.label}</span>
                  <span className="block text-xs text-ink-subtle">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section
          title="Départage des égalités"
          hint="Appliqués dans l’ordre, jusqu’à ce que l’un sépare les équipes. À défaut, l’ordre alphabétique."
        >
          <ol className="space-y-1.5">
            {form.tieBreakerOrder.map((code, i) => (
              <li
                key={code}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                <span className="w-4 shrink-0 tabular-nums text-ink-subtle">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-ink">
                  {TIE_BREAKERS.find((t) => t.value === code)?.label ?? code}
                </span>
                <button
                  type="button"
                  aria-label="Monter"
                  disabled={i === 0}
                  onClick={() => set('tieBreakerOrder', move(form.tieBreakerOrder, i, -1))}
                  className="rounded px-1.5 py-0.5 text-xs text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Descendre"
                  disabled={i === form.tieBreakerOrder.length - 1}
                  onClick={() => set('tieBreakerOrder', move(form.tieBreakerOrder, i, 1))}
                  className="rounded px-1.5 py-0.5 text-xs text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Retirer"
                  onClick={() => set('tieBreakerOrder', form.tieBreakerOrder.filter((c) => c !== code))}
                  className="rounded p-1 text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-negative"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
            {form.tieBreakerOrder.length === 0 && (
              <li className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-ink-muted">
                Aucun critère : les équipes à égalité sont classées par ordre alphabétique.
              </li>
            )}
          </ol>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TIE_BREAKERS.filter((t) => !form.tieBreakerOrder.includes(t.value)).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('tieBreakerOrder', [...form.tieBreakerOrder, t.value])}
                className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-text"
              >
                + {t.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Places qualificatives et relégables"
          hint="Les bandes de couleur du classement publié. Désactivées tant que la compétition n’a rien décidé — une bande est une promesse."
        >
          <div className="space-y-4">
            <BandField
              tone="positive"
              countLabel="Équipes qualifiées (depuis le haut)"
              count={form.qualificationCount}
              onCount={(v) => set('qualificationCount', v)}
              label={form.qualificationLabel}
              onLabel={(v) => set('qualificationLabel', v)}
              placeholder="Qualifiés pour les playoffs"
              max={teamCount}
              summary={
                form.qualificationCount > 0
                  ? `Places 1 à ${form.qualificationCount}`
                  : 'Aucune bande verte'
              }
            />
            <BandField
              tone="negative"
              countLabel="Équipes relégables (depuis le bas)"
              count={form.relegationCount}
              onCount={(v) => set('relegationCount', v)}
              label={form.relegationLabel}
              onLabel={(v) => set('relegationLabel', v)}
              placeholder="Relégables en D2"
              max={Math.max(teamCount - form.qualificationCount, 0)}
              summary={
                form.relegationCount > 0 && teamCount > 0
                  ? `Places ${teamCount - form.relegationCount + 1} à ${teamCount}`
                  : 'Aucune bande rouge'
              }
            />
          </div>
        </Section>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-5">
        {dirty && <p className="text-xs text-ink-subtle">Modifications non enregistrées</p>}
        <Button
          variant="primary"
          onClick={save}
          disabled={!dirty || updateMut.isPending}
          isLoading={updateMut.isPending}
          title={dirty ? undefined : 'Rien n’a été modifié'}
        >
          Enregistrer les règles
        </Button>
      </div>
    </div>
  );
}

/** The points rule as the table will state it, updated as you type. */
function preview(
  f: { winPoints: number; drawPoints: number; lossPoints: number; forfeitPoints: number },
  abbr: (k: string) => string,
  hasDraws: boolean,
): string {
  const term = (p: number, key: string) =>
    p === 0 ? null : p === 1 ? abbr(key) : `${p} × ${abbr(key)}`;
  const parts = [
    term(f.winPoints, 'wins'),
    hasDraws ? term(f.drawPoints, 'draws') : null,
    term(f.lossPoints, 'losses'),
  ].filter(Boolean);
  const base = parts.length ? `${abbr('points')} = ${parts.join(' + ')}` : `${abbr('points')} = 0`;
  if (f.forfeitPoints !== f.lossPoints) {
    return `${base} — un ${abbr('forfeits')} vaut ${f.forfeitPoints} au lieu de ${f.lossPoints}`;
  }
  return base;
}

function move(list: string[], from: number, delta: number): string[] {
  const to = from + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-ink-subtle">{hint}</p>
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) =>
          onChange(Math.max(min, Math.min(max, Number(e.target.value.replace(/\D/g, '')) || 0)))
        }
        onFocus={(e) => e.target.select()}
        className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-center text-sm tabular-nums text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}

function BandField({
  tone,
  countLabel,
  count,
  onCount,
  label,
  onLabel,
  placeholder,
  max,
  summary,
}: {
  tone: 'positive' | 'negative';
  countLabel: string;
  count: number;
  onCount: (v: number) => void;
  label: string;
  onLabel: (v: string) => void;
  placeholder: string;
  max: number;
  summary: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line px-3 py-3">
      <span
        className={cn(
          'mb-2 h-8 w-1 shrink-0 rounded-sm',
          count > 0 ? (tone === 'positive' ? 'bg-positive' : 'bg-negative') : 'bg-line',
        )}
        aria-hidden
      />
      <label className="block w-28 shrink-0">
        <span className="mb-1 block text-sm font-medium text-ink">{countLabel}</span>
        <input
          type="text"
          inputMode="numeric"
          value={count}
          onChange={(e) =>
            onCount(Math.max(0, Math.min(max, Number(e.target.value.replace(/\D/g, '')) || 0)))
          }
          onFocus={(e) => e.target.select()}
          className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-center text-sm tabular-nums text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      <label className="block min-w-0 flex-1">
        <span className="mb-1 block text-sm font-medium text-ink">Libellé de la légende</span>
        <input
          type="text"
          value={label}
          disabled={count === 0}
          maxLength={60}
          onChange={(e) => onLabel(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-sunk disabled:text-ink-subtle"
        />
      </label>
      <p className="w-full text-xs text-ink-subtle">{summary}</p>
    </div>
  );
}
