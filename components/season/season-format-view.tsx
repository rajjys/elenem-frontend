'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronLeft, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  LoadingSpinner,
  PageHeader,
  SelectField,
} from '@/components/ui';
import { useContextualLink, useScopeContext } from '@/hooks';
import {
  describeShape,
  SeasonTemplate,
  StageFormat,
  STAGE_FORMAT_HINT,
  STAGE_FORMAT_LABEL,
  useApplyTemplate,
  useCreateStage,
  useDeleteStage,
  useReorderStages,
  useSetGroupMembers,
  useStages,
  useUpdateStage,
  type Stage,
} from '@/services/stages';
import { useLeagueTeams } from '@/services/teams-lite';
import { toastApiError } from '@/utils';
import { toast } from 'sonner';

/**
 * A season's shape.
 *
 * The first genuinely season-scoped screen in the product, and it opens two weeks after we deleted
 * the last one — which is not a reversal. What was wrong with `/season/[id]` was a one-item sidebar
 * naming itself on a leaf and a flat top-level address for a page nobody could reach; this renders
 * the reader's own chrome and lives under the season it belongs to.
 *
 * It earns the address because composing a format is a *workspace*, not a verb: several phases
 * read and rearranged as a set. `CALENDAR_MODULE` §7 drew that line already — "a workspace is a
 * page, and only an identifiable resource earns a flat route."
 *
 * See docs/STAGES_AND_PLAYOFFS.md §4.1.
 */
