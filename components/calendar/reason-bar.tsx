'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Undo2, X } from 'lucide-react';
import { cn } from '@/utils';

/**
 * "That landed. Why?"
 *
 * A drag has to commit the instant it is dropped or it is not worth doing, so the reason cannot be
 * asked for first — a dialog in front of every drag defeats the point of dragging. It is asked for
 * immediately afterwards instead, from a bar that appears where the drop happened, and written
 * onto the audit entries the change already produced. Same rows, not new ones: there was one
 * decision and the trail should read that way.
 *
 * One reason for the whole gesture, however many fixtures moved. Asking per fixture would turn a
 * one-second action into a form and be resented by the tenth reorder; asking for nothing would
 * lose the half people actually argue about — "moved to the 22nd" settles nothing without "the
 * hall was double-booked".
 *
 * `Sans raison` is a real button rather than a dismissal, because an organiser who genuinely has
 * no reason should be able to say so in one click instead of hunting for the way out.
 */
export function ReasonBar({
  summary,
  onSave,
  onSkip,
  onUndo,
  saving = false,
}: {
  /** What just happened, in one line. */
  summary: string;
  onSave: (reason: string) => void;
  onSkip: () => void;
  /** Offered on a single move, where reverting is one step. Absent for a reorder. */
  onUndo?: () => void;
  saving?: boolean;
}) {
  const [reason, setReason] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focused, but not stealing the page: the next thing an organiser wants to do is type.
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.trim()) onSave(reason.trim());
        else onSkip();
      }}
      // Stacked, not inline: this lives in a 22rem side panel, where a summary, a field and three
      // controls on one row leaves each of them a few characters wide.
      className={cn('space-y-2 border-t border-accent/30 bg-accent-soft px-4 py-3')}
    >
      <p className="text-xs leading-snug text-ink">{summary}</p>

      <input
        ref={inputRef}
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={300}
        placeholder="Raison (facultative)…"
        aria-label="Raison du déplacement"
        className="h-8 w-full rounded-md border border-line bg-surface px-2.5 text-xs text-ink transition-colors placeholder:text-ink-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />

      <div className="flex items-center gap-1">
        <button
          type="submit"
          disabled={saving}
          className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-accent px-2.5 text-xs font-medium text-accent-ink transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          {reason.trim() ? 'Enregistrer' : 'Sans raison'}
        </button>

        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            disabled={saving}
            title="Annuler le déplacement"
            className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            Annuler
          </button>
        )}

        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          aria-label="Fermer sans donner de raison"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </form>
  );
}
