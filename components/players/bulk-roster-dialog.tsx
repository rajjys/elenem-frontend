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

/**
 * Bulk roster entry.
 *
 * A coach arrives with a team sheet on paper or in WhatsApp, not with fifteen email addresses.
 * This takes that list pasted as text and turns it into roster entries, which is the difference
 * between a five-minute setup and abandoning the product. Accepted per line:
 *
 *   7  Mumbere Katembo   Pivot
 *   Mumbere Katembo, 7, Pivot
 *   Mumbere Katembo
 *
 * The jersey number may lead or follow, and the position is optional.
 */
interface ParsedRow {
  raw: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  problem?: string;
}

const POSITION_HINTS = [
  'meneur', 'arrière', 'arriere', 'ailier', 'ailier fort', 'pivot',
  'gardien', 'défenseur', 'defenseur', 'milieu', 'attaquant',
];

export function parseRosterLine(raw: string): ParsedRow | null {
  const line = raw.trim();
  if (!line) return null;

  // Fields may be separated by commas, tabs, or runs of spaces ("7  Mumbere Katembo  Pivot").
  // Fall back to single spaces when the line has no such separators.
  const hasSeparators = /[,\t;]|\s{2,}/.test(line);
  const fields = hasSeparators
    ? line.split(/[,\t;]+|\s{2,}/).map((f) => f.trim()).filter(Boolean)
    : line.split(/\s+/);

  let jerseyNumber: number | undefined;
  let position: string | undefined;
  const nameParts: string[] = [];

  for (const field of fields) {
    const cleaned = field.replace(/^#/, '').trim();
    if (jerseyNumber === undefined && /^\d{1,3}$/.test(cleaned)) {
      jerseyNumber = Number(cleaned);
      continue;
    }
    if (!position && POSITION_HINTS.includes(cleaned.toLowerCase())) {
      position = cleaned;
      continue;
    }
    nameParts.push(cleaned);
  }

  // A field can hold several words ("Mumbere Katembo"), so flatten before splitting the name.
  const nameTokens = nameParts.join(' ').split(/\s+/).filter(Boolean);

  if (nameTokens.length === 0) {
    return { raw: line, firstName: '', lastName: '', problem: 'Aucun nom trouvé' };
  }
  if (nameTokens.length === 1) {
    return {
      raw: line,
      firstName: nameTokens[0],
      lastName: '',
      jerseyNumber,
      position,
      problem: 'Prénom et nom requis',
    };
  }

  return {
    raw: line,
    firstName: nameTokens[0],
    lastName: nameTokens.slice(1).join(' '),
    jerseyNumber,
    position,
  };
}

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
    () => text.split('\n').map(parseRosterLine).filter((r): r is ParsedRow => r !== null),
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
      setText(failed.map((f) => `${f.row.jerseyNumber ?? ''} ${f.row.firstName} ${f.row.lastName}`.trim()).join('\n'));
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
          <p className="text-sm text-gray-600">
            Collez la feuille d&apos;équipe, un joueur par ligne. Le numéro de maillot et le poste
            sont facultatifs. Aucune adresse e-mail n&apos;est requise.
          </p>

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
              placeholder={'7  Mumbere Katembo  Pivot\n12 Jean Bisimwa  Meneur\nEric Kambale'}
              className="w-full rounded-md border border-gray-300 p-3 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {rows.length > 0 && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
              <p className="mb-2 font-medium text-gray-900">
                {valid.length} joueur{valid.length === 1 ? '' : 's'} prêt
                {valid.length === 1 ? '' : 's'} à enregistrer
                {invalid.length > 0 && ` · ${invalid.length} ligne(s) à corriger`}
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {rows.slice(0, 20).map((r, i) => (
                  <li key={i} className={r.problem ? 'text-red-600' : 'text-gray-700'}>
                    <span className="inline-block w-8 font-mono tabular-nums text-gray-400">
                      {r.jerseyNumber ?? '—'}
                    </span>
                    {r.problem ? `${r.raw} — ${r.problem}` : `${r.firstName} ${r.lastName}`}
                    {r.position && <span className="ml-2 text-gray-400">{r.position}</span>}
                  </li>
                ))}
                {rows.length > 20 && (
                  <li className="text-gray-400">… et {rows.length - 20} autres</li>
                )}
              </ul>
            </div>
          )}

          {busy && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
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
