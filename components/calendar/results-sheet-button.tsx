'use client';

import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip } from '@/components/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDownloadResultsSheet, useSeasonsForDownload } from '@/services/calendar';
import { getApiErrorMessage } from '@/services/api';
import { ImportResultsDialog } from './import-results-dialog';

/**
 * Downloads the season's calendar and results as a spreadsheet.
 *
 * The first operator at LIPROBAKIN is a community manager who receives results on paper or in a
 * WhatsApp photo and does not decide the fixture list. This is the artefact built for him: a
 * sheet with every known matchup and date already filled in, two empty score columns, and the
 * exact team spellings on a second tab. He fills it in and sends it back.
 *
 * It is also something we can hand a league before Elenem does anything else for them, which is
 * why it exists before the importer that reads it.
 */
export function ResultsSheetButton({
  leagueId,
  compact = false,
}: {
  leagueId?: string;
  /**
   * Icon only, with a tooltip.
   *
   * The spreadsheet round trip is occasional — you reach for it at the end of a matchday, not
   * while reading the calendar — and a labelled button was a third box competing with the two
   * controls that are used constantly. The icon keeps it one click away without spending the
   * width on it.
   */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Rendered only after mount. Radix derives the popover's aria-controls id from the tree, and
  // the server's tree does not match the client's here — the seasons query has no data during
  // SSR — so hydration warned about a mismatched attribute on every calendar load. Nothing on
  // this control is needed for first paint, so not rendering it server-side is the honest fix
  // rather than suppressing the warning.
  const [mounted, setMounted] = useState(false);
  const [importing, setImporting] = useState<{ id: string; label: string } | null>(null);
  useEffect(() => setMounted(true), []);
  const seasons = useSeasonsForDownload(leagueId);
  const download = useDownloadResultsSheet();

  const rows = seasons.data?.data ?? [];

  if (!mounted) return null;

  async function grab(seasonId: string) {
    try {
      await download.mutateAsync(seasonId);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Le fichier n'a pas pu être téléchargé."));
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        {/* The tooltip wraps the trigger rather than its button: `asChild` hands the ref to a
            single element, and a tooltip renders its bubble alongside the trigger. Our own
            tooltip and not `title`, which waits a second and arrives as operating-system chrome —
            the one thing on a row of our own icons that looks borrowed. */}
        {compact ? (
          <Tooltip label="Feuille de résultats — télécharger ou importer" side="bottom">
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={seasons.isPending || rows.length === 0}
                aria-label="Feuille de résultats"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden />
              </button>
            </PopoverTrigger>
          </Tooltip>
        ) : (
          <PopoverTrigger asChild>
            <Button variant="ghost" disabled={seasons.isPending || rows.length === 0}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" aria-hidden />
              Feuille de résultats
            </Button>
          </PopoverTrigger>
        )}
        <PopoverContent align="end" className="w-80 border-line p-1">
          <p className="px-2 py-1.5 text-xs text-ink-subtle">
            Téléchargez la feuille, remplissez les scores, renvoyez-la.
          </p>
          <ul className="space-y-0.5">
            {rows.map((s) => (
              <li key={s.id} className="rounded-md px-2 py-1.5 hover:bg-surface-sunk">
                <p className="truncate text-sm text-ink">{s.league?.name ?? 'Compétition'}</p>
                <p className="truncate text-xs text-ink-subtle">{s.name}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => grab(s.id)}
                    disabled={download.isPending}
                    className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-accent-text transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {download.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Télécharger
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImporting({ id: s.id, label: `${s.league?.name ?? ''} — ${s.name}`.trim() });
                      setOpen(false);
                    }}
                    className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden />
                    Importer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      {importing && (
        <ImportResultsDialog
          open
          onOpenChange={(next) => !next && setImporting(null)}
          seasonId={importing.id}
          seasonLabel={importing.label}
        />
      )}
    </>
  );
}
