'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, LoadingSpinner } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPlayersBulk } from '@/services/players';
import { useQueryClient } from '@tanstack/react-query';
import { playerKeys } from '@/services/players';
import { TeamPicker, useResolvedScope } from './player-scope-fields';
import type { CreatePlayerDto } from '@/schemas/player-schemas';
import { formatRosterLine, parseRosterLine, type ParsedRosterRow } from './parse-roster-line';

/**
 * Bulk roster entry.
 *
 * A coach arrives with a team sheet on paper or in WhatsApp, not with fifteen email addresses.
 * This takes that list pasted as text and turns it into roster entries, which is the difference
 * between a five-minute setup and abandoning the product. One player per line, fields separated by
 * commas like a team list — `12, Muhindo Uliza Siméon, Meneur` — with number and position
 * optional. The rules live in `parse-roster-line.ts`.
 */
export function BulkRosterDialog({
  open,
  onOpenChange,
  leagueId,
  teamId,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId?: string;
  teamId?: string;
  tenantId?: string;
}) {
  const qc = useQueryClient();
  const scope = useResolvedScope({ leagueId, teamId, tenantId });
  const [text, setText] = useState('');
  const [targetTeamId, setTargetTeamId] = useState(teamId ?? '');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const rows = useMemo(
    () => text.split('\n').map(parseRosterLine).filter((r): r is ParsedRosterRow => r !== null),
    [text],
  );
  const valid = rows.filter((r) => !r.problem);
  const invalid = rows.filter((r) => r.problem);

  const effectiveTeamId = teamId ?? targetTeamId;
  const canSubmit = valid.length > 0 && !!scope.leagueId && !!scope.tenantId && !busy;

  const submit = async () => {
    if (!scope.leagueId || !scope.tenantId) return;
    setBusy(true);
    setProgress({ done: 0, total: valid.length });

    const payload: CreatePlayerDto[] = valid.map((r) => ({
      firstName: r.firstName,
      lastName: r.lastName,
      jerseyNumber: r.jerseyNumber,
      position: r.position,
      tenantId: scope.tenantId as string,
      leagueId: scope.leagueId as string,
      teamId: effectiveTeamId || undefined,
      sportType: scope.sportType,
    }));

    const { created, failed } = await createPlayersBulk(payload, (done, total) =>
      setProgress({ done, total }),
    );

    qc.invalidateQueries({ queryKey: playerKeys.lists() });
    setBusy(false);

    if (created.length) toast.success(`${created.length} joueurs ajoutés à l'effectif.`);
    if (failed.length) {
      toast.error(
        `${failed.length} ligne(s) non enregistrée(s) : ${failed[0].error}`,
        { duration: 8000 },
      );
      // Leave the failures in the box so they can be corrected and resubmitted.
      setText(failed.map((f) => formatRosterLine(f.row)).join('\n'));
    } else {
      setText('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter une liste de joueurs</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-ink-muted">
            <p>
              Un joueur par ligne : <span className="font-medium text-ink">numéro, nom complet,
              poste</span> — séparés par des virgules. Le numéro et le poste sont facultatifs.
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              Une copie depuis Excel fonctionne aussi, avec les colonnes dans le même ordre. Aucune
              adresse e-mail n&apos;est requise.
            </p>
          </div>

          {!teamId && (
            <TeamPicker
              leagueId={scope.leagueId}
              value={targetTeamId}
              onChange={setTargetTeamId}
              label="Équipe (facultatif)"
            />
          )}

          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
              rows={10}
              spellCheck={false}
              placeholder={'12, Muhindo Uliza Siméon, Meneur\n7, Mumbere Katembo, Pivot\nEric Kambale'}
              className="w-full rounded-md border border-line p-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {rows.length > 0 && (
            <div className="rounded-md border border-line bg-surface-sunk p-3 text-sm">
              <p className="mb-2 font-medium text-ink">
                {valid.length} joueur{valid.length === 1 ? '' : 's'} prêt
                {valid.length === 1 ? '' : 's'} à enregistrer
                {invalid.length > 0 && ` · ${invalid.length} ligne(s) à corriger`}
              </p>
              {/* Three columns, so the reader sees how each line was understood — which field
                  became the number, the name and the position — before anything is saved. */}
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                <li className="grid grid-cols-[2.5rem_1fr_8rem] gap-2 text-xs uppercase tracking-wider text-ink-subtle">
                  <span>N°</span>
                  <span>Nom</span>
                  <span>Poste</span>
                </li>
                {rows.slice(0, 30).map((r, i) =>
                  r.problem ? (
                    <li key={i} className="text-negative">
                      {r.raw} — {r.problem}
                    </li>
                  ) : (
                    <li key={i} className="grid grid-cols-[2.5rem_1fr_8rem] gap-2 text-ink">
                      <span className="font-mono tabular-nums text-ink-subtle">
                        {r.jerseyNumber ?? '—'}
                      </span>
                      <span className="truncate">
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="truncate text-ink-muted">{r.position ?? '—'}</span>
                    </li>
                  ),
                )}
                {rows.length > 30 && (
                  <li className="text-ink-subtle">… et {rows.length - 30} autres</li>
                )}
              </ul>
            </div>
          )}

          {busy && (
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <LoadingSpinner />
              <span>
                Enregistrement… {progress.done}/{progress.total}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit} isLoading={busy}>
            Enregistrer {valid.length > 0 ? `${valid.length} joueur${valid.length === 1 ? '' : 's'}` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
