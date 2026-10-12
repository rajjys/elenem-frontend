'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { OtpInput } from '@/components/ui/otp-input';
import { PasswordChecklist, passwordMeetsRules } from '@/components/ui/password-checklist';
import { toastApiError } from '@/utils';
import { useForgotPassword, useVerifyResetOtp, useResetPassword } from '@/services/auth';
import { useCooldown } from '@/hooks/useCooldown';
import { useAuthStore } from '@/store/auth.store';
import { getPostAuthRedirect } from '@/utils/post-auth-redirect';

type Step = 'email' | 'otp' | 'password';
const STEPS: Step[] = ['email', 'otp', 'password'];

/**
 * « Mot de passe oublié », on the same frame as sign-in and sign-up (PHASE5A_PRODUCT_SITE §8.3):
 * an e-mail, the 6-digit code it receives, then a new password under the same rule as sign-up.
 *
 * The code e-mail links here with `?email=`, and that opens at the code step: the code may have
 * been sent by an administrator from the users screen, and asking for the address again would send
 * a second one and void the first.
 */
function ForgotPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const emailFromLink = params.get('email') ?? '';
  // `send=1`: arrived asking for a code (« Recevoir un nouveau code » on an invitation), not
  // holding one from an e-mail — send it on arrival, once.
  const sendOnArrival = params.get('send') === '1' && !!emailFromLink;
  const [step, setStep] = useState<Step>(emailFromLink ? 'otp' : 'email');
  const [email, setEmail] = useState(emailFromLink);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [tried, setTried] = useState(false);

  const forgot = useForgotPassword();
  const sentOnArrival = useRef(false);
  const verifyOtp = useVerifyResetOtp();
  const reset = useResetPassword();
  const cooldown = useCooldown();
  const login = useAuthStore((s) => s.login);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!sendOnArrival || sentOnArrival.current) return;
    sentOnArrival.current = true;
    // The promise, not mutate()'s callbacks: those belong to the render that called them, and in
    // development React mounts twice — the guard above keeps the second from sending again, so
    // the first's callbacks would be the only ones, and they are dropped with it.
    forgot
      .mutateAsync(emailFromLink)
      .then(() => {
        toast.success('Nouveau code envoyé.');
        cooldown.start();
      })
      .catch((e: unknown) => toastApiError(e, "Impossible d'envoyer le code."));
  }, [sendOnArrival, emailFromLink, forgot, cooldown]);

  // Step 1 — request a code.
  const requestCode = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(email, {
      onSuccess: () => {
        toast.success('Si un compte existe, un code a été envoyé.');
        cooldown.start();
        setStep('otp');
      },
      onError: (err) => toastApiError(err, "Impossible d'envoyer le code."),
    });
  };

  const resendCode = () => {
    if (cooldown.remaining > 0) return;
    forgot.mutate(email, {
      onSuccess: () => {
        toast.success('Nouveau code envoyé.');
        cooldown.start();
      },
      onError: (e) => toastApiError(e),
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
    setTried(true);
    if (!passwordMeetsRules(newPassword)) return;
    if (newPassword !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    reset.mutate(
      { email, otp, newPassword },
      {
        // Signed in on the way out, as after an invitation: the address and the new password were
        // both just typed here, and the sign-in form would only ask for them again.
        onSuccess: async () => {
          setSigningIn(true);
          try {
            await login(email, newPassword);
            toast.success('Mot de passe réinitialisé. Bienvenue !');
            const user = useAuthStore.getState().user;
            router.replace(user ? getPostAuthRedirect(user) : '/');
          } catch {
            toast.success('Mot de passe réinitialisé. Connectez-vous.');
            router.push('/login');
          }
        },
        onError: (err) => toastApiError(err, 'Réinitialisation impossible.'),
      },
    );
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle={
        step === 'email'
          ? 'Entrez votre adresse email : vous recevrez un code à 6 chiffres.'
          : step === 'otp'
            ? `Entrez le code envoyé à ${email}.`
            : `Choisissez le nouveau mot de passe de ${email}.`
      }
      crossLink={{ prompt: 'Vous vous en souvenez ?', label: 'Connectez-vous', href: '/login' }}
    >
      {/* Where the reader is in three steps. */}
      <div className="mb-6 flex items-center gap-2" aria-hidden>
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 w-10 rounded-full transition-colors ${i <= stepIndex ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </div>

      {step === 'email' && (
        <form onSubmit={requestCode} className="space-y-5">
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
              autoFocus
            />
          </div>
          <Button type="submit" variant="primary" className="h-11 w-full" disabled={forgot.isPending}>
            {forgot.isPending ? 'Envoi…' : 'Envoyer le code'}
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={checkCode} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          <Button type="submit" variant="primary" className="h-11 w-full" disabled={verifyOtp.isPending}>
            {verifyOtp.isPending ? 'Vérification…' : 'Vérifier le code'}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="flex items-center gap-1 text-ink-muted hover:text-ink"
              onClick={() => setStep('email')}
            >
              <ArrowLeft size={14} /> Changer l&apos;email
            </button>
            <button
              type="button"
              disabled={cooldown.remaining > 0 || forgot.isPending}
              className="text-accent-text disabled:cursor-not-allowed disabled:text-ink-subtle"
              onClick={resendCode}
            >
              {cooldown.remaining > 0 ? `Renvoyer (${cooldown.remaining}s)` : 'Renvoyer'}
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={submitReset} className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg bg-positive-soft px-3 py-2 text-sm text-positive">
            <CheckCircle2 size={16} /> Code vérifié
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
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
          <Button type="submit" variant="primary" className="h-11 w-full" disabled={reset.isPending || signingIn}>
            {reset.isPending ? 'Réinitialisation…' : signingIn ? 'Connexion…' : 'Réinitialiser le mot de passe'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordInner />
    </Suspense>
  );
}
