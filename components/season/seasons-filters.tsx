// components/season/seasons-filters.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from 'use-debounce';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Filter as FilterIcon } from 'lucide-react';

import { SeasonFilterParams, SeasonStatus, Roles, PaginatedLeaguesResponseDto } from '@/schemas'; // Your filter schema
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api'; // Your API instance
import { toast } from 'sonner';

interface SeasonsFiltersProps {
  filters: SeasonFilterParams;
  onFilterChange: (newFilters: SeasonFilterParams) => void;
  onPageSizeChange: (pageSize: number) => void;
  fixedTenantId?: string | null; // Tenant ID if context is fixed
  fixedLeagueId?: string | null; // League ID if context is fixed
}

interface TenantBasicDto { id: string; name: string; }
interface LeagueBasicDto { id: string; name: string; tenantId: string; }

export function SeasonsFilters({ filters, onFilterChange, onPageSizeChange, fixedTenantId, fixedLeagueId }: SeasonsFiltersProps) {
  const user = useAuthStore((state) => state.user);
  const isSystemAdmin = user?.roles?.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = user?.roles?.includes(Roles.TENANT_ADMIN);
  //const isLeagueAdmin = user?.roles?.includes(Role.LEAGUE_ADMIN);

  const [search, setSearch] = useState(filters.search || '');
  const [selectedTenantId, setSelectedTenantId] = useState(fixedTenantId || filters.tenantId || '');
  const [selectedLeagueId, setSelectedLeagueId] = useState(fixedLeagueId || filters.leagueId || '');
  const [isActive, setIsActive] = useState<boolean | undefined>(filters.isActive);
  const [selectedStatus, setSelectedStatus] = useState<SeasonStatus | undefined>(filters.status);
  const [startDateAfter, setStartDateAfter] = useState(filters.startDateAfter || '');
  const [startDateBefore, setStartDateBefore] = useState(filters.startDateBefore || '');
  const [endDateAfter, setEndDateAfter] = useState(filters.endDateAfter || '');
  const [endDateBefore, setEndDateBefore] = useState(filters.endDateBefore || '');
  const [pageSizeInput, setPageSizeInput] = useState(String(filters.pageSize || 10));

  const [debouncedSearch] = useDebounce(search, 500);
  const [debouncedStartDateAfter] = useDebounce(startDateAfter, 500);
  const [debouncedStartDateBefore] = useDebounce(startDateBefore, 500);
  const [debouncedEndDateAfter] = useDebounce(endDateAfter, 500);
  const [debouncedEndDateBefore] = useDebounce(endDateBefore, 500);
  const [debouncedPageSizeInput] = useDebounce(pageSizeInput, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [availableTenants, setAvailableTenants] = useState<TenantBasicDto[]>([]);
  const [availableLeagues, setAvailableLeagues] = useState<LeagueBasicDto[]>([]);

  // Memoize options
  const statusOptions = useMemo(() => Object.values(SeasonStatus).map(status => ({
    value: status,
    label: status.replace(/_/g, ' ')
  })), []);

  // Fetch tenants (for System Admin)
  const fetchTenants = useCallback(async () => {
    if (!isSystemAdmin) return;
    try {
      const response = await api.get('/tenants', { params: { take: 100 } });
      setAvailableTenants(response.data.items);
    } catch (err) {
      toast.error("Failed to fetch tenants.");
      console.error("Fetch tenants error:", err);
    }
  }, [isSystemAdmin]);

  // Fetch leagues based on selectedTenantId or fixedLeagueId
  const fetchLeagues = useCallback(async (tenantId?: string) => {
    const idToFetch = tenantId || fixedTenantId;
    if (!idToFetch && !fixedLeagueId) {
      setAvailableLeagues([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (idToFetch) params.append('tenantId', idToFetch);
      if (fixedLeagueId) params.append('leagueId', fixedLeagueId);

      const response = await api.get<PaginatedLeaguesResponseDto>(`/leagues`, { params: { ...Object.fromEntries(params), take: 100 } });
      setAvailableLeagues(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch leagues.");
      console.error("Fetch leagues error:", err);
    }
  }, [fixedTenantId, fixedLeagueId]);

  // Initial fetch for System Admin
  useEffect(() => {
    if (isSystemAdmin) {
      fetchTenants();
    }
  }, [isSystemAdmin, fetchTenants]);

  // Fetch leagues when tenant changes (for System Admin or Tenant Admin)
  useEffect(() => {
    if (isSystemAdmin || isTenantAdmin) {
      fetchLeagues(selectedTenantId);
    }
  }, [isSystemAdmin, isTenantAdmin, selectedTenantId, fetchLeagues]);

  // Apply filters after debounced changes
  useEffect(() => {
    const newFilters: SeasonFilterParams = {
      ...filters,
      search: debouncedSearch === '' ? undefined : debouncedSearch,
      tenantId: selectedTenantId === '' ? undefined : selectedTenantId,
      leagueId: selectedLeagueId === '' ? undefined : selectedLeagueId,
      isActive: isActive,
      status: selectedStatus,
      startDateAfter: debouncedStartDateAfter === '' ? undefined : debouncedStartDateAfter,
      startDateBefore: debouncedStartDateBefore === '' ? undefined : debouncedStartDateBefore,
      endDateAfter: debouncedEndDateAfter === '' ? undefined : debouncedEndDateAfter,
      endDateBefore: debouncedEndDateBefore === '' ? undefined : debouncedEndDateBefore,
      page: 1, // Reset to first page on any filter change
    };

    const hasChanged = Object.keys(newFilters).some(key =>
      newFilters[key as keyof SeasonFilterParams] !== filters[key as keyof SeasonFilterParams]
    );

    if (hasChanged) {
      onFilterChange(newFilters);
    }
  }, [
    debouncedSearch, selectedTenantId, selectedLeagueId, isActive, selectedStatus,
    debouncedStartDateAfter, debouncedStartDateBefore, debouncedEndDateAfter, debouncedEndDateBefore,
    filters, onFilterChange, fixedTenantId, fixedLeagueId
  ]);

  // Handle page size change
  useEffect(() => {
    const newSize = parseInt(debouncedPageSizeInput, 10);
    if (!isNaN(newSize) && newSize >= 1 && newSize <= 100 && newSize !== filters.pageSize) {
      onPageSizeChange(newSize);
    }
  }, [debouncedPageSizeInput, onPageSizeChange, filters.pageSize]);

  // Function to reset all filters
  const handleClearAllFilters = useCallback(() => {
    setSearch('');
    setSelectedTenantId(fixedTenantId || '');
    setSelectedLeagueId(fixedLeagueId || '');
    setIsActive(undefined);
    setSelectedStatus(undefined);
    setStartDateAfter('');
    setStartDateBefore('');
    setEndDateAfter('');
    setEndDateBefore('');
    setPageSizeInput(String(10));

    onFilterChange({
      ...filters,
      search: undefined,
      tenantId: fixedTenantId || undefined,
      leagueId: fixedLeagueId || undefined,
      isActive: undefined,
      status: undefined,
      startDateAfter: undefined,
      startDateBefore: undefined,
      endDateAfter: undefined,
      endDateBefore: undefined,
      page: 1,
    });
    onPageSizeChange(10);
  }, [filters, onFilterChange, onPageSizeChange, fixedTenantId, fixedLeagueId]);

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Search Input - always visible */}
      <div className="flex-grow max-w-sm">
        <Label htmlFor="seasonSearch" className="sr-only">Search Seasons</Label>
        <Input
          id="seasonSearch"
          type="search"
          placeholder="Search by season name"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Button and Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-md shadow-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 transition duration-300 ease-in-out transform hover:scale-105">
            <FilterIcon className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] rounded-lg shadow-xl p-6 bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">Advanced Season Filters</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apply additional filters to refine your season list.
            </DialogDescription>
          </DialogHeader>
          {/* Advanced filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">

            {/* Tenant Selection (System Admin only) */}
            {isSystemAdmin && (
              <div>
                <Label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 mb-1">Tenant</Label>
                <Select
                  value={selectedTenantId}
                  onValueChange={(value) => setSelectedTenantId(value === 'clear_selection' ? '' : value)}
                >
                  <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                    <SelectItem value="clear_selection">Clear Selection</SelectItem>
                    {availableTenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* League Selection (System Admin, Tenant Admin) */}
            {(isSystemAdmin || isTenantAdmin) && !fixedLeagueId && (
              <div>
                <Label htmlFor="leagueId" className="block text-sm font-medium text-gray-700 mb-1">League</Label>
                <Select
                  value={selectedLeagueId}
                  onValueChange={(value) => setSelectedLeagueId(value === 'clear_selection' ? '' : value)}
                  disabled={!selectedTenantId && !fixedTenantId}
                >
                  <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
                    <SelectValue placeholder="Select League" />
                  </SelectTrigger>
                  <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                    <SelectItem value="clear_selection">Clear Selection</SelectItem>
                    {availableLeagues.map(league => (
                      <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!selectedTenantId && isSystemAdmin) && <p className="text-gray-500 text-xs mt-1">Select a tenant to load leagues.</p>}
                {(selectedTenantId || fixedTenantId) && availableLeagues.length === 0 && <p className="text-gray-500 text-xs mt-1">No leagues found for this tenant.</p>}
              </div>
            )}

            {/* Status Switch (isActive) */}
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="seasonStatusActive"
                checked={isActive || false}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="seasonStatusActive" className="text-sm font-medium text-gray-700">Active Seasons</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsActive(undefined)}
                className="ml-2 text-gray-500 hover:bg-gray-100 rounded-md px-2 py-1"
                disabled={isActive === undefined}
              >
                Clear
              </Button>
            </div>

            {/* Season Status Select */}
            <div>
              <Label htmlFor="seasonStatus" className="block text-sm font-medium text-gray-700 mb-1">Season Status</Label>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value: SeasonStatus) => setSelectedStatus(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Range */}
            <div>
              <Label htmlFor="startDateAfter" className="block text-sm font-medium text-gray-700 mb-1">Start Date After</Label>
              <Input
                id="startDateAfter"
                type="date"
                value={startDateAfter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDateAfter(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="startDateBefore" className="block text-sm font-medium text-gray-700 mb-1">Start Date Before</Label>
              <Input
                id="startDateBefore"
                type="date"
                value={startDateBefore}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDateBefore(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* End Date Range */}
            <div>
              <Label htmlFor="endDateAfter" className="block text-sm font-medium text-gray-700 mb-1">End Date After</Label>
              <Input
                id="endDateAfter"
                type="date"
                value={endDateAfter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDateAfter(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <Label htmlFor="endDateBefore" className="block text-sm font-medium text-gray-700 mb-1">End Date Before</Label>
              <Input
                id="endDateBefore"
                type="date"
                value={endDateBefore}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDateBefore(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Page Size Control */}
            <div className="flex items-center space-x-2 mt-4">
              <Label htmlFor="pageSize" className="text-sm font-medium text-gray-700">Seasons per page</Label>
              <Input
                id="pageSize"
                type="number"
                min="1"
                max="100"
                value={pageSizeInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPageSizeInput(e.target.value)}
                className="w-20"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={handleClearAllFilters}
              className="bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm transition duration-300 ease-in-out"
            >
              Clear All Filters
            </Button>
            <Button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm transition duration-300 ease-in-out"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
