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
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
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
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-e2 focus:outline-none',
            className,
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-ink">{title}</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-ink-subtle hover:bg-surface-sunk hover:text-ink-muted" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
