import React from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, name, checked = false, onCheckedChange, error, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-ink mb-1">
            {label}
          </label>
        )}
        <div className="relative inline-flex items-center">
          <input
            id={name}
            name={name}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          {/* `bg-accent` when on, not `bg-ink-subtle`.
              
              A switch has one job — say at a glance whether the thing is on — and grey-on-grey does
              not do it: at arm's length the only difference between on and off was which side a
              white dot sat on. The accent is what the rest of the product uses to mean "this is
              the state you chose", and it is the same colour the reader has already learnt from
              every selected tab and primary button. */}
          <div
            className={`w-11 h-6 flex items-center flex-shrink-0 p-1 rounded-full cursor-pointer transition-colors duration-300 ${
              checked ? 'bg-accent' : 'bg-line'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!disabled) {
                onCheckedChange?.(!checked);
              }
            }}
          >
            <div
              className={`bg-surface w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                checked ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>

        </div>
        {error && <p className="mt-1 text-xs text-negative">{error}</p>}
      </div>
    );
  }
);
Switch.displayName = 'Switch';
// This Switch component is a custom toggle switch that can be used in forms.
// It accepts props for label, checked state, error messages, and a callback for when the checked state changes.
// The switch is styled to match the primary theme color when checked, and it includes accessibility features