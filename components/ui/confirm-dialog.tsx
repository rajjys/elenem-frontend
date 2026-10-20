'use client';

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from './alert-dialog';
import { Button } from './button';
import { getApiErrorMessage } from '@/services/api';

/**
 * A confirmation for a consequential action.
 *
 * Two things it did wrong, for every caller at once (`RESOURCE_DELETION.md` §5):
 *
 * - **It closed before the request finished.** The action button closes the dialog on click, and
 *   callers fired the request and forgot it — so nothing showed it running, a refusal arrived as a
 *   toast after the dialog had gone, and the same request could be sent twice. Now `onConfirm` may
 *   return a promise: the dialog then stays open, the button spins, a refusal is written inside the
 *   dialog in the API's words, and only success closes it. A caller that returns nothing behaves as
 *   before.
 * - **Every button was green**, « Supprimer » included. `tone="danger"` makes it red, for actions
 *   that destroy or cut something off; the default is the product's accent.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  tone = 'default',
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<unknown>;
  tone?: 'default' | 'danger';
  /** For a confirmation that needs something first: a reason, a typed name. */
  confirmDisabled?: boolean;
  /** Anything the confirmation needs between the description and the buttons. */
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  function confirm(event: MouseEvent) {
    const result = onConfirm();
    if (!result || typeof (result as Promise<unknown>).then !== 'function') return;
    // Kept open until the answer: preventing the default stops the action closing the dialog.
    event.preventDefault();
    setBusy(true);
    setError(null);
    (result as Promise<unknown>)
      .then(() => onOpenChange(false))
      .catch((e) => setError(getApiErrorMessage(e, 'L’action n’a pas abouti. Réessayez.')))
      .finally(() => setBusy(false));
  }

  return (
    // Not closable while the request runs: Escape or a click outside would hide a request that is
    // still going, which is the confusion this dialog exists to remove.
    <AlertDialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        {error && (
          <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogPrimitive.Action asChild onClick={confirm}>
            <Button
              variant="primary"
              isLoading={busy}
              disabled={busy || confirmDisabled}
              className={
                tone === 'danger' ? 'mt-2 bg-negative text-ink-inverted hover:bg-negative/90 sm:mt-0' : 'mt-2 sm:mt-0'
              }
            >
              {confirmLabel}
            </Button>
          </AlertDialogPrimitive.Action>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
