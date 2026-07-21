'use client';

import { Button } from './button';

// Shared UI for App Router error.tsx boundaries and inline error fallbacks.
export function ErrorState({
  error,
  reset,
  title = 'Une erreur est survenue',
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-lg font-semibold text-gray-800">{title}</p>
      <p className="max-w-md text-sm text-gray-500">
        {error?.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
      </p>
      {reset && (
        <Button variant="primary" onClick={reset}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
