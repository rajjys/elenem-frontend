import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { api, isAxiosError } from './api';
import { parseResponse } from './parse-response';
import { useAuthStore } from '@/store/auth.store';

/**
 * Bringing a league onto the platform.
 *
 * Nothing is written until the last step. The account and the organisation are created together
 * by one request, so abandoning the flow halfway leaves nothing behind and — the reason this
 * changed — going back to fix a typo in your own name is possible, because that name has not
 * been submitted anywhere yet.
 *
 * The cost is that a taken email would otherwise only surface at the very end, after six fields.
 * `useCheckAvailability` pays that back by asking as the organiser leaves the step where they
 * typed it.
 */

// --- validation ---------------------------------------------------------------------------

export const AccountStepSchema = z.object({
  firstName: z.string().trim().min(2, 'Prénom requis'),
  lastName: z.string().trim().min(2, 'Nom requis'),
  email: z.string().trim().email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .regex(/(?=.*[a-z])/, 'Il manque une minuscule')
    .regex(/(?=.*[A-Z])/, 'Il manque une majuscule')
    .regex(/(?=.*[\d\W])/, 'Il manque un chiffre ou un symbole'),
});

export const OrganisationStepSchema = z.object({
  organisationName: z.string().trim().min(3, "Nom de l'organisation requis"),
  tenantCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]*$/, 'Lettres, chiffres et tirets seulement')
    .max(12, '12 caractères au maximum')
    .optional(),
  sportType: z.string().min(1, 'Choisissez un sport'),
  country: z.string().length(2, 'Choisissez un pays'),
});

export const RegisterOrganisationSchema = AccountStepSchema.merge(OrganisationStepSchema);

export type AccountStepValues = z.infer<typeof AccountStepSchema>;
export type OrganisationStepValues = z.infer<typeof OrganisationStepSchema>;
export type RegisterOrganisationValues = z.infer<typeof RegisterOrganisationSchema>;

/** Fields the server can reject by name, so the message lands under the input it concerns. */
export type OnboardingField = 'email' | 'organisationName' | 'tenantCode';

/**
 * Server errors carry the field they belong to.
 *
 * Without it a 409 became a floating toast, which then outlived the thing it described: clear
 * the email, submit again, and the stale "that address already exists" was still on screen next
 * to an empty box. A field error is bound to its input and disappears when the input changes.
 */
export function onboardingError(error: unknown): { field?: OnboardingField; message: string } {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[]; field?: OnboardingField } | undefined;
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    if (message) return { field: data?.field, message };
  }
  return { message: 'Une erreur est survenue. Réessayez.' };
}

// --- availability -------------------------------------------------------------------------

const AvailabilitySchema = z.object({
  email: z.enum(['free', 'taken']).optional(),
  organisationName: z.enum(['free', 'taken']).optional(),
  tenantCode: z.enum(['free', 'taken']).optional(),
});

export type AvailabilityQuery = { email?: string; organisationName?: string; tenantCode?: string };

export function useCheckAvailability() {
  return useMutation({
    mutationFn: async (query: AvailabilityQuery) => {
      const res = await api.post('/onboarding/availability', query);
      return parseResponse(AvailabilitySchema, res.data);
    },
  });
}

// --- the one write ------------------------------------------------------------------------

const RegisterResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    tenantCode: z.string(),
    sportType: z.string().optional(),
  }),
});

export type RegisterResult = z.infer<typeof RegisterResultSchema>;

export function useRegisterOrganisation() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  return useMutation({
    mutationFn: async (values: RegisterOrganisationValues) => {
      const res = await api.post('/onboarding/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        organisationName: values.organisationName,
        tenantCode: values.tenantCode?.trim() ? values.tenantCode.trim().toUpperCase() : undefined,
        sportType: values.sportType,
        country: values.country.toUpperCase(),
      });
      return parseResponse(RegisterResultSchema, res.data);
    },
    onSuccess: async (data) => {
      // The response already describes the new TENANT_ADMIN. Signing in with the tokens issued
      // here rather than re-authenticating is what keeps the flow unbroken.
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      await fetchUser();
    },
  });
}

// --- derivation ---------------------------------------------------------------------------

/**
 * The short code suggested from an organisation's name.
 *
 * Mirrors the backend so the field can be prefilled with what would happen anyway, and an
 * organiser who already has an acronym — LIPROBAKIN — can simply type it over.
 */
export function suggestTenantCode(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length >= 3);

  const base =
    words.length >= 2
      ? words.map((w) => w[0]).join('')
      : (words[0] ?? name.replace(/[^A-Za-z0-9]/g, ''));

  return base.toUpperCase().slice(0, 12);
}
