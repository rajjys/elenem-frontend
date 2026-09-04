'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { BoxScoreSheet } from '@/components/game/box-score-sheet';
import type { CalendarEntry } from '@/services/calendar';

/**
 * The scoresheet, in a dialog, for the calendar.
 *
 * All of it — the columns, the appearances, the reconciliation, adding a name that is not on the
 * roster yet — lives in `BoxScoreSheet`, because the match's own page renders the same thing
 * inline where there is room for it. What is left here is the frame: on the calendar the sheet is
 * opened from a day panel only 22rem wide, so it has to overlay rather than expand.
 *
 * The one thing the frame owes it is a **pinned action row**. A twelve-player roster runs past the
 * bottom of the dialog, and the buttons were at the end of the scroll — so committing what you had
 * just typed meant scrolling back past all of it. The sheet hands its footer up and the modal pins
 * it below the scrolling body.
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
  const [footer, setFooter] = useState<React.ReactNode>(null);

  if (!entry) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Feuille de match"
      className="max-w-3xl"
      footer={footer}
    >
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        {entry.home.name} <span className="text-ink-subtle">—</span> {entry.away.name}
      </p>

      <BoxScoreSheet
        gameId={entry.id}
        active={open}
        renderFooter={setFooter}
        footerSlot={
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        }
      />
    </Modal>
  );
}
