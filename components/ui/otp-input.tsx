'use client';

import * as React from 'react';
import { cn } from '@/utils';

// A single clean 6-digit code field. Numeric-only, monospace, evenly spaced and
// visually centered (the indent compensates the trailing letter-spacing).
interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({ value, onChange, autoFocus, className }: OtpInputProps) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      aria-label="Code à 6 chiffres"
      className={cn(
        'block w-full rounded-md border border-line bg-surface px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] indent-[0.5em] text-ink shadow-sm placeholder:text-ink-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
        className,
      )}
    />
  );
}
