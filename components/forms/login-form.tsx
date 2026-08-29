// components/forms/login-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { isAxiosError } from '@/services/api';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { useAuthStore } from "@/store/auth.store";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

// Sign-in takes a credential and nothing else. The organisation is resolved from the account —
// username and email are both unique platform-wide — so there is no code to remember and no
// "am I a system admin?" question to answer about yourself before you are allowed to try.
const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Identifiant ou email requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    setError(null);
    setLoading(true);
    try {
      await login(data.usernameOrEmail, data.password);
      // Redirection is handled by login/page.tsx's useEffect and middleware
    } catch (error) {
      let errorMessage = "Connexion échouée";
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-negative text-sm">{error}</p>}
      <div>
        <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-ink">Identifiant ou Email</label>
        <Input id="usernameOrEmail" type="text" autoComplete="username" placeholder="jonathan" {...form.register("usernameOrEmail")} />
        {form.formState.errors.usernameOrEmail && <p className="text-negative text-xs mt-1">{form.formState.errors.usernameOrEmail.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">Mot de passe</label>
        <PasswordInput id="password" autoComplete="current-password" placeholder="********"{...form.register("password")} />
        {form.formState.errors.password && <p className="text-negative text-xs mt-1">{form.formState.errors.password.message}</p>}
        <div className="mt-1 text-right">
          <Link href="/forgot-password" className="text-xs text-accent-text hover:text-accent-text">Mot de passe oublié?</Link>
        </div>
      </div>

      <Button type="submit" variant='primary' disabled={loading} className="w-full">{loading ?
        (
         <>
           <Loader2 className="animate-spin" size={16} />
           <span className="ml-2">Connexion...</span>
        </>
        ) : (
          <span>Se connecter</span>
        )}</Button>
        {/* Need an account? Register */}
        <div className="mt-4 py-8 border-t border-accent-line">
          <p className="text-sm text-ink-muted">Vous n&apos;avez pas de compte? <Link href="/register" className="text-accent-text hover:text-accent-text transition-all duration-300 ease-in-out font-medium pl-2">Inscrivez-vous</Link></p>
        </div>
    </form>
  );
}
