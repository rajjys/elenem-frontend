import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const baseStyles = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
const variantStyles = {
  default: "text-slate-700 bg-slate-100 hover:bg-slate-200 focus:ring-slate-400",
  primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500", // Tailwind blue
  secondary: "text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500", // Softer blue
  danger: "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500 font-semibold",
  outline: "text-blue-700 border border-blue-600 bg-transparent hover:bg-blue-50 focus:ring-blue-500",
  ghost: "text-blue-700 bg-transparent hover:bg-blue-100 focus:ring-blue-500",
  link: "text-blue-600 underline underline-offset-2 hover:text-blue-800 focus:outline-none focus:ring-0",
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm", // default
  lg: "px-5 py-3 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'default', size = 'md', isLoading = false, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`cursor-pointer transition-all duration-500 ease-in-out ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
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
