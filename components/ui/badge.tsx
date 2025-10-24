// components/ui/badge.tsx
import React from 'react';
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'outline'
  | 'unknown'
  | 'planning'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'canceled'
  | 'archived';
// Define the possible variants for the badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  // Base styling for all badges
  let baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  // Apply variant-specific styles
  switch (variant) {
    case 'default':
      baseClasses += ' bg-primary text-primary-foreground hover:bg-primary/80'; // Example: blue/indigo
      break;
    case 'secondary':
      baseClasses += ' bg-secondary text-secondary-foreground hover:bg-secondary/80'; // Example: light gray
      break;
    case 'success':
      baseClasses += ' bg-green-600 text-white'; // For active states
      break;
    case 'destructive':
      baseClasses += ' bg-red-600 text-white hover:bg-red-700'; // For inactive/error states
      break;
    case 'outline':
      baseClasses += ' text-green-600 border border-green-600 bg-emerald-50 hover:bg-accent'; // Outline style
      break;
    case 'unknown':
      baseClasses += ' text-gray-450 border border-gray-450 bg-gray-100'; // Outline style
      break;
    case 'planning':
      baseClasses += ' bg-yellow-100 text-yellow-800 border border-yellow-300';
      break;
    case 'scheduled':
      baseClasses += ' bg-blue-100 text-blue-800 border border-blue-300';
      break;
    case 'active':
      baseClasses += ' bg-green-600 text-white';
      break;
    case 'paused':
      baseClasses += ' bg-orange-100 text-orange-800 border border-orange-300';
      break;
    case 'completed':
      baseClasses += ' bg-gray-100 text-gray-800 border border-gray-300';
      break;
    case 'canceled':
      baseClasses += ' bg-red-600 text-white';
      break;
    case 'archived':
      baseClasses += ' bg-slate-200 text-slate-600';
      break;

    default:
      baseClasses += ' bg-gray-500 text-white'; // Fallback
      break;
  }

  // Combine base and any additional classes provided by the user
  const finalClasses = `${baseClasses} ${className || ''}`;

  return (
    <span className={finalClasses}>
      {children}
    </span>
  );
}
