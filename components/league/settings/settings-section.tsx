'use client';

import { cn } from '@/utils';

/**
 * One settings card: what it governs, the controls, and the action that commits them.
 *
 * The shape is deliberate and borrowed from every settings screen that works. **A section is the
 * unit of saving**, not the page — a competition's name and its visibility are different decisions,
 * and one Save at the foot of a two-column grid makes every change a change of everything, so a
 * reader who came to fix a typo cannot tell what else they are about to commit.
 *
 * The footer is a separate band on a sunk background rather than a button floating after the last
 * field, because that band is what says *this is where this section ends*. It also gives the
 * explanation somewhere to live beside the button that needs it, instead of below it where it reads
 * as a note about the next section.
 */
export function SettingsSection({
  title,
  description,
  children,
  footer,
  tone = 'default',
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** The commit row. Omit on a section that only reads. */
  footer?: React.ReactNode;
  /** `danger` for the irreversible ones — a red edge is the only warning read before the click. */
  tone?: 'default' | 'danger';
  className?: string;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border bg-surface',
        tone === 'danger' ? 'border-negative/40' : 'border-line',
        className,
      )}
    >
      <div className="px-5 py-5">
        <h2
          className={cn(
            'text-base font-semibold',
            tone === 'danger' ? 'text-negative' : 'text-ink',
          )}
        >
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>

      {footer && (
        <div
          className={cn(
            'border-t px-5 py-3.5',
            tone === 'danger'
              ? 'border-negative/30 bg-negative-soft/40'
              : 'border-line bg-surface-sunk',
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}
