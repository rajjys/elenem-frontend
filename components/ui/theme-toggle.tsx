'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeChoice } from '@/components/providers/theme-provider';

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Clair' },
  { value: 'dark', icon: Moon, label: 'Sombre' },
  { value: 'system', icon: Monitor, label: 'Système' },
];

/**
 * Three-state theme control.
 *
 * "System" is a real option, not a fallback: most people never touch this, and following their
 * phone is the right default for a results site that gets checked in bed as often as at a desk.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { choice, setChoice } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Thème"
      className={`inline-flex rounded-md border border-line bg-surface p-0.5 ${className}`}
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setChoice(value)}
            className={`rounded-sm p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
              active
                ? 'bg-accent-soft text-accent-text'
                : 'text-ink-subtle hover:text-ink-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
