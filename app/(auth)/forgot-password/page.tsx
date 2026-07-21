'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui';
import { toastApiError } from '@/utils';
import { useForgotPassword, useResetPassword } from '@/services/auth';

// Two-step OTP reset on one page: request a code, then set a new password.
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const forgot = useForgotPassword();
  const reset = useResetPassword();

  const requestCode = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(email, {
      onSuccess: (data) => {
        toast.success(data?.message ?? 'If the account exists, a code has been sent.');
        setStep('reset');
      },
      onError: (err) => toastApiError(err, "Impossible d'envoyer le code."),
    });
  };

  const submitReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    reset.mutate(
      { email, otp, newPassword },
      {
        onSuccess: () => {
          toast.success('Mot de passe réinitialisé. Connectez-vous.');
          router.push('/login');
        },
        onError: (err) => toastApiError(err, 'Réinitialisation impossible.'),
      },
    );
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-xl font-semibold">Mot de passe oublié</h1>
      <p className="mb-6 text-sm text-gray-500">
        {step === 'request'
          ? 'Entrez votre email pour recevoir un code à 6 chiffres.'
          : `Entrez le code envoyé à ${email} et votre nouveau mot de passe.`}
      </p>

      {step === 'request' ? (
        <form onSubmit={requestCode} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" variant="primary" className="w-full" disabled={forgot.isPending}>
            {forgot.isPending ? 'Envoi…' : 'Envoyer le code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="space-y-4">
          <Input inputMode="numeric" maxLength={6} placeholder="Code à 6 chiffres" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <Input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Input type="password" placeholder="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" variant="primary" className="w-full" disabled={reset.isPending}>
            {reset.isPending ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
          </Button>
          <button type="button" className="text-sm text-indigo-600" onClick={() => setStep('request')}>
            Renvoyer un code
          </button>
        </form>
      )}

      <div className="mt-6 border-t pt-4 text-sm text-gray-600">
        <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
