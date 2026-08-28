'use client';

import { useId, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

/**
 * A fast tooltip.
 *
 * The native `title` attribute waits roughly a second before appearing, which is far too slow for
 * a collapsed sidebar where the label is the *only* way to tell one icon from another — you end
 * up hovering and waiting on every item. This shows in 150ms and hides immediately.
 *
 * Rendered as a sibling rather than a portal so it inherits the sidebar's stacking context; the
 * rail is narrow, so `side="right"` is the default.
 */
export function Tooltip({
  label,
  children,
  side = 'right',
  disabled,
  delay = 150,
}: {
  label: string;
  children: React.ReactNode;
  side?: 'right' | 'top';
  disabled?: boolean;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  if (disabled) return <>{children}</>;

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <div aria-describedby={open ? id : undefined}>{children}</div>
      {open && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-line bg-elevated px-2 py-1 text-xs font-medium text-ink shadow-e2',
            side === 'right'
              ? 'left-full top-1/2 ml-2 -translate-y-1/2'
              : 'bottom-full left-1/2 mb-2 -translate-x-1/2',
          )}
        >
          {label}
        </div>
      )}
    </div>
  );
}
