'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeChoice } from '@/components/providers/theme-provider';

const NEXT: Record<ThemeChoice, ThemeChoice> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const FACE: Record<ThemeChoice, { icon: typeof Sun; label: string }> = {
  system: { icon: Monitor, label: 'Thème : système' },
  light: { icon: Sun, label: 'Thème : clair' },
  dark: { icon: Moon, label: 'Thème : sombre' },
};

/**
 * One button, not three.
 *
 * It starts on "system" and shows the monitor icon; each click advances
 * system → light → dark → system, and the icon becomes whichever mode is active. A segmented
 * three-way control spent a lot of header width on a setting most people touch once, and made
 * "system" look like a third colour scheme rather than the default it is.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { choice, setChoice } = useTheme();
  const { icon: Icon, label } = FACE[choice];

  return (
    <button
      type="button"
      onClick={() => setChoice(NEXT[choice])}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
