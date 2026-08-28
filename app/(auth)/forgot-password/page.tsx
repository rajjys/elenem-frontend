'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, Input, PasswordInput, OtpInput } from '@/components/ui';
import { toastApiError } from '@/utils';
import { useForgotPassword, useVerifyResetOtp, useResetPassword } from '@/services/auth';

type Step = 'email' | 'otp' | 'password';
const STEPS: Step[] = ['email', 'otp', 'password'];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const forgot = useForgotPassword();
  const verifyOtp = useVerifyResetOtp();
  const reset = useResetPassword();

  // Step 1 — request a code.
  const requestCode = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(email, {
      onSuccess: () => {
        toast.success('Si un compte existe, un code a été envoyé.');
        setStep('otp');
      },
      onError: (err) => toastApiError(err, "Impossible d'envoyer le code."),
    });
  };

  // Step 2 — verify the code BEFORE showing the password screen.
  const checkCode = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtp.mutate(
      { email, otp },
      {
        onSuccess: () => setStep('password'),
        onError: (err) => toastApiError(err, 'Code invalide ou expiré.'),
      },
    );
  };

  // Step 3 — set the new password.
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

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-xl">
        {/* header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-text">
            {step === 'email' ? <Mail size={22} /> : step === 'otp' ? <KeyRound size={22} /> : <Lock size={22} />}
          </div>
          <h1 className="text-xl font-semibold text-ink">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {step === 'email' && 'Entrez votre email pour recevoir un code à 6 chiffres.'}
            {step === 'otp' && `Entrez le code envoyé à ${email}.`}
            {step === 'password' && 'Choisissez un nouveau mot de passe.'}
          </p>
        </div>

        {/* step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-10 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-accent' : 'bg-line'
              }`}
            />
          ))}
        </div>

        {step === 'email' && (
          <form onSubmit={requestCode} className="space-y-4">
            <Input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <Button type="submit" variant="primary" className="w-full" disabled={forgot.isPending}>
              {forgot.isPending ? 'Envoi…' : 'Envoyer le code'}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={checkCode} className="space-y-4">
            <OtpInput value={otp} onChange={setOtp} autoFocus />
            <Button type="submit" variant="primary" className="w-full" disabled={verifyOtp.isPending}>
              {verifyOtp.isPending ? 'Vérification…' : 'Vérifier le code'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="flex items-center gap-1 text-ink-muted hover:text-ink" onClick={() => setStep('email')}>
                <ArrowLeft size={14} /> Changer l&apos;email
              </button>
              <button
                type="button"
                className="text-accent-text hover:text-accent-text"
                onClick={() => forgot.mutate(email, { onSuccess: () => toast.success('Nouveau code envoyé.'), onError: (e) => toastApiError(e) })}
              >
                Renvoyer
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={submitReset} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-positive-soft px-3 py-2 text-sm text-positive">
              <CheckCircle2 size={16} /> Code vérifié
            </div>
            <PasswordInput placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoFocus />
            <PasswordInput placeholder="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <Button type="submit" variant="primary" className="w-full" disabled={reset.isPending}>
              {reset.isPending ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-line pt-4 text-center text-sm">
          <Link href="/login" className="text-accent-text hover:text-accent-text">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
