'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { BoxScoreSheet } from './box-score-sheet';

/**
 * The scoresheet, in a dialog. **The only place it can be typed.**
 *
 * It used to live in `components/calendar/`, because the calendar was the only surface that opened
 * it — the match's own page rendered the same grid inline. That was the mistake this move corrects:
 * a page is for *reading* a match, and a twelve-row entry grid with an input in every cell is not
 * reading. It also read as broken for a club administrator, who cannot type a sheet and so got the
 * whole grid with every field disabled.
 *
 * So the grid is here and only here, and both surfaces reach it the same way: the calendar from its
 * day panel, the match page from the pencil on its report. « Modifier » is a decision you take, and
 * a modal is where a decision that can be cancelled belongs (`UI_CONVENTIONS` §1).
 *
 * The one thing the frame owes the sheet is a **pinned action row**. A twelve-player roster runs
 * past the bottom of the dialog, and the buttons were at the end of the scroll — so committing what
 * you had just typed meant scrolling back past all of it.
 */
export function BoxScoreDialog({
  open,
  onClose,
  gameId,
  homeName,
  awayName,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  gameId: string | null;
  homeName?: string;
  awayName?: string;
  onSaved?: () => void;
}) {
  const [footer, setFooter] = useState<React.ReactNode>(null);

  if (!gameId) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Feuille de match"
      className="max-w-3xl"
      footer={footer}
    >
      {(homeName || awayName) && (
        <p className="mb-4 text-sm text-ink-muted">
          {homeName} <span className="text-ink-subtle">—</span> {awayName}
        </p>
      )}

      <BoxScoreSheet
        gameId={gameId}
        active={open}
        onSaved={onSaved}
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
