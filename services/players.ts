// Players data-access + React Query hooks, following the services/tenants.ts pattern.
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from './api';
import { parseResponse } from './parse-response';
import {
  PaginatedPlayersSchema,
  PlayerSchema,
  type PaginatedPlayers,
  type Player,
  type PlayerFilterParams,
  type CreatePlayerDto,
  type UpdatePlayerDto,
} from '@/schemas/player-schemas';

export const playerKeys = {
  all: ['players'] as const,
  lists: () => [...playerKeys.all, 'list'] as const,
  list: (params: PlayerFilterParams) => [...playerKeys.lists(), params] as const,
  details: () => [...playerKeys.all, 'detail'] as const,
  detail: (id: string) => [...playerKeys.details(), id] as const,
};

// GET /players paginates with skip/take rather than page/pageSize, so translate here and keep
// page/pageSize as the vocabulary every list screen in the app already speaks.
function toQuery(params: PlayerFilterParams): string {
  const qs = new URLSearchParams();
  const pageSize = params.pageSize ?? 20;
  const page = params.page ?? 1;
  if (params.q) qs.append('q', params.q);
  if (params.leagueId) qs.append('leagueId', params.leagueId);
  if (params.teamId) qs.append('teamId', params.teamId);
  if (params.tenantId) qs.append('tenantId', params.tenantId);
  qs.append('skip', String((page - 1) * pageSize));
  qs.append('take', String(pageSize));
  return qs.toString();
}

export async function fetchPlayers(params: PlayerFilterParams): Promise<PaginatedPlayers> {
  const res = await api.get(`/players?${toQuery(params)}`);
  return parseResponse(PaginatedPlayersSchema, res.data);
}

export async function fetchPlayer(id: string): Promise<Player> {
  const res = await api.get(`/players/${id}`);
  return parseResponse(PlayerSchema, res.data);
}

export async function createPlayer(dto: CreatePlayerDto): Promise<Player> {
  const res = await api.post('/players', dto);
  return parseResponse(PlayerSchema, res.data);
}

export async function updatePlayer(id: string, dto: UpdatePlayerDto): Promise<Player> {
  const res = await api.put(`/players/${id}`, dto);
  return parseResponse(PlayerSchema, res.data);
}

export async function deletePlayer(id: string): Promise<void> {
  await api.delete(`/players/${id}`);
}

export async function assignPlayerToTeam(playerId: string, teamId: string): Promise<void> {
  await api.post('/players/assign-to-team', { playerId, teamId });
}

export function usePlayers(params: PlayerFilterParams, enabled = true) {
  return useQuery({
    queryKey: playerKeys.list(params),
    queryFn: () => fetchPlayers(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: playerKeys.detail(id ?? ''),
    queryFn: () => fetchPlayer(id as string),
    enabled: !!id,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => qc.invalidateQueries({ queryKey: playerKeys.lists() }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlayerDto }) => updatePlayer(id, dto),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: playerKeys.lists() });
      qc.invalidateQueries({ queryKey: playerKeys.detail(v.id) });
    },
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => qc.invalidateQueries({ queryKey: playerKeys.lists() }),
  });
}

/**
 * Creates a whole team sheet in one action.
 *
 * Entering a roster one form at a time is the reason a coach gives up on the product, so the UI
 * takes a pasted list of names. There is no bulk endpoint yet, so this posts sequentially and
 * reports per-row outcomes — one bad row (a duplicate jersey number, say) must not cost the
 * organiser the other fourteen.
 */
export async function createPlayersBulk(
  rows: CreatePlayerDto[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ created: Player[]; failed: { row: CreatePlayerDto; error: string }[] }> {
  const created: Player[] = [];
  const failed: { row: CreatePlayerDto; error: string }[] = [];
  for (const [i, row] of rows.entries()) {
    try {
      created.push(await createPlayer(row));
    } catch (e) {
      const { getApiErrorMessage } = await import('./api');
      failed.push({ row, error: getApiErrorMessage(e) });
    }
    onProgress?.(i + 1, rows.length);
  }
  return { created, failed };
}
