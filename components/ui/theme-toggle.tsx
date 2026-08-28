'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme, type Theme } from '@/components/providers/theme-provider';
import { cn } from '@/utils/cn';

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Clair' },
  { value: 'dark', icon: Moon, label: 'Sombre' },
];

/**
 * Two positions, no "system".
 *
 * The device preference still decides where a first-time visitor lands — it is the starting
 * value, not a third choice to render. Once someone picks a side it sticks, which is what people
 * expect from a control that shows a sun and a moon.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Apparence"
      className={cn('inline-flex rounded-full bg-surface-sunk p-0.5', className)}
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'rounded-full p-1.5 transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
              active
                ? 'bg-elevated text-ink shadow-e1'
                : 'text-ink-subtle hover:text-ink-muted',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
