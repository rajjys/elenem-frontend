'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/forms/login-form';
import { AuthShell } from '@/components/auth';
import { getPostAuthRedirect, safeRedirectPath } from '@/utils';
import { useAuthStore } from '@/store/auth.store';

export default function LoginClientPage() {
  const { user, tokens } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (tokens?.accessToken && user) {
      // Only a path on this site: an unchecked `redirect` sent a user who had just typed their
      // password to whatever address the link carried.
      const redirectUrl = safeRedirectPath(searchParams.get('redirect'));
      router.push(redirectUrl ?? getPostAuthRedirect(user));
    }
  }, [user, tokens, router, searchParams]);

  return (
    <AuthShell
      title="Content de vous revoir"
      subtitle="Connectez-vous pour gérer vos compétitions."
      crossLink={{
        prompt: "Vous n'avez pas encore de compte ?",
        label: 'Créez votre organisation',
        href: '/register',
      }}
    >
      <LoginForm />
    </AuthShell>
  );
}
