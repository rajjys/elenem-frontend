'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils';

/**
 * A native select wearing the design system.
 *
 * The bare `<select>` this replaces rendered whatever the operating system felt like — its own
 * font, its own arrow, its own height — sitting beside inputs that had all been carefully given
 * tokens. Keeping the native element (rather than reaching for a combobox) is deliberate for
 * short, known lists: it costs no JavaScript, and on a phone it opens the platform picker, which
 * is faster than anything we would build.
 *
 * So: token colours, our chevron, the same 2.25rem height as the other controls, and the browser's
 * own arrow removed so there are not two.
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** The "all" row, rendered as an empty value. */
  placeholder: string;
  /** Accessible name — these sit in a filter bar with no visible label. */
  label: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-full appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 text-sm text-ink',
          'transition-colors hover:border-line-strong',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          value ? 'text-ink' : 'text-ink-muted',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden
      />
    </div>
  );
}
