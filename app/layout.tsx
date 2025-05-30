// app/(app)/layout.tsx
"use client";
import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import "./globals.css";
import { AppLayout } from '@/components/AppLayout'; // The new layout component

export default function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const { user, tokens, fetchUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // No specific role check here, as this layout is for any authenticated user.
    // Role-specific content within these pages can be handled by the page itself.
  }, [tokens, user, router, fetchUser]);

  return <html lang='en'>
    <body>
      <AppLayout>
        {children}
      </AppLayout>
    </body>
    </html>
}