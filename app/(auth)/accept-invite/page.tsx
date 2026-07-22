'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { Button, Input, PasswordInput, OtpInput } from '@/components/ui';
import { toastApiError } from '@/utils';
import { useVerifyResetOtp, useResetPassword } from '@/services/auth';

function AcceptInviteInner() {
  const router = useRouter();
  const emailFromQuery = useSearchParams().get('email') ?? '';
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'code' | 'password'>('code');

  const verify = useVerifyResetOtp();
  const reset = useResetPassword();

  const checkCode = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate(
      { email, otp },
      {
        onSuccess: () => setStep('password'),
        onError: (err) => toastApiError(err, 'Code invalide ou expiré.'),
      },
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    reset.mutate(
      { email, otp, newPassword },
      {
        onSuccess: () => {
          toast.success('Compte activé ! Connectez-vous.');
          router.push('/login');
        },
        onError: (err) => toastApiError(err, 'Activation impossible.'),
      },
    );
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            {step === 'code' ? <KeyRound size={22} /> : <Lock size={22} />}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Activez votre compte</h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 'code'
              ? 'Entrez le code reçu dans votre email d’invitation.'
              : 'Choisissez un mot de passe pour votre compte.'}
          </p>
        </div>

        {step === 'code' ? (
          <form onSubmit={checkCode} className="space-y-4">
            {!emailFromQuery && (
              <Input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            <OtpInput value={otp} onChange={setOtp} autoFocus />
            <Button type="submit" variant="primary" className="w-full" disabled={verify.isPending}>
              {verify.isPending ? 'Vérification…' : 'Continuer'}
            </Button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 size={16} /> Code vérifié
            </div>
            <PasswordInput placeholder="Mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoFocus />
            <PasswordInput placeholder="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <Button type="submit" variant="primary" className="w-full" disabled={reset.isPending}>
              {reset.isPending ? 'Activation…' : 'Activer mon compte'}
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-gray-100 pt-4 text-center text-sm">
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteInner />
    </Suspense>
  );
}
