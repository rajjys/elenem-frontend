'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDownloadResultsSheet, useSeasonsForDownload } from '@/services/calendar';
import { getApiErrorMessage } from '@/services/api';
import { cn } from '@/utils';

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
export function ResultsSheetButton({ leagueId }: { leagueId?: string }) {
  const [open, setOpen] = useState(false);
  const seasons = useSeasonsForDownload(leagueId);
  const download = useDownloadResultsSheet();

  const rows = seasons.data?.data ?? [];

  async function grab(seasonId: string) {
    try {
      await download.mutateAsync(seasonId);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Le fichier n'a pas pu être téléchargé."));
    }
  }

  // One season needs no menu — asking somebody to choose between one thing is a step, not a choice.
  if (rows.length === 1) {
    return (
      <Button variant="ghost" onClick={() => grab(rows[0].id)} disabled={download.isPending}>
        {download.isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileSpreadsheet className="mr-1.5 h-4 w-4" aria-hidden />
        )}
        Feuille de résultats
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" disabled={seasons.isPending || rows.length === 0}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" aria-hidden />
          Feuille de résultats
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 border-line p-1">
        <p className="px-2 py-1.5 text-xs text-ink-subtle">
          Une feuille par compétition, déjà remplie avec les matchs connus.
        </p>
        <ul>
          {rows.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => grab(s.id)}
                disabled={download.isPending}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                  'hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                )}
              >
                <Download className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink">{s.league?.name ?? 'Compétition'}</span>
                  <span className="block truncate text-xs text-ink-subtle">{s.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
