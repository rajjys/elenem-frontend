import * as z from 'zod';
import { LeagueDetailsSchema } from './league-schemas';
import { TenantDetailsSchema } from './tenant-schemas';
import { SeasonStatus } from './enums';

/**
 * What a season looks like coming back from the API.
 *
 * The create, update, filter and pagination schemas that used to live beside this are gone with
 * the screens that used them: seasons are read and written through `services/seasons.ts`, which
 * parses its own responses, the way every module built since Phase 2 does. A second set of shapes
 * here is how `isActive` came to disagree with `status` in the first place.
 */
export const SeasonDetailsSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  name: z.string(),
  slug: z.string(),
  startDate: z.string().datetime(), // ISO string
  endDate: z.string().datetime(),   // ISO string
  description: z.string().optional(),
  status: z.nativeEnum(SeasonStatus),
  leagueId: z.string(),
  tenantId: z.string(),
  league: LeagueDetailsSchema.optional(),
  tenant: TenantDetailsSchema.optional(),
});

export type SeasonDetails = z.infer<typeof SeasonDetailsSchema>;
