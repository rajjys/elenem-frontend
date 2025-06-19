// components/ui/label.tsx
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className = '', required=false ,...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';
