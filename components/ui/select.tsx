// components/ui/select.tsx
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, name, error, options, ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          id={name}
          name={name}
          ref={ref}
          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`}
          {...props}
        >
          <option value="">Select {label || 'an option'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';