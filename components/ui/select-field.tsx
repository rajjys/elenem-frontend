'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/utils';

/**
 * The app's dropdown.
 *
 * This used to be a styled native `<select>`, and the argument for keeping it was that a phone
 * opens the platform picker, which is faster than anything we would build. That argument dies on
 * the theme switch: a native list follows the *operating system*, so an organiser who sets Elenem
 * to dark while macOS is light gets a white list dropped over a dark page, and none of the token
 * work reaches inside it. The trigger was ours and the part that actually opened was not.
 *
 * So: Radix underneath — already a dependency, already used by the dialog — and the same API as
 * before, because every call site was written against it.
 *
 * One wrinkle worth naming: Radix reserves the empty string, so the "all" row cannot literally be
 * `value=""`. It carries a sentinel that is translated at the boundary, and callers still see the
 * empty string they always did.
 */

/** Radix refuses `value=""` on an item; the "all" row needs a value that is not nothing. */
const ALL = '__all__';

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
  id,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** The "all" row, rendered as an empty value. */
  placeholder: string;
  /** Accessible name — these sit in a filter bar with no visible label. */
  label: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value === '' ? ALL : value}
      onValueChange={(next) => onChange(next === ALL ? '' : next)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(className, value === '' && 'text-ink-muted')}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
