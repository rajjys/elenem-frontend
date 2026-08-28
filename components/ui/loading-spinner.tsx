import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col justify-center items-center h-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-line"></div>
      {message && (
        <span className="mt-2 text-ink text-sm">{message}</span>
      )}
    </div>
  );
}