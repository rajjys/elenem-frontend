import { SearchIcon } from "lucide-react"; // Assuming you're keeping lucide-react for this icon
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
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End',
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (allowedControlKeys.includes(e.key)) return;
      if (restrict === 'numeric' && !/^\d$/.test(e.key)) e.preventDefault();
      else if (restrict === 'alpha' && !/^[a-zA-Z\s]$/.test(e.key)) e.preventDefault();
      else if (restrict === 'uppercase' && !/^[a-zA-Z]$/.test(e.key)) e.preventDefault();
      else if (restrict === 'alphanumeric' && !/^[a-zA-Z0-9]$/.test(e.key)) e.preventDefault();
      props.onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (restrict === 'uppercase') value = value.toUpperCase();
      if (restrict === 'numeric') value = value.replace(/[^0-9]/g, '');
      if ((type === 'number' || restrict === 'year') && maxCharacters !== undefined) {
        if (value.length > maxCharacters) value = value.slice(0, maxCharacters);
      }
      e.target.value = value;
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (restrict === 'uppercase') { value = value.toUpperCase(); e.target.value = value; }
      if (autoTrim && value.trim() !== value) { value = value.trim(); e.target.value = value; }
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
              <SearchIcon className="h-5 w-5 text-gray-400" /> {/* Added default icon sizing/color */}
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
