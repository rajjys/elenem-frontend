import React from 'react';
import { cn } from '@/utils/cn';

/**
 * Every colour here comes from the token layer (see app/globals.css). The previous version
 * hardcoded `bg-accent` and `text-ink`, which put the brand colour in the component
 * rather than the theme — so it could not follow light/dark and could not be changed centrally.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-surface-sunk text-ink hover:bg-line border border-line',
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-e1',
  secondary: 'bg-accent-soft text-accent-text hover:bg-accent-line/40',
  danger: 'bg-negative-soft text-negative hover:bg-negative hover:text-ink-inverted font-semibold',
  outline: 'border border-line-strong bg-transparent text-ink hover:bg-surface-sunk',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-sunk hover:text-ink',
  link: 'bg-transparent text-accent-text underline underline-offset-2 hover:text-accent',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'default', size = 'md', isLoading = false, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
