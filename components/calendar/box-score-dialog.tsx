'use client';

import { Button, Modal } from '@/components/ui';
import { BoxScoreSheet } from '@/components/game/box-score-sheet';
import type { CalendarEntry } from '@/services/calendar';

/**
 * The scoresheet, in a dialog, for the calendar.
 *
 * All of it — the columns, the reconciliation, adding a name that is not on the roster yet — lives
 * in `BoxScoreSheet`, because the match's own page renders the same thing inline where there is
 * room for it. What is left here is the frame: on the calendar the sheet is opened from a day
 * panel that is itself only 22rem wide, so it has to overlay rather than expand.
 */
export function BoxScoreDialog({
  open,
  onClose,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  entry: CalendarEntry | null;
}) {
  if (!entry) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Feuille de match"
      className="max-w-3xl"
    >
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        {entry.home.name} <span className="text-ink-subtle">—</span> {entry.away.name}
      </p>

      <BoxScoreSheet
        gameId={entry.id}
        active={open}
        onSaved={onClose}
        footerSlot={
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        }
      />
    </Modal>
  );
}
