'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CountryDropdown } from 'react-country-region-selector';
import { ArrowLeft, ArrowRight, Building2, Check, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  Label,
  PasswordInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  getSportIcon,
} from '@/components/ui';
import { isAxiosError } from '@/services/api';
import { SportType } from '@/schemas';
import {
  AccountStepSchema,
  OrganisationStepSchema,
  suggestTenantCode,
  useCreateAccount,
  useCreateOrganisation,
  type AccountStepValues,
  type OrganisationStepValues,
} from '@/services/onboarding';

/**
 * Sign-up and organisation creation as one uninterrupted sequence.
 *
 * Two steps, seven fields between them, and no email round-trip in the middle — creating an
 * organisation no longer waits on a verified address, because the thing worth holding back is
 * inviting other people, and that happens later.
 */

const STEPS = [
  { key: 'account', label: 'Votre compte', icon: UserRound },
  { key: 'organisation', label: 'Votre organisation', icon: Building2 },
] as const;

function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

function StepRail({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3 mb-8">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="flex items-center gap-3 flex-1 last:flex-none">
            <span
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                done
                  ? 'bg-positive text-ink-inverted'
                  : active
                    ? 'bg-accent text-accent-ink'
                    : 'bg-surface-sunk text-ink-subtle',
              ].join(' ')}
              aria-hidden
            >
              {done ? <Check size={16} /> : <Icon size={16} />}
            </span>
            <span
              className={[
                'text-sm whitespace-nowrap',
                active ? 'text-ink font-medium' : 'text-ink-subtle',
              ].join(' ')}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden sm:block h-px flex-1 bg-line" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function SignUpFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Kept so the organisation step can greet the person by name after the account exists.
  const [firstName, setFirstName] = useState('');

  const createAccount = useCreateAccount();
  const createOrganisation = useCreateOrganisation();

  const accountForm = useForm<AccountStepValues>({
    resolver: zodResolver(AccountStepSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const orgForm = useForm<OrganisationStepValues>({
    resolver: zodResolver(OrganisationStepSchema),
    defaultValues: {
      name: '',
      tenantCode: '',
      sportType: SportType.BASKETBALL,
      // ISO-3166 alpha-2, which is what the API validates and stores. The market this launches
      // into, and still a visible changeable field — a default is a starting point, not an
      // assumption about who is allowed to sign up.
      country: 'CD',
    },
  });

  const orgName = orgForm.watch('name');
  const orgCode = orgForm.watch('tenantCode');
  // Show what the address will be: the typed code, else the suggestion the backend would derive.
  const previewCode = (orgCode?.trim() || suggestTenantCode(orgName || '')).toLowerCase();

  async function onAccountSubmit(values: AccountStepValues) {
    try {
      await createAccount.mutateAsync(values);
      setFirstName(values.firstName);
      // Prefill nothing here: the organisation's name is not derivable from a person's.
      setStep(1);
    } catch (error) {
      toast.error(errorMessage(error, 'La création du compte a échoué.'));
    }
  }

  async function onOrganisationSubmit(values: OrganisationStepValues) {
    try {
      const org = await createOrganisation.mutateAsync(values);
      toast.success(`${org.name} est créée.`);
      router.push('/tenant/dashboard');
    } catch (error) {
      toast.error(errorMessage(error, "La création de l'organisation a échoué."));
    }
  }

  return (
    <div className="w-full">
      <StepRail current={step} />

      {step === 0 ? (
        <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" autoComplete="given-name" placeholder="Jean" {...accountForm.register('firstName')} />
              {accountForm.formState.errors.firstName && (
                <p className="text-negative text-xs">{accountForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" autoComplete="family-name" placeholder="Bisimwa" {...accountForm.register('lastName')} />
              {accountForm.formState.errors.lastName && (
                <p className="text-negative text-xs">{accountForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="jean.bisimwa@example.cd" {...accountForm.register('email')} />
            {accountForm.formState.errors.email && (
              <p className="text-negative text-xs">{accountForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput id="password" autoComplete="new-password" placeholder="********" {...accountForm.register('password')} />
            {accountForm.formState.errors.password ? (
              <p className="text-negative text-xs">{accountForm.formState.errors.password.message}</p>
            ) : (
              <p className="text-ink-subtle text-xs">8 caractères minimum, avec une majuscule et un chiffre.</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={createAccount.isPending}>
            {createAccount.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span className="ml-2">Création…</span>
              </>
            ) : (
              <>
                <span>Continuer</span>
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>

          <p className="text-sm text-ink-muted text-center">
            Vous avez déjà un compte?
            <Link href="/login" className="text-accent-text font-medium pl-2">Connectez-vous</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={orgForm.handleSubmit(onOrganisationSubmit)} className="space-y-5">
          <p className="text-sm text-ink-muted">
            Bienvenue{firstName ? `, ${firstName}` : ''}. Créons maintenant votre organisation —
            la ligue ou la fédération qui organise les compétitions.
          </p>

          <div className="space-y-2">
            <Label htmlFor="orgName">Nom de l&apos;organisation</Label>
            <Input
              id="orgName"
              placeholder="ex: Ligue Provinciale de Basketball de Kinshasa"
              {...orgForm.register('name')}
            />
            {orgForm.formState.errors.name && (
              <p className="text-negative text-xs">{orgForm.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantCode">
              Code court <span className="text-ink-subtle font-normal">(facultatif)</span>
            </Label>
            <Input
              id="tenantCode"
              transform="uppercase"
              maxCharacters={12}
              placeholder={suggestTenantCode(orgName || '') || 'LIPROBAKIN'}
              {...orgForm.register('tenantCode')}
            />
            <p className="text-xs text-ink-subtle">
              Votre adresse publique&nbsp;:{' '}
              <span className="text-accent-text">{previewCode || 'votre-code'}</span>.elenem.site
            </p>
            {orgForm.formState.errors.tenantCode && (
              <p className="text-negative text-xs">{orgForm.formState.errors.tenantCode.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sportType">Sport</Label>
              <Select
                value={orgForm.watch('sportType')}
                onValueChange={(value) => orgForm.setValue('sportType', value, { shouldValidate: true })}
              >
                <SelectTrigger id="sportType">
                  <SelectValue placeholder="Choisissez le sport" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SportType).map((type) => {
                    const Icon = getSportIcon(type);
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>
                            {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {orgForm.formState.errors.sportType && (
                <p className="text-negative text-xs">{orgForm.formState.errors.sportType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <CountryDropdown
                value={orgForm.watch('country')}
                onChange={(value) => orgForm.setValue('country', value, { shouldValidate: true })}
                valueType="short"
                className="w-full h-10 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {orgForm.formState.errors.country && (
                <p className="text-negative text-xs">{orgForm.formState.errors.country.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(0)}
              disabled={createOrganisation.isPending}
            >
              <ArrowLeft size={16} className="mr-2" />
              Retour
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={createOrganisation.isPending}
            >
              {createOrganisation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="ml-2">Création…</span>
                </>
              ) : (
                <span>Créer l&apos;organisation</span>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
