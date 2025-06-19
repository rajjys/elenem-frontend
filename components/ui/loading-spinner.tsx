// components/ui/loading-spinner.tsx
import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    </div>
  );
}
