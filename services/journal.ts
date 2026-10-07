import { useQuery, keepPreviousData } from '@tanstack/react-query';
import * as z from 'zod';
import { api } from './api';
import { parseResponse } from './parse-response';
import type { ApiSchema } from '@/types/api-types';

// Types from the generated contract.
export type JournalPage = ApiSchema<'JournalPageDto'>;
export type JournalEntry = ApiSchema<'JournalEntryDto'>;

/** Checked on the way in; drift is logged in development and the raw page used (parseResponse). */
const JournalPageSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      at: z.string(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.string(),
      reason: z.string().nullable(),
      before: z.record(z.string(), z.unknown()).nullable(),
      after: z.record(z.string(), z.unknown()).nullable(),
      by: z.object({ id: z.string(), name: z.string() }).nullable(),
      subject: z.object({ label: z.string(), context: z.string().nullable() }).nullable(),
      organisation: z.string().nullable(),
    }),
  ),
  totalItems: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
  pageSize: z.number(),
  venues: z.record(z.string(), z.string()),
});

export type JournalCategory = 'CALENDAR' | 'SEASONS' | 'PLAYERS' | 'ACCOUNTS';

export interface JournalParams {
  page?: number;
  pageSize?: number;
  /** What this person did, and what was done to their account. */
  userId?: string;
  category?: JournalCategory;
  includeSignIns?: boolean;
  /** System administrators only. */
  tenantId?: string;
}

export const journalKeys = {
  all: ['journal'] as const,
  list: (params: JournalParams) => [...journalKeys.all, params] as const,
};

export async function fetchJournal(params: JournalParams): Promise<JournalPage> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== false) qs.append(k, String(v));
  }
  const res = await api.get(`/journal?${qs.toString()}`);
  return parseResponse(JournalPageSchema, res.data) as JournalPage;
}

/**
 * The journal: what happened, by whom, and why. A system administrator reads the platform, an
 * organisation's administrator their organisation — the API decides, the caller only narrows.
 */
export function useJournal(params: JournalParams, enabled = true) {
  return useQuery({
    queryKey: journalKeys.list(params),
    queryFn: () => fetchJournal(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}
