'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { SportType } from '@/schemas';
import { getSportIcon } from './getSportIcon';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { cn } from '@/utils';

/**
 * Choosing a sport, as three buttons rather than a dropdown of eleven.
 *
 * Every sport stays selectable — staying multi-sport is a settled decision — but the three shown
 * as cards are the three with real entries in the backend's sport rules defaults. The other
 * eight currently inherit football-shaped scoring, so putting them behind "Autre sport" is not
 * only faster for the leagues we are actually launching to, it is honest about which choices the
 * product has real opinions on.
 *
 * The dropdown it replaces made picking basketball — the answer for nearly every organiser who
 * will see this screen — a two-tap hunt through a list.
 */

const FEATURED: { value: SportType; label: string }[] = [
  { value: SportType.BASKETBALL, label: 'Basketball' },
  { value: SportType.FOOTBALL, label: 'Football' },
  { value: SportType.VOLLEYBALL, label: 'Volleyball' },
];

const FEATURED_VALUES = new Set<string>(FEATURED.map((s) => s.value));

function prettify(sport: string): string {
  return sport.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

export function SportPicker({
  value,
  onChange,
  invalid = false,
}: {
  value?: string;
  onChange: (sport: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const otherSelected = value !== undefined && !FEATURED_VALUES.has(value);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {FEATURED.map((sport) => {
          const Icon = getSportIcon(sport.value);
          const selected = value === sport.value;
          return (
            <button
              key={sport.value}
              type="button"
              onClick={() => onChange(sport.value)}
              aria-pressed={selected}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3.5 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                selected
                  ? 'border-accent bg-accent-soft text-accent-text'
                  : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
                invalid && !selected && 'border-negative/40',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-xs font-medium">{sport.label}</span>
            </button>
          );
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-haspopup="listbox"
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-colors',
              'hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              otherSelected
                ? 'border-accent bg-accent-soft text-accent-text'
                : 'border-line bg-surface text-ink-subtle',
            )}
          >
            <span className="truncate">
              {otherSelected ? prettify(value!) : 'Autre sport…'}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-line" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un sport…" />
            <CommandList>
              <CommandEmpty>Aucun sport trouvé.</CommandEmpty>
              <CommandGroup>
                {/* The three cards above are not repeated here: offering the same choice twice
                    in one control makes the list look like it does not know what it already
                    showed. */}
                {Object.values(SportType)
                  .filter((sport) => !FEATURED_VALUES.has(sport))
                  .map((sport) => {
                  const Icon = getSportIcon(sport);
                  return (
                    <CommandItem
                      key={sport}
                      value={prettify(sport)}
                      onSelect={() => {
                        onChange(sport);
                        setOpen(false);
                      }}
                      className="gap-2.5"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span className="flex-1 truncate">{prettify(sport)}</span>
                      {value === sport && <Check className="h-4 w-4 shrink-0 opacity-80" aria-hidden />}
                    </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
