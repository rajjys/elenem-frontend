'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, Loader2, PartyPopper } from 'lucide-react';

import { Button, CountryPicker, Input, Label, PasswordInput, SportPicker } from '@/components/ui';
import { AuthShell } from '@/components/auth/auth-shell';
import { SportType } from '@/schemas';
import {
  AccountStepSchema,
  OrganisationStepSchema,
  RegisterOrganisationSchema,
  onboardingError,
  suggestTenantCode,
  useCheckAvailability,
  useRegisterOrganisation,
  type RegisterOrganisationValues,
} from '@/services/onboarding';

/**
 * Sign-up, as one form that submits once.
 *
 * Every field is held here until the last step. Nothing exists server-side until then, which is
 * what makes "Retour" work: going back to correct your surname used to hit an account that had
 * already been created, so the flow answered a correction with "that email already exists" — and
 * every organiser who gave up in between left an orphaned account behind.
 *
 * A taken email would now surface only at the end, after six fields, so the step transition
 * checks it on the screen where it was typed.
 */

type Step = 'account' | 'organisation' | 'done';

const RAIL: { key: Step; label: string }[] = [
  { key: 'account', label: 'Compte' },
  { key: 'organisation', label: 'Organisation' },
];

function StepRail({ current }: { current: Step }) {
  const index = RAIL.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center gap-2 mb-7" aria-label="Progression">
      {RAIL.map((step, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={step.key} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
            <span
              className={[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold transition-colors',
                done
                  ? 'bg-positive text-ink-inverted'
                  : active
                    ? 'bg-accent text-accent-ink'
                    : 'bg-surface-sunk text-ink-subtle ring-1 ring-line',
              ].join(' ')}
            >
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={[
                'text-[0.8125rem] truncate',
                active ? 'text-ink font-medium' : 'text-ink-subtle',
              ].join(' ')}
            >
              {step.label}
            </span>
            {i < RAIL.length - 1 && <span className="h-px flex-1 bg-line min-w-3" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-negative text-xs" role="alert">
      {message}
    </p>
  );
}

export function SignUpFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('account');
  const [created, setCreated] = useState<{ name: string; tenantCode: string } | null>(null);

  const checkAvailability = useCheckAvailability();
  const registerOrganisation = useRegisterOrganisation();

  const form = useForm<RegisterOrganisationValues>({
    resolver: zodResolver(RegisterOrganisationSchema),
    // Validated per step below, so the resolver's whole-form verdict never blocks step one on
    // fields that belong to step two.
    mode: 'onSubmit',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      organisationName: '',
      tenantCode: '',
      sportType: SportType.BASKETBALL,
      // ISO-3166 alpha-2, which is what the API stores. The market this launches into, and still
      // a changeable field — a default is a starting point, not an assumption.
      country: 'CD',
    },
  });

  const { register, watch, setValue, setError, clearErrors, getValues, formState } = form;
  const firstName = watch('firstName');
  const organisationName = watch('organisationName');
  const tenantCode = watch('tenantCode');
  const sportType = watch('sportType');
  const country = watch('country');

  const previewCode = (tenantCode?.trim() || suggestTenantCode(organisationName || '')).toLowerCase();

  /** Validate one step's fields only, so the other step's emptiness is not an error yet. */
  function validateStep(fields: readonly (keyof RegisterOrganisationValues)[]) {
    clearErrors(fields as never);
    const schema = fields.includes('email') ? AccountStepSchema : OrganisationStepSchema;
    const result = schema.safeParse(getValues());
    if (result.success) return true;
    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof RegisterOrganisationValues;
      if (fields.includes(path)) setError(path, { message: issue.message });
    }
    return false;
  }

  async function onAccountNext() {
    if (!validateStep(['firstName', 'lastName', 'email', 'password'])) return;

    // Asked here rather than after the organisation step, so a taken address is reported on the
    // screen where it was typed.
    try {
      const availability = await checkAvailability.mutateAsync({ email: getValues('email').trim() });
      if (availability.email === 'taken') {
        setError('email', { message: 'Un compte existe déjà avec cette adresse.' });
        return;
      }
    } catch {
      // An availability outage must not block sign-up; the final submit checks again anyway.
    }
    setStep('organisation');
  }

  async function onSubmit() {
    if (!validateStep(['organisationName', 'tenantCode', 'sportType', 'country'])) return;

    try {
      const result = await registerOrganisation.mutateAsync(getValues());
      setCreated({ name: result.tenant.name, tenantCode: result.tenant.tenantCode });
      setStep('done');
    } catch (error) {
      const { field, message } = onboardingError(error);
      if (field === 'email') {
        // Somebody took the address between the check and the submit. Send them back to it.
        setError('email', { message });
        setStep('account');
        return;
      }
      setError(field ?? 'organisationName', { message });
    }
  }

  // --- step three: what now ---------------------------------------------------------------

  if (step === 'done' && created) {
    return (
      <AuthShell
        title={`${created.name} est créée.`}
        subtitle="Il reste une chose avant que vos supporters puissent voir quelque chose : une compétition."
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-positive/30 bg-positive-soft px-4 py-3">
            <PartyPopper className="h-5 w-5 shrink-0 text-positive mt-0.5" aria-hidden />
            <p className="text-sm text-ink">
              Votre adresse publique&nbsp;:{' '}
              <span className="font-medium">{created.tenantCode.toLowerCase()}.elenem.site</span>
            </p>
          </div>

          <div className="space-y-2.5">
            <Button
              variant="primary"
              className="w-full h-11"
              onClick={() => router.push('/league/create')}
            >
              Créer votre première ligue
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="ghost"
              className="w-full h-11"
              onClick={() => router.push('/tenant/dashboard')}
            >
              Plus tard — aller au tableau de bord
            </Button>
          </div>

          <p className="text-xs text-ink-subtle text-center">
            Une ligue prend moins d&apos;une minute, et tout reste modifiable ensuite.
          </p>
        </div>
      </AuthShell>
    );
  }

  // --- steps one and two ------------------------------------------------------------------

  const isAccount = step === 'account';

  return (
    <AuthShell
      title={isAccount ? 'Créez votre organisation' : 'Votre organisation'}
      subtitle={
        isAccount
          ? 'Deux étapes, et votre ligue est prête à recevoir ses équipes.'
          : `Bienvenue${firstName ? `, ${firstName}` : ''}. Dites-nous quelle ligue ou fédération vous organisez.`
      }
      crossLink={
        isAccount
          ? { prompt: 'Vous avez déjà un compte ?', label: 'Connectez-vous', href: '/login' }
          : undefined
      }
      footer={
        isAccount ? (
          <>
            En créant un compte, vous acceptez nos{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink-muted">
              conditions d&apos;utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-muted">
              politique de confidentialité
            </Link>
            .
          </>
        ) : undefined
      }
    >
      <StepRail current={step} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void (isAccount ? onAccountNext() : onSubmit());
        }}
        className="space-y-5"
      >
        {isAccount ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" autoComplete="given-name" placeholder="Jean" {...register('firstName')} />
                <FieldError message={formState.errors.firstName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" autoComplete="family-name" placeholder="Bisimwa" {...register('lastName')} />
                <FieldError message={formState.errors.lastName?.message} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="jean.bisimwa@example.cd"
                {...register('email')}
              />
              <FieldError message={formState.errors.email?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {formState.errors.password ? (
                <FieldError message={formState.errors.password.message} />
              ) : (
                <p className="text-xs text-ink-subtle">
                  8 caractères au minimum, avec une majuscule, une minuscule et un chiffre.
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11"
              disabled={checkAvailability.isPending}
            >
              {checkAvailability.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="ml-2">Vérification…</span>
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="organisationName">Nom de l&apos;organisation</Label>
              <Input
                id="organisationName"
                // Named for the browser, so it stops offering the email typed on the step before.
                autoComplete="organization"
                placeholder="Ligue Provinciale de Basketball de Kinshasa"
                {...register('organisationName')}
              />
              <FieldError message={formState.errors.organisationName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenantCode">
                Code court <span className="font-normal text-ink-subtle">— facultatif</span>
              </Label>
              <Input
                id="tenantCode"
                autoComplete="off"
                transform="uppercase"
                maxCharacters={12}
                placeholder={suggestTenantCode(organisationName || '') || 'LIPROBAKIN'}
                {...register('tenantCode')}
              />
              {formState.errors.tenantCode ? (
                <FieldError message={formState.errors.tenantCode.message} />
              ) : (
                <p className="text-xs text-ink-subtle">
                  Votre adresse publique&nbsp;:{' '}
                  <span className="text-accent-text font-medium">{previewCode || 'votre-code'}</span>
                  .elenem.site
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Sport</Label>
              <SportPicker
                value={sportType}
                onChange={(value) => setValue('sportType', value, { shouldValidate: true })}
                invalid={!!formState.errors.sportType}
              />
              <FieldError message={formState.errors.sportType?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Pays</Label>
              <CountryPicker
                id="country"
                value={country}
                onChange={(code) => setValue('country', code, { shouldValidate: true })}
                invalid={!!formState.errors.country}
              />
              <FieldError message={formState.errors.country?.message} />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                onClick={() => setStep('account')}
                disabled={registerOrganisation.isPending}
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Retour
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 h-11"
                disabled={registerOrganisation.isPending}
              >
                {registerOrganisation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="ml-2">Création…</span>
                  </>
                ) : (
                  'Créer mon organisation'
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </AuthShell>
  );
}
