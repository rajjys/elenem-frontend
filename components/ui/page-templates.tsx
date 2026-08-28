'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import { PageHeader, type PageAction } from './page-header';
import { LoadingSpinner } from './loading-spinner';
import { ErrorState } from './error-state';
import { Pagination } from './pagination';
import { Button } from './button';
import { cn } from '@/utils/cn';

/**
 * The three shapes every dashboard screen takes.
 *
 * Consistency comes from screens *being instances of a template*, not from each author
 * remembering the conventions. Before these, a list page invented its own header, its own empty
 * state, its own loading text ("Loading leagues…" in English under a French sidebar) and its own
 * CTA styling — which is how the same product ended up with a green button on one screen and a
 * blue one on its sibling.
 */

// --- Empty state -------------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: PageAction;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-ink-subtle" aria-hidden="true" />
      <p className="font-medium text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && (
        <Button variant="primary" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// --- ListPage ----------------------------------------------------------------

/**
 * Header, optional filters, then exactly one of: loading, error, empty, or content.
 * Making those four states mutually exclusive here is what stops a page rendering an empty table
 * while a request is still in flight — the "Aucune ligue trouvée" flash before data arrives.
 */
export function ListPage({
  title,
  description,
  action,
  secondaryAction,
  filters,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  empty,
  children,
  page,
  totalPages,
  onPageChange,
}: {
  title: string;
  description?: React.ReactNode;
  action?: PageAction;
  secondaryAction?: PageAction;
  filters?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  empty?: React.ReactNode;
  children: React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title={title} description={description} action={action} secondaryAction={secondaryAction}>
        {filters}
      </PageHeader>

      {isError ? (
        <ErrorState title="Impossible de charger ces données." reset={onRetry} />
      ) : isLoading ? (
        <div className="py-20">
          <LoadingSpinner />
        </div>
      ) : isEmpty ? (
        empty ?? <EmptyState title="Rien à afficher pour le moment." />
      ) : (
        <>
          {children}
          {typeof page === 'number' && typeof totalPages === 'number' && totalPages > 1 && onPageChange && (
            <div className="mt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- DetailPage --------------------------------------------------------------

/**
 * An identity header, then panels. `aside` is for the summary rail that sits beside the main
 * content on wide screens and stacks underneath on a phone.
 */
export function DetailPage({
  title,
  description,
  action,
  secondaryAction,
  isLoading,
  isError,
  onRetry,
  tabs,
  aside,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  action?: PageAction;
  secondaryAction?: PageAction;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  tabs?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (isError) return <ErrorState title="Impossible de charger cette page." reset={onRetry} />;
  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader title={title} description={description} action={action} secondaryAction={secondaryAction}>
        {tabs}
      </PageHeader>
      <div className={cn('grid gap-6', aside && 'lg:grid-cols-[minmax(0,1fr)_320px]')}>
        <div className="min-w-0 space-y-6">{children}</div>
        {aside && <aside className="space-y-6">{aside}</aside>}
      </div>
    </div>
  );
}

// --- FormPage ----------------------------------------------------------------

/**
 * A single measured column with the actions pinned to the bottom of the viewport.
 *
 * Sticky actions matter more than they sound on the screens that matter here: a roster or a
 * league form on a laptop is long enough that "Enregistrer" scrolls out of sight, and an
 * organiser who cannot see the save button assumes the form is broken.
 */
export function FormPage({
  title,
  description,
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  isSubmitting,
  isError,
  children,
  footerNote,
}: {
  title: string;
  description?: React.ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isError?: boolean;
  children: React.ReactNode;
  footerNote?: React.ReactNode;
}) {
  return (
    <form
      className="mx-auto w-full max-w-3xl pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <PageHeader title={title} description={description} />
      {isError && (
        <div className="mb-4 rounded-md border border-negative bg-negative-soft px-4 py-3 text-sm text-negative">
          Le formulaire n&apos;a pas pu être enregistré. Vérifiez les champs et réessayez.
        </div>
      )}
      <div className="space-y-6">{children}</div>

      <div className="sticky bottom-0 -mx-6 mt-8 flex items-center justify-end gap-2 border-t border-line bg-surface/95 px-6 py-3 backdrop-blur">
        {footerNote && <p className="mr-auto text-sm text-ink-muted">{footerNote}</p>}
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        )}
        <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
