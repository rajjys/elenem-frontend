// components/ui/badge.tsx
import React from 'react';

// Define the possible variants for the badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'destructive' | 'outline';
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
      baseClasses += ' bg-red-500 text-white hover:bg-red-600'; // For inactive/error states
      break;
    case 'outline':
      baseClasses += ' text-foreground border border-input bg-background hover:bg-accent'; // Outline style
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
