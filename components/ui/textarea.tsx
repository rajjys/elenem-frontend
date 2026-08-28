import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, name, error, ...props }, ref) => {
    return (
      <div className="mb-4">
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
          className={`mt-1 block w-full px-3 py-2 border ${
            error ? 'border-negative' : 'border-line'
          } rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-negative">{error}</p>}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
// This TextArea component is a simple wrapper around the HTML <textarea> element.
// It accepts props for label, error messages, and standard textarea attributes.