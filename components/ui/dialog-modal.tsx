'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/utils';

// Accessible modal (radix Dialog): focus trap, ESC + click-outside to close,
// scroll-locked. Title is required for accessibility.
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Usually a string. A node when part of it should read quieter, like a date beside the verb. */
  title: ReactNode;
  /**
   * A line under the title, in the header rather than the body.
   *
   * Callers used to put it at the top of the body and pull it up with a negative margin, which
   * tucked it under the header's edge — the body scrolls, and its top is a clipping line. Here it
   * never scrolls away, and it is the dialog's accessible description.
   */
  description?: ReactNode;
  children: ReactNode;
  /**
   * Pinned below the scrolling body rather than at the end of it.
   *
   * Without this the whole dialog scrolls, so on a long form — a twelve-player scoresheet — the
   * buttons sit below the fold and the reader has to scroll past everything they just typed to
   * find the one control that commits it. Omit it and the dialog behaves exactly as before.
   */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* The scrim reads from the ink token rather than raw black, so it stays a dimming of
            *this* page in both themes instead of a grey wash over the dark one. */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[1px]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-line bg-surface shadow-e2 focus:outline-none',
            className,
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div className="min-w-0">
              <Dialog.Title className="text-xl font-semibold text-ink">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 text-sm text-ink-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded p-1 text-ink-subtle hover:bg-surface-sunk hover:text-ink-muted" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className={cn('min-h-0 flex-1 overflow-y-auto px-6', footer ? 'pb-4' : 'pb-6')}>
            {children}
          </div>
          {footer && (
            <div className="shrink-0 border-t border-line bg-surface px-6 py-4">{footer}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
