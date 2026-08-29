// components/forms/login-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { useAuthStore } from '@/store/auth.store';
import { isAxiosError } from '@/services/api';

// Sign-in takes a credential and nothing else. The organisation is resolved from the account —
// username and email are both unique platform-wide — so there is no code to remember and no
// "am I a system admin?" question to answer about yourself before you are allowed to try.
const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Identifiant ou email requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: '', password: '' },
  });

  async function onSubmit(data: LoginFormValues) {
    setError(null);
    setLoading(true);
    try {
      await login(data.usernameOrEmail, data.password);
      // Redirection is handled by LoginClientPage's effect and the middleware.
    } catch (err) {
      // Shown in the form rather than as a toast: a rejected credential belongs next to the
      // credential, and a toast outlives the attempt it describes.
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? 'Connexion échouée')
        : 'Connexion échouée';
      setError(typeof message === 'string' ? message : 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <p
          className="rounded-lg border border-negative/30 bg-negative-soft px-3.5 py-2.5 text-sm text-ink"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="usernameOrEmail">Identifiant ou email</Label>
        <Input
          id="usernameOrEmail"
          type="text"
          autoComplete="username"
          placeholder="jean.bisimwa@example.cd"
          {...form.register('usernameOrEmail')}
        />
        {form.formState.errors.usernameOrEmail && (
          <p className="text-negative text-xs" role="alert">
            {form.formState.errors.usernameOrEmail.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="password">Mot de passe</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            Mot de passe oublié&nbsp;?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-negative text-xs" role="alert">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" disabled={loading} className="w-full h-11">
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            <span className="ml-2">Connexion…</span>
          </>
        ) : (
          <span>Se connecter</span>
        )}
      </Button>
    </form>
  );
}
