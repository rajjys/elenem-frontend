// Tenants data-access + React Query hooks. This is the reference for the
// per-module service pattern (Phase 2): a module owns its query-key factory,
// its fetchers (which call the shared `api` client and validate the response),
// and thin hooks over them. Pages consume the hooks instead of hand-rolling
// useState + useEffect + axios + loading/error flags.
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { api } from './api';
import {
  PaginatedTenantsResponseSchema,
  TenantDetailsSchema,
  type TenantFilterParams,
  type PaginatedTenantsResponseDto,
  type TenantDetails,
  type CreateTenantDto,
} from '@/schemas';

// Query keys — one factory per module so invalidation is precise and typo-safe.
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params: TenantFilterParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
};

function toQuery(params: TenantFilterParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.append('search', params.search);
  if (params.isActive !== undefined) qs.append('isActive', String(params.isActive));
  if (params.tenantType) qs.append('tenantType', params.tenantType);
  if (params.sportType) qs.append('sportType', params.sportType);
  if (params.country) qs.append('country', params.country);
  if (params.page) qs.append('page', String(params.page));
  if (params.pageSize) qs.append('pageSize', String(params.pageSize));
  if (params.sortBy) qs.append('sortBy', params.sortBy);
  if (params.sortOrder) qs.append('sortOrder', params.sortOrder);
  return qs.toString();
}

// --- Fetchers (pure; also usable outside React) ---
export async function fetchTenants(
  params: TenantFilterParams,
): Promise<PaginatedTenantsResponseDto> {
  const res = await api.get(`/tenants?${toQuery(params)}`);
  return PaginatedTenantsResponseSchema.parse(res.data);
}

export async function fetchTenant(id: string): Promise<TenantDetails> {
  const res = await api.get(`/tenants/${id}`);
  return TenantDetailsSchema.parse(res.data);
}

export async function createTenant(dto: CreateTenantDto): Promise<TenantDetails> {
  const res = await api.post('/tenants/create', dto);
  return TenantDetailsSchema.parse(res.data);
}

export async function deleteTenant(id: string): Promise<void> {
  await api.delete(`/tenants/${id}`);
}

// --- Hooks ---
export function useTenants(params: TenantFilterParams) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => fetchTenants(params),
    placeholderData: keepPreviousData, // smooth pagination — keep old page while next loads
  });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: tenantKeys.detail(id ?? ''),
    queryFn: () => fetchTenant(id as string),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.lists() }),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.lists() }),
  });
}
