'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { OtpInput } from '@/components/ui/otp-input';
import { PasswordChecklist, passwordMeetsRules } from '@/components/ui/password-checklist';
import { toastApiError } from '@/utils';
import { useVerifyResetOtp, useResetPassword } from '@/services/auth';

/**
 * An invited person activates their account, on the same frame as sign-in and sign-up
 * (PHASE5A_PRODUCT_SITE §8.3): the code from the invitation, then a password under the same rule
 * as sign-up.
 */
function AcceptInviteInner() {
  const router = useRouter();
  const emailFromQuery = useSearchParams().get('email') ?? '';
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [tried, setTried] = useState(false);

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
    setTried(true);
    if (!passwordMeetsRules(newPassword)) return;
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
    <AuthShell
      title="Activez votre compte"
      subtitle={
        step === 'code'
          ? 'Entrez le code reçu dans votre email d’invitation.'
          : 'Choisissez un mot de passe pour votre compte.'
      }
      crossLink={{ prompt: 'Déjà activé ?', label: 'Connectez-vous', href: '/login' }}
    >
      {step === 'code' ? (
        <form onSubmit={checkCode} className="space-y-5">
          {!emailFromQuery && (
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          <Button type="submit" variant="primary" className="h-11 w-full" disabled={verify.isPending}>
            {verify.isPending ? 'Vérification…' : 'Continuer'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg bg-positive-soft px-3 py-2 text-sm text-positive">
            <CheckCircle2 size={16} /> Code vérifié
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Mot de passe</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />
            <PasswordChecklist value={newPassword} showFailures={tried} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="h-11 w-full" disabled={reset.isPending}>
            {reset.isPending ? 'Activation…' : 'Activer mon compte'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteInner />
    </Suspense>
  );
}
