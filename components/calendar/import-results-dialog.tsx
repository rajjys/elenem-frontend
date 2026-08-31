'use client';

import { useRef, useState } from 'react';
import { CircleAlert, FileUp, Loader2, Plus, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/services/api';
import { useImportResults, type ImportReport, type ImportRow } from '@/services/calendar';
import { cn } from '@/utils';

/**
 * Sending the filled-in results sheet back.
 *
 * Two steps, always: the file is previewed before anything is written. A spreadsheet somebody
 * else filled in is the one input an organiser cannot check by eye — they were handed it, they
 * did not type it — so the only honest way to accept it is to say what it will do and let them
 * decide. The server runs exactly the same checks in both passes, so what the preview promises
 * is what happens.
 */

const OUTCOME_META: Record<
  ImportRow['outcome'],
  { label: string; tone: string; icon: typeof RefreshCw | null }
> = {
  score: { label: 'Score enregistré', tone: 'text-positive', icon: RefreshCw },
  create: { label: 'Match ajouté', tone: 'text-accent-text', icon: Plus },
  unchanged: { label: 'Inchangé', tone: 'text-ink-subtle', icon: null },
  error: { label: 'Problème', tone: 'text-negative', icon: CircleAlert },
};

function Summary({ report, applied }: { report: ImportReport; applied: boolean }) {
  const cells = [
    { key: 'score' as const, label: applied ? 'scores enregistrés' : 'scores à enregistrer' },
    { key: 'create' as const, label: applied ? 'matchs ajoutés' : 'matchs à ajouter' },
    { key: 'unchanged' as const, label: 'inchangés' },
    { key: 'error' as const, label: 'problèmes' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cells.map((c) => (
        <div
          key={c.key}
          className={cn(
            'rounded-lg border px-3 py-2',
            c.key === 'error' && report.totals.error > 0
              ? 'border-negative/30 bg-negative-soft'
              : 'border-line bg-surface-sunk',
          )}
        >
          <p
            className={cn(
              'text-xl font-bold tabular-nums',
              c.key === 'error' && report.totals.error > 0 ? 'text-negative' : 'text-ink',
            )}
          >
            {report.totals[c.key]}
          </p>
          <p className="text-xs text-ink-subtle">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

export function ImportResultsDialog({
  open,
  onOpenChange,
  seasonId,
  seasonLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonId: string;
  seasonLabel: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [applied, setApplied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const importResults = useImportResults();

  function reset() {
    setFile(null);
    setReport(null);
    setApplied(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function run(dryRun: boolean) {
    if (!file) return;
    try {
      const result = await importResults.mutateAsync({ seasonId, file, dryRun });
      setReport(result);
      setApplied(!dryRun);
      if (!dryRun) {
        toast.success(
          `${result.totals.score + result.totals.create} ligne${
            result.totals.score + result.totals.create > 1 ? 's' : ''
          } enregistrée${result.totals.score + result.totals.create > 1 ? 's' : ''}.`,
        );
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Le fichier n'a pas pu être lu."));
    }
  }

  // Rows worth reading: an unchanged row is noise in a list of a hundred.
  const notable = (report?.rows ?? []).filter((r) => r.outcome !== 'unchanged');
  const willWrite = (report?.totals.score ?? 0) + (report?.totals.create ?? 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer les résultats</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            {seasonLabel} — renvoyez la feuille de résultats remplie. Rien n&apos;est enregistré
            avant que vous ne confirmiez.
          </p>

          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 transition-colors',
              file ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong',
            )}
          >
            <FileUp className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">
                {file ? file.name : 'Choisir le fichier .xlsx'}
              </span>
              <span className="block text-xs text-ink-subtle">
                {file
                  ? `${Math.round(file.size / 1024)} Ko`
                  : 'Le fichier téléchargé depuis Elenem, avec les scores remplis'}
              </span>
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setReport(null);
                setApplied(false);
              }}
            />
          </label>

          {report && (
            <div className="space-y-3">
              <Summary report={report} applied={applied} />

              {notable.length > 0 && (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-line">
                  <ul className="divide-y divide-line">
                    {notable.map((row) => {
                      const meta = OUTCOME_META[row.outcome];
                      const Icon = meta.icon;
                      return (
                        <li key={row.line} className="flex items-start gap-2.5 px-3 py-2">
                          {Icon && (
                            <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', meta.tone)} aria-hidden />
                          )}
                          <span className="w-9 shrink-0 pt-px text-xs tabular-nums text-ink-subtle">
                            L{row.line}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">
                              {row.home} <span className="text-ink-subtle">—</span> {row.away}
                              {row.homeScore != null && (
                                <span className="ml-2 font-semibold tabular-nums">
                                  {row.homeScore}–{row.awayScore}
                                </span>
                              )}
                            </span>
                            <span className={cn('block text-xs', meta.tone)}>
                              {row.message ?? meta.label}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!applied && report.totals.error > 0 && (
                <p className="text-xs text-ink-muted">
                  Les lignes en problème seront ignorées ; les autres seront enregistrées.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {applied ? (
              <Button variant="primary" onClick={() => onOpenChange(false)}>
                Terminé
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                {report ? (
                  <Button
                    variant="primary"
                    onClick={() => run(false)}
                    disabled={importResults.isPending || willWrite === 0}
                  >
                    {importResults.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                        Enregistrement…
                      </>
                    ) : (
                      `Enregistrer ${willWrite} ligne${willWrite > 1 ? 's' : ''}`
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => run(true)}
                    disabled={!file || importResults.isPending}
                  >
                    {importResults.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                        Lecture…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-1.5 h-4 w-4" aria-hidden />
                        Vérifier le fichier
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
