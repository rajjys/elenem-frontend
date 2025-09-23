import { SearchIcon } from "lucide-react";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  restrict?: 'alpha' | 'alphanumeric' | 'numeric' | 'year' | 'none';
  alphaFirst?: boolean;
  transform?: 'none' | 'uppercase' | 'capitalize';
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
        value = applyTransform(value);
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
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className={`relative ${isSearchType ? 'flex items-center' : ''}`}>
          {isSearchType && (
            <div className="absolute left-3">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <input
            id={name}
            name={name}
            ref={ref}
            type={type}
            maxLength={maxCharacters}
            className={`block w-full px-3 py-2 border ${
              error ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
              isSearchType ? 'pl-10' : ''
            } ${props.className || ''}`}
            {...props}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            required={required}
          />
        </div>
        {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
