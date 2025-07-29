// app/(auth)/health/page.tsx

import React, { Suspense } from 'react';
// Assuming you have a LoadingSpinner component in your UI library
import { LoadingSpinner } from '@/components/ui';

// Import the client component that will handle the health check logic
import HealthClientPage from './HealthClientPage';

export default function HealthPage() {
  return (
    // Wrap the client component in a Suspense boundary.
    // This allows the server to render a fallback (like a loading spinner)
    // while the client-side component (which uses browser APIs like network requests) loads.
    <Suspense fallback={<LoadingSpinner message="Connecting to backend... (first request might take a moment)" />}>
      <HealthClientPage />
    </Suspense>
  );
}