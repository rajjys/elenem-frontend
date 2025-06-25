import { SearchIcon } from "lucide-react";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  restrict?: 'alpha' | 'alphanumeric' | 'numeric' | 'uppercase' | 'year' | 'none';
  maxCharacters?: number;
  hint?: string;
  autoTrim?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, type = 'text', error, required, restrict = 'none', maxCharacters, hint, autoTrim = false, onChange, onBlur, ...props }, ref) => {
    const allowedControlKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow control keys regardless of restriction
      if (allowedControlKeys.includes(e.key)) {
        return;
      }

      // Special handling for 'numeric' restrict
      if (restrict === 'numeric') {
        if (!/^\d$/.test(e.key)) {
          e.preventDefault();
        }
        return; // Exit early if numeric
      }

      // Restrict other characters based on `restrict` prop
      if (restrict === 'alpha' && !/^[a-zA-Z\s]$/.test(e.key)) {
        // Allow letters + space
        e.preventDefault();
      } else if (restrict === 'uppercase') {
        // For uppercase, we'll convert on change/blur, but still block non-alpha characters
        if (!/^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
        }
      } else if (restrict === 'alphanumeric' && !/^[a-zA-Z0-9]$/.test(e.key)) {
        e.preventDefault();
      }

      // Call original onKeyDown if provided
      props.onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Apply restriction logic before maxLength for type="number"
      if (restrict === 'uppercase') {
        value = value.toUpperCase();
      }

      if (restrict === 'numeric') {
        // Ensure only digits are in the value for numeric restriction
        value = value.replace(/[^0-9]/g, '');
      }

      // If type is "number" or restrict is "year", manually enforce maxCharacters.
      // This is crucial because maxLength HTML attribute is ignored for type="number".
      if ((type === 'number' || restrict === 'year') && maxCharacters !== undefined) {
        if (value.length > maxCharacters) {
          value = value.slice(0, maxCharacters);
        }
      }

      e.target.value = value; // Update the input's displayed value

      // Call the original onChange prop if it exists
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (restrict === 'uppercase') {
        value = value.toUpperCase();
        e.target.value = value;
      }

      if (autoTrim && value.trim() !== value) {
        value = value.trim();
        e.target.value = value;
      }

      // Call the original onBlur prop
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
        <div className={`relative ${isSearchType ? 'flex items-center' : ''}`}> {/* Wrapper for icon */}
          {isSearchType && (
            <div className="absolute left-3"> {/* Icon position */}
              <SearchIcon />
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
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
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
