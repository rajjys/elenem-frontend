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
      } else if (restrict === 'uppercase' && !/^[A-Z]$/.test(e.key)) {
        // For uppercase, we'll convert on change/blur, but still block non-alpha characters
        // and specifically block lowercase letters if we want to force immediate uppercase entry.
        // However, a better UX for 'uppercase' is to convert after input, not block lowercase.
        // So, if it's an alphabetic character, we let it pass for `handleChange` to convert.
        // If it's a number or symbol, we prevent it.
        if (!/^[a-zA-Z]$/.test(e.key)) { // If not an alphabet character
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

      // If type is "number" or restrict is "numeric", manually enforce maxCharacters.
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

      // The `uppercase` conversion should ideally happen on change for immediate feedback
      // but also on blur to catch any programmatic changes or pasting.
      // If restrict is 'uppercase', ensure the final value is uppercase.
      if (restrict === 'uppercase') {
        value = value.toUpperCase();
        e.target.value = value;
      }

      if (autoTrim && value.trim() !== value) {
        value = value.trim();
        e.target.value = value;
      }

      // Programmatically create a new ChangeEvent if value was altered for other handlers
      if (e.target.value !== value) {
        // This is a bit tricky with React's synthetic events.
        // Instead of directly re-dispatching a synthetic event,
        // it's often safer to rely on the state management if you're using it,
        // or ensure the `onChange` prop is called with the modified value.
        // Since we're modifying e.target.value directly, subsequent reads will see it.
        // If `props.onChange` needs to see the updated value *after* these transformations,
        // ensure it's called with an event object reflecting the change.
        // For simpler cases, just setting e.target.value might suffice.
      }

      // Call the original onBlur prop
      onBlur?.(e);
    };


    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={name}
          name={name}
          ref={ref}
          type={type}
          maxLength={maxCharacters}
          className={`mt-1 block w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          {...props}
          onBlur={handleBlur} // Make sure onBlur is active
          onKeyDown={handleKeyDown}
          onChange={handleChange} // Add onChange handler
          required={required}
        />
        {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';