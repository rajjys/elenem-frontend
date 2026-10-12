import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { api, isAxiosError } from './api';
import { parseResponse } from './parse-response';
import type { ApiSchema } from '@/types/api-types';
import { userKeys } from './users';

// Types from the generated contract.
export type InviteInput = ApiSchema<'InviteDto'>;
export type InviteRole = InviteInput['role'];
export type AdminRole = ApiSchema<'GrantAccessDto'>['role'];
export type InviteResult = ApiSchema<'InviteResultDto'>;

const PersonSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  roles: z.array(z.string()),
  tenantId: z.string().nullable(),
  managingLeagueId: z.string().nullable(),
  managingTeamId: z.string().nullable(),
});
const InviteResultSchema = z.object({ person: PersonSchema, created: z.boolean(), invited: z.boolean() });

/**
 * Who runs what (backend `src/access`, ROADMAP_V2 §15). The API decides every rule — who may, the
 * owner, the last administrator, one competition per person — and says so in French; these hooks
 * only carry the request and refresh what shows a person's roles afterwards.
 */
function useAccessMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      // Everything that shows who runs what.
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: accessKeys.all });
      qc.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export const accessKeys = {
  all: ['access'] as const,
  leagueAdmins: (leagueId: string) => [...accessKeys.all, 'league', leagueId] as const,
  teamAdmins: (teamId: string) => [...accessKeys.all, 'team', teamId] as const,
};

/** A person who runs a competition or a club, as the panels list them. */
const AdminSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
});
export type Admin = z.infer<typeof AdminSchema>;

/** A competition's administrators. Readable by its own administrators too. */
export function useLeagueAdmins(leagueId: string | undefined) {
  return useQuery({
    queryKey: accessKeys.leagueAdmins(leagueId ?? ''),
    queryFn: async () => parseResponse(z.array(AdminSchema), (await api.get(`/leagues/${leagueId}/admins`)).data),
    enabled: !!leagueId,
  });
}

/**
 * A club's administrators, from the club itself rather than the users list: a competition's
 * administrator may read its clubs but not list their people.
 */
export function useTeamAdmins(teamId: string | undefined) {
  return useQuery({
    queryKey: accessKeys.teamAdmins(teamId ?? ''),
    queryFn: async () => {
      const team = (await api.get(`/teams/${teamId}`)).data as { managers?: unknown };
      return parseResponse(z.array(AdminSchema), team.managers ?? []);
    },
    enabled: !!teamId,
  });
}

/** « Inviter quelqu'un »: an address, and what they will do. */
export function useInvite() {
  return useAccessMutation(async (input: InviteInput) =>
    parseResponse(InviteResultSchema, (await api.post('/access/invite', input)).data) as InviteResult,
  );
}

export function useGrantAccess() {
  return useAccessMutation(async (input: { userId: string; role: AdminRole; leagueId?: string; teamId?: string }) =>
    parseResponse(PersonSchema, (await api.post('/access/grant', input)).data),
  );
}

export function useRevokeAccess() {
  return useAccessMutation(async (input: { userId: string; role: AdminRole }) =>
    parseResponse(PersonSchema, (await api.post('/access/revoke', input)).data),
  );
}

/** « Renvoyer l'invitation »: a fresh three-day code to someone who has not chosen a password. */
export function useResendInvitation() {
  return useAccessMutation(async (userId: string) =>
    (await api.post('/access/resend-invitation', { userId })).data as { message: string },
  );
}

/**
 * The refusal an unverified inviter gets (D4). It carries a code so a screen can offer the
 * verification rather than show a dead end.
 */
export function isEmailNotVerified(error: unknown): boolean {
  return isAxiosError(error) && (error.response?.data as { code?: string } | undefined)?.code === 'EMAIL_NOT_VERIFIED';
}
