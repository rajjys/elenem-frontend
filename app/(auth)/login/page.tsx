// app/(auth)/login/page.tsx
// REMOVE "use client"; and "export const dynamic = "force-dynamic";" from here
// This file will now be a Server Component by default

import React, { Suspense } from "react"; // Import Suspense from React
import LoginClientPage from "./LoginClientPage"; // Import the new client component
import { LoadingSpinner } from "@/components/ui"; // Keep LoadingSpinner if used in fallback

export default function LoginPage() {
  return (
    // Wrap the client component in Suspense
    <Suspense fallback={<LoadingSpinner message="Loading login..." />}>
      <LoginClientPage />
    </Suspense>
  );
}