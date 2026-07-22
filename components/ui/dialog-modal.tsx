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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-xl focus:outline-none',
            className,
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-gray-900">{title}</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