export function SeasonFormatView({ seasonId }: { seasonId: string }) {
  const ctx = useScopeContext();
  const { buildLink } = useContextualLink();
  const stages = useStages(seasonId);
  const teams = useLeagueTeams(ctx.leagueId ?? undefined);

  const list = useMemo(() => stages.data ?? [], [stages.data]);
  const shape = describeShape(list);
  const untouched = list.every((s) => s.fixtureCount === 0);

  const backHref = buildLink('/league/seasons', ctx.leagueId ? { ctxLeagueId: ctx.leagueId } : undefined);

  if (stages.isLoading) return <LoadingSpinner />;
  if (stages.isError) {
    return (
      <p className="mt-8 text-center text-sm text-negative">
        Les phases n’ont pas pu être chargées.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href={backHref} className="mb-3 inline-flex items-center text-sm text-ink-muted nav-hover">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Saisons
      </Link>

      <PageHeader
        title="Format de la saison"
        description={
          shape
            ? `Les phases se jouent dans cet ordre : ${shape}.`
            : 'Une saison se joue en phases. Une seule suffit — c’est le cas de la plupart des championnats.'
        }
      />

      {/* Templates, and only while nothing has been played. Recomposing a season that has results
          would rewrite the shape it was played under. */}
      {untouched && <Templates seasonId={seasonId} many={list.length > 1} />}

      <ol className="mt-6 space-y-3">
        {list.map((stage, i) => (
          <StageCard
            key={stage.id}
            stage={stage}
            index={i}
            total={list.length}
            seasonId={seasonId}
            teams={teams.data ?? []}
          />
        ))}
      </ol>

      <AddStage seasonId={seasonId} />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- */

function Templates({ seasonId, many }: { seasonId: string; many: boolean }) {
  const apply = useApplyTemplate(seasonId);
  const [busy, setBusy] = useState<string | null>(null);

  const options: { key: SeasonTemplate; label: string; detail: string }[] = [
    { key: SeasonTemplate.SIMPLE, label: 'Championnat simple', detail: 'Une phase, aller-retour.' },
    {
      key: SeasonTemplate.LEAGUE_PLAYOFFS,
      label: 'Championnat + play-offs',
      detail: 'Une phase régulière, puis une élimination directe entre les premiers.',
    },
    {
      key: SeasonTemplate.GROUPS_KNOCKOUT,
      label: 'Poules + phase finale',
      detail: 'Deux poules, puis une élimination directe entre les qualifiés.',
    },
  ];

  async function run(key: SeasonTemplate) {
    setBusy(key);
    try {
      await apply.mutateAsync({ template: key });
      toast.success('Format appliqué.');
    } catch (err) {
      toastApiError(err, 'Le format n’a pas pu être appliqué.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink">
        {many ? 'Repartir d’un modèle' : 'Partir d’un modèle'}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Un point de départ, pas une contrainte : chaque phase reste modifiable ensuite.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => run(o.key)}
            disabled={!!busy}
            className="rounded-md border border-line bg-surface-sunk p-3 text-left transition-colors hover:bg-line disabled:opacity-60"
          >
            <span className="block text-sm font-medium text-ink">{o.label}</span>
            <span className="mt-0.5 block text-xs text-ink-muted">{o.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function StageCard({
  stage,
  index,
  total,
  seasonId,
  teams,
}: {
  stage: Stage;
  index: number;
  total: number;
  seasonId: string;
  teams: { id: string; name: string; shortCode: string | null }[];
}) {
  const update = useUpdateStage();
  const remove = useDeleteStage();
  const reorder = useReorderStages(seasonId);
  const stages = useStages(seasonId);
  const [name, setName] = useState(stage.name);

  // A phase that has produced a result has been played under its format, so the format locks.
  const locked = stage.playedCount > 0;

  async function save(patch: Parameters<typeof update.mutateAsync>[0]) {
    try {
      await update.mutateAsync(patch);
    } catch (err) {
      toastApiError(err, 'La phase n’a pas pu être modifiée.');
    }
  }

  async function move(direction: -1 | 1) {
    const ids = (stages.data ?? []).map((s) => s.id);
    const to = index + direction;
    if (to < 0 || to >= ids.length) return;
    [ids[index], ids[to]] = [ids[to], ids[index]];
    try {
      await reorder.mutateAsync(ids);
    } catch (err) {
      toastApiError(err, 'L’ordre n’a pas pu être changé.');
    }
  }

  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-xs font-semibold text-ink-muted">
          {stage.order}
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() !== stage.name && name.trim().length >= 2 && save({ id: stage.id, name: name.trim() })}
            aria-label="Nom de la phase"
            className="font-medium"
          />

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <SelectField
                label="Format"
                placeholder="Format"
                value={stage.format}
                onChange={(v) => void save({ id: stage.id, format: v as StageFormat })}
                disabled={locked}
                options={Object.values(StageFormat).map((f) => ({
                  value: f,
                  label: STAGE_FORMAT_LABEL[f],
                }))}
              />
            </div>

            {stage.format === StageFormat.LEAGUE && (
              <div className="w-36">
                <SelectField
                  label="Manches"
                  placeholder="Manches"
                  value={String(stage.legs)}
                  onChange={(v) => void save({ id: stage.id, legs: Number(v) })}
                  options={[
                    { value: '1', label: 'Aller' },
                    { value: '2', label: 'Aller-retour' },
                  ]}
                />
              </div>
            )}

            {stage.order < total && (
              <div className="w-36">
                <Label htmlFor={`adv-${stage.id}`}>Qualifiés</Label>
                <Input
                  id={`adv-${stage.id}`}
                  type="number"
                  min={1}
                  defaultValue={stage.advancing ?? ''}
                  placeholder="—"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    save({ id: stage.id, advancing: v ? Number(v) : null });
                  }}
                />
              </div>
            )}
          </div>

          <p className="text-xs text-ink-muted">{STAGE_FORMAT_HINT[stage.format]}</p>

          {locked && (
            <p className="text-xs text-ink-muted">
              {stage.playedCount} résultat{stage.playedCount > 1 ? 's' : ''} enregistré
              {stage.playedCount > 1 ? 's' : ''} — le format ne change plus.
            </p>
          )}

          {stage.format === StageFormat.GROUPS && (
            <Pools stage={stage} teams={teams} />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => move(-1)} disabled={index === 0} aria-label="Monter">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => move(1)} disabled={index === total - 1} aria-label="Descendre">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Supprimer ${stage.name}`}
            onClick={async () => {
              try {
                await remove.mutateAsync(stage.id);
                toast.success(`« ${stage.name} » supprimée.`);
              } catch (err) {
                // Refused in French when it holds fixtures, or when it is the last one.
                toastApiError(err, 'Cette phase n’a pas pu être supprimée.');
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-negative" />
          </Button>
        </div>
      </div>

      {stage.fixtureCount > 0 && (
        <p className="mt-3 border-t border-line pt-2 text-xs text-ink-muted">
          {stage.fixtureCount} rencontre{stage.fixtureCount > 1 ? 's' : ''} · {stage.playedCount} avec
          un résultat
        </p>
      )}
    </li>
  );
}

/** Which clubs are in which pool. Derived from fixtures it would be wrong — see the model. */
function Pools({
  stage,
  teams,
}: {
  stage: Stage;
  teams: { id: string; name: string; shortCode: string | null }[];
}) {
  const setMembers = useSetGroupMembers();

  const assignedElsewhere = (groupId: string) =>
    new Set(stage.groups.filter((g) => g.id !== groupId).flatMap((g) => g.teamIds));

  return (
    <div className="space-y-2 rounded-md bg-surface-sunk p-3">
      {stage.groups.map((g) => {
        const taken = assignedElsewhere(g.id);
        return (
          <div key={g.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{g.name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {teams.map((t) => {
                const inThis = g.teamIds.includes(t.id);
                const inOther = taken.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={inOther}
                    title={inOther ? 'Déjà dans une autre poule' : undefined}
                    onClick={() =>
                      setMembers.mutateAsync({
                        groupId: g.id,
                        teamIds: inThis
                          ? g.teamIds.filter((id) => id !== t.id)
                          : [...g.teamIds, t.id],
                      }).catch((err) => toastApiError(err, 'Poule non enregistrée.'))
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      inThis
                        ? 'border-accent bg-accent-soft text-accent-text'
                        : inOther
                          ? 'border-line bg-surface text-ink-subtle opacity-50'
                          : 'border-line bg-surface text-ink-muted hover:bg-line'
                    }`}
                  >
                    {t.shortCode ?? t.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {teams.length === 0 && (
        <p className="text-xs text-ink-muted">Aucune équipe dans cette compétition pour l’instant.</p>
      )}
    </div>
  );
}

function AddStage({ seasonId }: { seasonId: string }) {
  const create = useCreateStage(seasonId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<StageFormat>(StageFormat.KNOCKOUT);
  const [groupCount, setGroupCount] = useState('2');

  if (!open) {
    return (
      <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
        Ajouter une phase
      </Button>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-dashed border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <Label htmlFor="new-stage-name">Nom</Label>
          <Input
            id="new-stage-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Play-offs, Barrage, Finale…"
            autoFocus
          />
        </div>
        <div className="w-48">
          <SelectField
            label="Format"
            placeholder="Format"
            value={format}
            onChange={(v) => setFormat(v as StageFormat)}
            options={Object.values(StageFormat).map((f) => ({
              value: f,
              label: STAGE_FORMAT_LABEL[f],
            }))}
          />
        </div>
        {format === StageFormat.GROUPS && (
          <div className="w-28">
            <Label htmlFor="new-stage-pools">Poules</Label>
            <Input
              id="new-stage-pools"
              type="number"
              min={2}
              max={12}
              value={groupCount}
              onChange={(e) => setGroupCount(e.target.value)}
            />
          </div>
        )}
      </div>
      <p className="text-xs text-ink-muted">{STAGE_FORMAT_HINT[format]}</p>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={name.trim().length < 2 || create.isPending}
          onClick={async () => {
            try {
              await create.mutateAsync({
                name: name.trim(),
                format,
                ...(format === StageFormat.GROUPS ? { groupCount: Number(groupCount) || 2 } : {}),
              });
              setName('');
              setOpen(false);
            } catch (err) {
              toastApiError(err, 'La phase n’a pas pu être ajoutée.');
            }
          }}
        >
          Ajouter
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
