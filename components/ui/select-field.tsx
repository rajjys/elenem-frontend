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
  if (process.env.NODE_ENV !== 'production') {
    const offender = options.find((o) => o.value === '');
    if (offender) {
      throw new Error(
        `SelectField: an option cannot have value "" (« ${offender.label} »). ` +
          'The "all" row is rendered from `placeholder` and already maps to the empty string — ' +
          'drop the option and pass its label as the placeholder instead.',
      );
    }
  }

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
        {/* The "all" row is this component's, not the caller's.
            
            Passing `{ value: '', label: '…' }` in `options` as well is a Radix crash — an empty
            value is how a Select is *cleared*, so an item carrying one is indistinguishable from
            no selection and the whole screen is replaced by an error boundary. It has been written
            twice by people who could not see this file from theirs, so it is caught here, loudly,
            in development, instead of at the next reader's expense. */}
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
