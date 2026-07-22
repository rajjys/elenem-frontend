'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { Button, Input, OtpInput } from '@/components/ui';
import { toastApiError, getPostAuthRedirect } from '@/utils';
import { useVerifyEmail, useResendVerification } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';

const RESEND_SECONDS = 30;

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const emailFromQuery = searchParams.get('email') ?? '';
  // `sent=1` means register just emailed a code, so we don't re-send on mount.
  const justSent = searchParams.get('sent') === '1';
  // Known email (from register redirect or the logged-in user) is shown as text,
  // not an editable field. Only fall back to an input if we truly have none.
  const knownEmail = emailFromQuery || user?.email || '';

  const [otp, setOtp] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const email = knownEmail || manualEmail;

  // Resend cooldown so users can't trip the rate limiter.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Ensure a fresh code is actually sent when landing here (e.g. from the
  // dashboard "verify now" link, where any register-time code has expired).
  // Skipped when register just sent one (sent=1).
  useEffect(() => {
    if (justSent || !knownEmail) return;
    resend.mutate(knownEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate(
      { email, otp },
      {
        onSuccess: async () => {
          toast.success('Email vérifié.');
          // Refresh the cached user so the verified state shows immediately.
          const fresh = await fetchUser().catch(() => user);
          router.push(fresh ? getPostAuthRedirect(fresh) : user ? getPostAuthRedirect(user) : '/login');
        },
        onError: (err) => toastApiError(err, 'Vérification impossible.'),
      },
    );
  };

  const doResend = () => {
    if (cooldown > 0 || !email) return;
    resend.mutate(email, {
      onSuccess: (d) => {
        toast.success(d?.message ?? 'Nouveau code envoyé.');
        setCooldown(RESEND_SECONDS);
      },
      onError: (err) => toastApiError(err),
    });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <MailCheck size={22} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Vérifiez votre email</h1>
          <p className="mt-1 text-sm text-gray-500">
            Un code à 6 chiffres a été envoyé à{' '}
            <span className="font-medium text-gray-700">{email || 'votre adresse'}</span>. La
            réception peut prendre quelques instants.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {!knownEmail && (
            <Input
              type="email"
              placeholder="votre@email.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              required
            />
          )}
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          <Button type="submit" variant="primary" className="w-full" disabled={verify.isPending}>
            {verify.isPending ? 'Vérification…' : "Vérifier l'email"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            disabled={cooldown > 0 || resend.isPending}
            onClick={doResend}
            className="text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : 'Renvoyer le code'}
          </button>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 text-center text-sm">
          {user ? (
            <Link
              href="/account/dashboard"
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={14} /> Retour au tableau de bord
            </Link>
          ) : (
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
              Retour à la connexion
            </Link>
          )}
        </div>
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
