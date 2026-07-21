'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui';
import { toastApiError, getPostAuthRedirect } from '@/utils';
import { useVerifyEmail, useResendVerification } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';

function VerifyEmailInner() {
  const router = useRouter();
  const prefill = useSearchParams().get('email') ?? '';
  const [email, setEmail] = useState(prefill);
  const [otp, setOtp] = useState('');
  const user = useAuthStore((s) => s.user);

  const verify = useVerifyEmail();
  const resend = useResendVerification();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate(
      { email, otp },
      {
        onSuccess: () => {
          toast.success('Email vérifié.');
          // If already logged in (e.g. right after registering) go to their
          // landing page; otherwise send them to log in.
          router.push(user ? getPostAuthRedirect(user) : '/login');
        },
        onError: (err) => toastApiError(err, 'Vérification impossible.'),
      },
    );
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-xl font-semibold">Vérifier votre email</h1>
      <p className="mb-6 text-sm text-gray-500">Entrez le code à 6 chiffres reçu par email.</p>

      <form onSubmit={submit} className="space-y-4">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input inputMode="numeric" maxLength={6} placeholder="Code à 6 chiffres" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        <Button type="submit" variant="primary" className="w-full" disabled={verify.isPending}>
          {verify.isPending ? 'Vérification…' : "Vérifier l'email"}
        </Button>
        <button
          type="button"
          className="text-sm text-indigo-600"
          onClick={() =>
            resend.mutate(email, {
              onSuccess: (d) => toast.success(d?.message ?? 'Code renvoyé.'),
              onError: (err) => toastApiError(err),
            })
          }
        >
          Renvoyer le code
        </button>
      </form>

      <div className="mt-6 border-t pt-4 text-sm text-gray-600">
        <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
