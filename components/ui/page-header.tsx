import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/utils/cn';

/**
 * The top of every dashboard screen: title, optional count/description, and at most one primary
 * action on the right.
 *
 * The action lives here rather than being hand-rolled per page because it had drifted badly —
 * "Créer une Ligue" was a green pill, "Create New Game" a blue Button, "Nouvelle Equipe" an
 * outline, all on sibling screens. A page cannot get its primary action wrong if it never styles
 * one: it passes a label and a href, and the appearance is decided in exactly one place.
 */
export interface PageAction {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Defaults to a plus. Pass an icon component to override, or null for none. */
  icon?: React.ElementType | null;
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: PageAction;
  secondaryAction?: PageAction;
  /** Filters, tabs, or anything else that belongs under the title. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {(action || secondaryAction) && (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction && <ActionButton action={secondaryAction} variant="outline" />}
            {action && <ActionButton action={action} variant="primary" />}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}

function ActionButton({
  action,
  variant,
}: {
  action: PageAction;
  variant: 'primary' | 'outline';
}) {
  const Icon = action.icon === null ? null : (action.icon ?? Plus);
  const body = (
    <>
      {Icon && <Icon className="h-4 w-4" />}
      <span className="whitespace-nowrap">{action.label}</span>
    </>
  );

  if (action.href) {
    return (
      <Button variant={variant} asChild>
        <Link href={action.href}>{body}</Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {body}
    </Button>
  );
}
