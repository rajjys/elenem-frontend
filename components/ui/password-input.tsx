'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils';

// Self-contained password field with a show/hide toggle. Mirrors the markup and
// classes of the base Input (label + input + error) so it lines up 1:1 with the
// other fields, and positions the toggle inside the input box only. Forwards the
// ref so it works as a drop-in with react-hook-form's register().
interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, hint, name, required, className, ...props }, ref) {
    const [show, setShow] = React.useState(false);
    return (
      <div>
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-ink mb-1">
            {label}
            {required && <span className="text-negative ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={name}
            name={name}
            ref={ref}
            type={show ? 'text' : 'password'}
            required={required}
            className={cn(
              'block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm',
              error ? 'border-negative' : 'border-line',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-subtle hover:text-ink-muted"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {hint && <p className="text-ink-muted text-xs mt-1">{hint}</p>}
        {error && <p className="text-negative text-xs mt-1">{error}</p>}
      </div>
    );
  },
);
