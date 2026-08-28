'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * A fast tooltip that survives the sidebar.
 *
 * Two constraints made the obvious implementation wrong:
 *
 *  - The nav column is a scroll container (`overflow-y-auto`), and the rail is 5rem wide. Anything
 *    absolutely positioned inside it gets clipped, so an in-flow tooltip simply never appeared
 *    when the sidebar was docked. This renders into a portal with `position: fixed`, which escapes
 *    every clipping and stacking context above it.
 *  - Wrapping the trigger in a positioned `<div>` changed the sidebar's flex layout. The wrapper
 *    here is `display: contents`, so it participates in no layout at all — the child sits in the
 *    flex column exactly as if the tooltip were not there.
 *
 * The native `title` attribute waits about a second, which is far too slow when the label is the
 * only thing distinguishing one icon from the next.
 */
export function Tooltip({
  label,
  children,
  side = 'right',
  disabled,
  delay = 120,
}: {
  label: string;
  children: React.ReactNode;
  side?: 'right' | 'top';
  disabled?: boolean;
  delay?: number;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const id = useId();

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // The trigger is `display: contents`, so measure the element that actually renders.
      const el = (anchor.current?.firstElementChild ?? anchor.current) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCoords(
        side === 'right'
          ? { top: r.top + r.height / 2, left: r.right + 8 }
          : { top: r.top - 8, left: r.left + r.width / 2 },
      );
    }, delay);
  }, [delay, side]);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCoords(null);
  }, []);

  if (disabled) return <>{children}</>;

  return (
    <>
      <span
        ref={anchor}
        style={{ display: 'contents' }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={coords ? id : undefined}
      >
        {children}
      </span>
      {coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: side === 'right' ? 'translateY(-50%)' : 'translate(-50%, -100%)',
            }}
            className="pointer-events-none z-[100] whitespace-nowrap rounded-md border border-line bg-elevated px-2 py-1 text-xs font-medium text-ink shadow-e2"
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}
