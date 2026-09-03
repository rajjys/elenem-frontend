'use client';

import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';

/**
 * A fast tooltip that survives the sidebar, the grid edge, and the bottom of the window.
 *
 * Three constraints made the obvious implementation wrong:
 *
 *  - The nav column is a scroll container (`overflow-y-auto`) and the rail is 5rem wide, so
 *    anything absolutely positioned inside it gets clipped. This renders into a portal with
 *    `position: fixed`, which escapes every clipping and stacking context above it.
 *  - Wrapping the trigger in a positioned `<div>` changed the sidebar's flex layout. The wrapper
 *    here is `display: contents`, so it participates in no layout at all.
 *  - **A fixed side is a promise the viewport does not keep.** The first version always drew
 *    above the trigger at its left edge, which is fine in the middle of a page and wrong at every
 *    boundary: on the calendar's month grid the fixture tooltips were cut off against the right
 *    column and the top row, showing half a sentence. It now measures itself, flips to the
 *    opposite side when the preferred one does not fit, and slides along the other axis to stay
 *    inside the window.
 *
 * The native `title` attribute waits about a second, which is far too slow when the label is the
 * only thing distinguishing one icon from the next — and it renders as operating-system chrome in
 * the middle of a product that has spent real effort not looking like that.
 */

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

/** Breathing room between the trigger and the tooltip, and between the tooltip and the window. */
const GAP = 8;
const MARGIN = 8;

function place(
  trigger: DOMRect,
  size: { width: number; height: number },
  side: TooltipSide,
): { top: number; left: number; side: TooltipSide } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const fits: Record<TooltipSide, boolean> = {
    top: trigger.top - size.height - GAP >= MARGIN,
    bottom: trigger.bottom + size.height + GAP <= vh - MARGIN,
    left: trigger.left - size.width - GAP >= MARGIN,
    right: trigger.right + size.width + GAP <= vw - MARGIN,
  };
  const opposite: Record<TooltipSide, TooltipSide> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };

  // Flip only when the preferred side genuinely has no room; if neither side does, keep the
  // preferred one and let the clamp below do what it can.
  const chosen = fits[side] ? side : fits[opposite[side]] ? opposite[side] : side;

  let top: number;
  let left: number;
  if (chosen === 'top' || chosen === 'bottom') {
    top = chosen === 'top' ? trigger.top - size.height - GAP : trigger.bottom + GAP;
    left = trigger.left + trigger.width / 2 - size.width / 2;
  } else {
    left = chosen === 'left' ? trigger.left - size.width - GAP : trigger.right + GAP;
    top = trigger.top + trigger.height / 2 - size.height / 2;
  }

  // Slide along the cross axis rather than overflowing. A tooltip half off the screen says less
  // than no tooltip at all.
  left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, vw - size.width - MARGIN));
  top = Math.min(Math.max(top, MARGIN), Math.max(MARGIN, vh - size.height - MARGIN));

  return { top, left, side: chosen };
}

export function Tooltip({
  label,
  children,
  side = 'right',
  disabled,
  delay = 120,
  contentClassName,
}: {
  /** Text, or a whole panel — the calendar's fixture card is one of these. */
  label: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  delay?: number;
  /** Width and padding for the richer ones; the default is a single line of text. */
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const id = useId();

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    setCoords(null);
  }, []);

  /**
   * Measured after it renders, not guessed before.
   *
   * The size depends on the content — a one-word label and a fixture card need different
   * decisions about which side fits — so the first paint is invisible, the real box is measured,
   * and the position follows. `useLayoutEffect` means that happens before the browser paints, so
   * nothing is ever seen in the wrong place.
   */
  useLayoutEffect(() => {
    if (!open) return;
    // The trigger is `display: contents`, so measure the element that actually renders.
    const el = (anchor.current?.firstElementChild ?? anchor.current) as HTMLElement | null;
    const box = bubble.current;
    if (!el || !box) return;
    const r = el.getBoundingClientRect();
    const { top, left } = place(r, { width: box.offsetWidth, height: box.offsetHeight }, side);
    setCoords({ top, left });
  }, [open, side, label]);

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
        aria-describedby={open ? id : undefined}
      >
        {children}
      </span>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={bubble}
            id={id}
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              // Invisible for the one frame it takes to measure, rather than flashing at 0,0.
              visibility: coords ? 'visible' : 'hidden',
            }}
            className={cn(
              'pointer-events-none z-[100] rounded-md border border-line bg-elevated text-ink shadow-e2',
              contentClassName ?? 'whitespace-nowrap px-2 py-1 text-xs font-medium',
            )}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}
