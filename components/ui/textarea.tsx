import React from 'react';
import { cn } from '@/utils';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, name, error, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-ink mb-1">
            {label}
          </label>
        )}
        <textarea
          id={name}
          name={name}
          ref={ref}
          rows={3}
          {...props}
          // Merged, not overwritten. `{...props}` used to be spread AFTER className, so any
          // caller passing one silently replaced the base styles — including `w-full`, which is
          // why a textarea given a font class rendered at its default 20-column width.
          className={cn(
            'block w-full resize-y rounded-md border bg-surface px-3 py-2 text-ink shadow-sm sm:text-sm',
            'placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
            error ? 'border-negative' : 'border-line',
            props.className,
          )}
        />
        {error && <p className="mt-1 text-xs text-negative">{error}</p>}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
// This TextArea component is a simple wrapper around the HTML <textarea> element.
// It accepts props for label, error messages, and standard textarea attributes.