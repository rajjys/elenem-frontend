import { SearchIcon } from "lucide-react";
import React from "react";

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

/** Words that stay lowercase inside a French name. */
const NAME_PARTICLES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'et', 'a', 'au', 'aux', 'en', 'sur', 'sous', 'pour',
  'par', 'dans', 'chez', 'lez',
]);

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

    /**
     * Title-cases a proper noun, leaving acronyms and French particles alone.
     *
     * Three rules, each earning its place:
     *  - Short all-caps tokens stay as typed. Clubs here are "BC Virunga", "AS Vita", "FC
     *    Renaissance", and those prefixes are acronyms rather than words; blanket title-casing
     *    renders them "Bc", "As", "Fc".
     *  - Particles stay lowercase unless they open the name, because "Ligue de Basketball de
     *    Kinshasa" is how the organisation writes itself, not "Ligue De Basketball De Kinshasa".
     *  - Everything else is normalised, so "LEbrOn" becomes "Lebron" and "MAsu" becomes "Masu".
     */
    const normalizeName = (value: string) => {
      let isFirst = true;
      return value.replace(/[^\s-]+/g, (word) => {
        const leading = isFirst;
        isFirst = false;

        // Particles first: "DU" is short and all-caps, so the acronym rule would otherwise
        // claim it and "Ligue Provinciale DU Nord-Kivu" would keep shouting.
        const lower = word.toLocaleLowerCase('fr');
        if (!leading && NAME_PARTICLES.has(lower)) return lower;

        if (word.length <= 3 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;

        return word.charAt(0).toLocaleUpperCase('fr') + word.slice(1).toLocaleLowerCase('fr');
      });
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
        value = transform === 'name' ? normalizeName(value) : applyTransform(value);
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
            id={name}
            name={name}
            ref={ref}
            type={type}
            maxLength={maxCharacters}
            className={`block w-full px-3 py-2 border ${
              error ? 'border-negative' : 'border-line'
            } rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm ${
              isSearchType ? 'pl-10' : ''
            } ${props.className || ''}`}
            {...props}
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
