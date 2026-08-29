import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';
import { useAuthStore } from '@/store/auth.store';
import type { SportType } from '@/schemas';

/**
 * Sign-up and organisation creation, as one flow.
 *
 * These were two disconnected forms with an email round-trip between them, which is why a new
 * league stalled at exactly the point it had shown the most intent. They are one sequence now,
 * and each step asks for the fewest fields the backend can work with — everything else has a
 * default or a derivation and belongs on a settings page the organiser visits later, if ever.
 */

// --- Step 1: the account ------------------------------------------------------------------

export const AccountStepSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Adresse email invalide'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .regex(/(?=.*[a-z])/, 'Il faut au moins une minuscule')
    .regex(/(?=.*[A-Z])/, 'Il faut au moins une majuscule')
    .regex(/(?=.*[\d\W])/, 'Il faut au moins un chiffre ou un symbole'),
});

export type AccountStepValues = z.infer<typeof AccountStepSchema>;

// The response carries tokens; `user` is whatever the backend chose to include, and this schema
// deliberately does not try to mirror all of it. parseResponse falls back to the raw payload on
// drift, so listing every profile field here would only add ways to be wrong.
const AuthResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.unknown().optional(),
});

/**
 * Creates the account and signs the user straight in.
 *
 * No username is sent: the backend derives one from the email address. It stays a valid login
 * credential, it just is not a field anyone has to invent while signing up.
 */
export function useCreateAccount() {
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: async (values: AccountStepValues) => {
      const res = await api.post('/auth/register', values);
      return parseResponse(AuthResultSchema, res.data);
    },
    onSuccess: (data) => {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}

// --- Step 2: the organisation -------------------------------------------------------------

export const OrganisationStepSchema = z.object({
  name: z.string().min(3, "Nom de l'organisation requis"),
  // Prefilled from the name and editable, because it is the public web address. Left blank the
  // backend derives an acronym.
  tenantCode: z
    .string()
    .regex(/^[A-Za-z0-9-]*$/, 'Lettres, chiffres et tirets seulement')
    .max(12, 'Douze caractères au maximum')
    .optional(),
  sportType: z.string().min(1, 'Choisissez un sport'),
  country: z.string().min(2, 'Choisissez un pays'),
});

export type OrganisationStepValues = z.infer<typeof OrganisationStepSchema>;

const OrganisationResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  tenantCode: z.string(),
  // Present when the creator became the owner — see below.
  auth: z
    .object({ accessToken: z.string(), refreshToken: z.string() })
    .optional(),
});

/**
 * Creates the organisation and swaps in the tokens it returns.
 *
 * That swap is not optional. Creating an organisation turns a GENERAL_USER into its
 * TENANT_ADMIN, and a JWT records the roles held when it was signed — so without new tokens the
 * very next request is rejected as a tenant mismatch and onboarding ends in a logout one step
 * after sign-up. The backend hands back fresh tokens for exactly this reason.
 */
export function useCreateOrganisation() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  return useMutation({
    mutationFn: async (values: OrganisationStepValues) => {
      const res = await api.post('/tenants/create', {
        name: values.name,
        tenantCode: values.tenantCode?.trim() ? values.tenantCode.trim().toUpperCase() : undefined,
        sportType: values.sportType as SportType,
        country: values.country,
      });
      return parseResponse(OrganisationResultSchema, res.data);
    },
    onSuccess: async (data) => {
      if (data.auth) {
        setTokens(data.auth);
        // Only now can this succeed: the previous token described a user with no organisation.
        await fetchUser();
      }
    },
  });
}

/**
 * A short code suggested from the organisation's name.
 *
 * Mirrors the backend's derivation so the field is prefilled with what would happen anyway, and
 * an organiser who has an acronym they already use — LIPROBAKIN, say — can simply type it over.
 */
export function suggestTenantCode(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length > 2);

  const base =
    words.length >= 2
      ? words.map((w) => w[0]).join('')
      : (words[0] ?? name.replace(/[^A-Za-z0-9]/g, ''));

  return base.toUpperCase().slice(0, 12);
}
