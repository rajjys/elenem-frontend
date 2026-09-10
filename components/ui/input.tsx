import { SearchIcon } from "lucide-react";
import React from "react";
import { toProperName } from "@/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  restrict?: 'alpha' | 'alphanumeric' | 'numeric' | 'year' | 'none';
  alphaFirst?: boolean;
  /**
   * 'name' tidies a proper noun when the field is left, not while it is being typed — typing
   * "MAsu" should not fight you at the second keystroke, but it should not be STORED that way
   * either. Acronyms survive: "BC LEbrOn" becomes "BC Lebron", not "Bc Lebron".
   */
  transform?: 'none' | 'uppercase' | 'capitalize' | 'name';
  allowSpace?: boolean;
  maxCharacters?: number;
  hint?: string;
  autoTrim?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      type = 'text',
      error,
      required,
      restrict = 'none',
      alphaFirst = false,
      transform = 'none',
      allowSpace = false,
      maxCharacters,
      hint,
      autoTrim = false,
      onChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const allowedControlKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End',
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (allowedControlKeys.includes(e.key)) {
        props.onKeyDown?.(e);
        return;
      }

      const isPrintable = e.key.length === 1;
      if (!isPrintable) {
        props.onKeyDown?.(e);
        return;
      }

      // AlphaFirst check
      if (alphaFirst && e.currentTarget.value.length === 0) {
        if (!/^\p{L}$/u.test(e.key)) {
          e.preventDefault();
          props.onKeyDown?.(e);
          return;
        }
      }

      // Restriction checks
      if (restrict === 'numeric') {
        if (!/^\d$/.test(e.key) && !(allowSpace && e.key === ' ')) e.preventDefault();
      } else if (restrict === 'alpha') {
        if (!/^[\p{L}]$/u.test(e.key) && !(allowSpace && e.key === ' ')) e.preventDefault();
      } else if (restrict === 'alphanumeric') {
        if (!/^[\p{L}\d]$/u.test(e.key) && !(allowSpace && e.key === ' ')) e.preventDefault();
      }

      props.onKeyDown?.(e);
    };

    const applyTransform = (value: string) => {
      if (transform === 'uppercase') return value.toUpperCase();
      if (transform === 'capitalize') {
        if (value.length === 0) return value;
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return value;
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (e.target.type !== "file") {
        if (alphaFirst) {
          value = value.replace(/^[^\p{L}]+/u, '');
        }

        if (restrict === 'numeric') {
          value = value.replace(allowSpace ? /[^\d\s]/g : /[^\d]/g, '');
        } else if (restrict === 'alpha') {
          value = value.replace(allowSpace ? /[^\p{L}\s]/gu : /[^\p{L}]/gu, '');
        } else if (restrict === 'alphanumeric') {
          value = value.replace(allowSpace ? /[^\p{L}\d\s]/gu : /[^\p{L}\d]/gu, '');
        }

        if ((type === 'number' || restrict === 'year') && maxCharacters !== undefined) {
          if (value.length > maxCharacters) value = value.slice(0, maxCharacters);
        }

        value = applyTransform(value);

        e.target.value = value;
      }

      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (e.target.type !== "file") {
        if (alphaFirst) {
          value = value.replace(/^[^\p{L}]+/u, '');
        }
        value = transform === 'name' ? toProperName(value) : applyTransform(value);
        if (autoTrim && value.trim() !== value) {
          value = value.trim();
        }
        e.target.value = value;
      }

      onBlur?.(e);
    };

    const isSearchType = type === 'search';

    return (
      <div className="">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-ink mb-1">
            {label}
            {required && <span className="text-negative ml-1">*</span>}
          </label>
        )}
        <div className={`relative ${isSearchType ? 'flex items-center' : ''}`}>
          {isSearchType && (
            <div className="absolute left-3">
              <SearchIcon className="h-5 w-5 text-ink-subtle" />
            </div>
          )}
          <input
            {...props}
            id={name}
            name={name}
            ref={ref}
            type={type}
            maxLength={maxCharacters}
            /**
             * `{...props}` goes FIRST, and that ordering is the whole bug.
             *
             * It used to be spread *after* this, so `className` was computed — base classes,
             * error border, the caller's addition — and then immediately overwritten by the raw
             * `props.className`. Every `<Input className="…">` in the app, sixty-odd of them,
             * therefore rendered with **only** the caller's classes: no border, no background, no
             * padding, no focus ring. The roster's search box passes `className="pl-9"`, which is
             * exactly how it became an unstyled field the browser was free to paint autofill
             * yellow. Giving the base its own colours last session made the fields that had no
             * className right and left these untouched, because the string was never reaching the
             * element.
             *
             * `bg-surface`/`text-ink` are not decoration either: without them a field has no
             * colour of its own and falls through to the user agent's — a white box on the dark
             * theme. Every state has to be a token, or the browser picks one for us.
             */
            className={`block w-full rounded-md border bg-surface px-3 py-2 text-ink shadow-sm placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-subtle sm:text-sm ${
              error ? 'border-negative' : 'border-line'
            } ${isSearchType ? 'pl-10' : ''} ${props.className || ''}`}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            required={required}
          />
        </div>
        {hint && <p className="text-ink-muted text-xs mt-1">{hint}</p>}
        {error && <p className="text-negative text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
