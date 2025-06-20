// components/ui/button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
    const baseStyles = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantStyles = {
        default: "text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-400",
        primary: "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:ring-indigo-500",
        danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
        outline: "text-indigo-700 border border-indigo-600 bg-transparent hover:bg-indigo-50 focus:ring-indigo-500",
        ghost: "text-indigo-700 bg-transparent hover:bg-indigo-100 focus:ring-indigo-500",
        link: "text-indigo-600 underline underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-0",
      };

      const sizeStyles = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm", // default
        lg: "px-5 py-3 text-base",
      };

    export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
      ({ children, className, variant = 'default', size = 'md', isLoading = false, disabled, ...props },ref ) => {
        return (
          <button
            ref={ref}
            type="button"
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
              (isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''
            } ${className}`}
            disabled={isLoading || disabled}
            {...props}
          >
            {isLoading && (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z" />
              </svg>
            )}
            {children}
          </button>
        );
      }
    );
    Button.displayName = 'Button';
