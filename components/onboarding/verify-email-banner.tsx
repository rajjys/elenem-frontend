'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MailWarning, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, OtpInput } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { useResendVerification, useVerifyEmail } from '@/services/auth';
import { isAxiosError } from '@/services/api';

/**
 * The reminder that replaces the wall.
 *
 * Verification used to block organisation creation, which put an inbox round-trip in the middle
 * of sign-up. It now blocks inviting other people instead — later, and for a reason the organiser
 * can see. Nothing else is gated: the calendar, the results and the public site all work
 * unverified, because a league whose season has started should never be stopped by an email.
 *
 * **Dashboards only.** It followed the reader onto every screen, which is how a reminder becomes
 * furniture — after the third page it is no longer read, it is just a yellow band above the
 * content, and on the calendar it pushed the whole grid down a hundred pixels on every visit. A
 * dashboard is where you look to see what needs doing, so it is where an unfinished setup
 * belongs.
 */

/** The surfaces where "here is what still needs doing" is the point of the page. */
const DASHBOARDS = ['/tenant/dashboard', '/league/dashboard', '/team/dashboard', '/admin/dashboard'];
export function VerifyEmailBanner() {
  const pathname = usePathname() ?? '';
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');

  const verify = useVerifyEmail();
  const resend = useResendVerification();

  // Nothing to nag about — and nothing to render before the user is loaded.
  if (!user || user.isEmailVerified) return null;
  if (!DASHBOARDS.some((d) => pathname.startsWith(d))) return null;

  const email = user.email;

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    verify.mutate(
      { email, otp },
      {
        onSuccess: async () => {
          toast.success('Email vérifié.');
          await fetchUser();
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Code invalide ou expiré.')
            : 'Code invalide ou expiré.';
          toast.error(typeof message === 'string' ? message : 'Code invalide ou expiré.');
        },
      },
    );
  }

  return (
    <div className="border border-caution/40 bg-caution-soft rounded-md px-4 py-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <MailWarning className="h-5 w-5 text-caution shrink-0" aria-hidden />
        <p className="text-sm text-ink flex-1 min-w-[16rem]">
          Vérifiez <span className="font-medium">{email}</span> pour pouvoir inviter vos
          collaborateurs.
        </p>
        <Button type="button" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Fermer' : 'Entrer le code'}
        </Button>
      </div>

      {open && (
        <form onSubmit={onVerify} className="mt-4 flex flex-wrap items-center gap-3">
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          <Button type="submit" variant="primary" disabled={verify.isPending || otp.length < 6}>
            {verify.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span className="ml-2">Vérification…</span>
              </>
            ) : (
              <span>Vérifier</span>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={resend.isPending}
            onClick={() =>
              resend.mutate(email, {
                onSuccess: () => toast.success('Nouveau code envoyé.'),
                onError: () => toast.error("L'envoi a échoué."),
              })
            }
          >
            {resend.isPending ? 'Envoi…' : 'Renvoyer le code'}
          </Button>
        </form>
      )}
    </div>
  );
}
