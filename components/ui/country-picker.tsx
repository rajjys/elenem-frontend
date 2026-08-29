'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { countryCodeToName, countryNameToCode } from '@/utils/country-utils';
import { cn } from '@/utils';

/**
 * Country names in French, from the platform rather than a translated data file.
 *
 * `countryNameToCode` is keyed by English names ("Congo, the Democratic Republic of the"), which
 * is the wrong language for this product and, in that particular case, longer than the field.
 * Intl.DisplayNames gives "République démocratique du Congo" with no list to maintain and no
 * list to fall out of date. Falls back to the English name where a browser cannot answer.
 */
const displayNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['fr'], { type: 'region' })
    : undefined;

function nameFor(code: string, fallback: string): string {
  try {
    return displayNames?.of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * A country field that belongs to this design system, and that stores what the API wants.
 *
 * It replaces `react-country-region-selector`, which rendered a bare `<select>` — native
 * chrome, no token colours, no search through ~195 options, and a different shape in every
 * browser. It also emitted a display name while the API validates and stores ISO-3166 alpha-2,
 * which meant organisation creation from a browser failed on every attempt.
 *
 * The value is always the two-letter code. Searching matches the name and the code, so both
 * "Congo" and "CD" find the same row.
 */

/** Countries a Congolese league organiser is most likely to want, offered before the full list. */
const PINNED = ['CD', 'CG', 'RW', 'BI', 'UG', 'TZ', 'FR', 'BE'];

function flagFor(code: string): string {
  // Regional-indicator symbols: 'CD' -> 🇨🇩. Rendered by the OS, so no image request and no
  // sprite sheet to keep in sync with the country list.
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}

export function CountryPicker({
  value,
  onChange,
  id,
  placeholder = 'Choisissez un pays',
  invalid = false,
}: {
  /** ISO-3166 alpha-2, e.g. "CD". */
  value?: string;
  onChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const all = Object.entries(countryNameToCode)
      .map(([englishName, code]) => ({ name: nameFor(code, englishName), code }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const pinnedCodes = new Set(PINNED);
    const pinned = PINNED.map((code) => ({
      name: nameFor(code, countryCodeToName[code] ?? code),
      code,
    })).filter((o) => o.name);
    return { pinned, rest: all.filter((o) => !pinnedCodes.has(o.code)) };
  }, []);

  const selectedName = value
    ? nameFor(value.toUpperCase(), countryCodeToName[value.toUpperCase()] ?? value)
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-sm text-ink transition-colors',
            'hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent',
            invalid ? 'border-negative' : 'border-line',
          )}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            {value && <span className="text-base leading-none shrink-0">{flagFor(value)}</span>}
            <span className={cn('truncate', !selectedName && 'text-ink-subtle')}>
              {selectedName ?? placeholder}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 border-line"
        align="start"
      >
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Rechercher un pays…" />
          <CommandList>
            <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
            {[
              { key: 'pinned', heading: 'Fréquents', items: options.pinned },
              { key: 'rest', heading: 'Tous les pays', items: options.rest },
            ].map((group) => (
              <CommandGroup key={group.key} heading={group.heading}>
                {group.items.map((option) => (
                  <CommandItem
                    key={option.code}
                    // cmdk matches on this string, so both the name and the code are searchable.
                    value={`${option.name} ${option.code}`}
                    onSelect={() => {
                      onChange(option.code);
                      setOpen(false);
                    }}
                    className="gap-2.5"
                  >
                    <span className="text-base leading-none">{flagFor(option.code)}</span>
                    <span className="flex-1 truncate">{option.name}</span>
                    {value?.toUpperCase() === option.code && (
                      <Check className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
