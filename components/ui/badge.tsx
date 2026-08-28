import React from 'react';
import { cn } from '@/utils/cn';

/**
 * Status badge, built on the semantic tokens.
 *
 * The rule from the design direction: a colour appears only when it means something. So the
 * variants map onto three meanings — positive (it happened, it went well), negative (it failed or
 * was cancelled) and caution (it needs attention) — plus a neutral for everything else. The
 * previous version reached for eight different palettes (yellow, orange, slate, and a
 * `text-ink-subtle` that isn't even a real Tailwind shade) and referenced
 * `bg-primary`/`text-primary-foreground` tokens that were never defined.
 */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'outline'
  | 'unknown'
  | 'planning'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'canceled'
  | 'archived';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const NEUTRAL = 'bg-surface-sunk text-ink-muted border border-line';
const POSITIVE = 'bg-positive-soft text-positive border border-positive/25';
const NEGATIVE = 'bg-negative-soft text-negative border border-negative/25';
const CAUTION = 'bg-caution-soft text-caution border border-caution/25';
const ACCENT = 'bg-accent-soft text-accent-text border border-accent-line';

const variants: Record<BadgeVariant, string> = {
  default: ACCENT,
  secondary: NEUTRAL,
  outline: NEUTRAL,
  unknown: NEUTRAL,

  // In progress or upcoming — the organiser may still need to act.
  planning: CAUTION,
  paused: CAUTION,
  scheduled: ACCENT,

  // Settled, and settled well.
  success: POSITIVE,
  active: POSITIVE,

  // Settled, and it didn't happen.
  destructive: NEGATIVE,
  canceled: NEGATIVE,

  // Done and filed away — deliberately quiet.
  completed: NEUTRAL,
  archived: NEUTRAL,
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
