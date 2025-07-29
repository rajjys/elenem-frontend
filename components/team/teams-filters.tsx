// components/team/teams-filters.tsx
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
import { CountryDropdown } from 'react-country-region-selector';

import { TeamFilterParams } from '@/schemas';
import { TeamVisibility, Gender, Role, SportType } from '@/schemas'; // Prisma enums
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api'; // Your API instance
import { toast } from 'sonner';

interface TeamsFiltersProps {
  filters: TeamFilterParams;
  onFilterChange: (newFilters: TeamFilterParams) => void;
  onPageSizeChange: (pageSize: number) => void;
  fixedTenantId?: string | null; // Tenant ID if context is fixed (e.g., Tenant Admin page)
  fixedLeagueId?: string | null; // League ID if context is fixed (e.g., League Admin page)
}

interface TenantBasicDto { id: string; name: string; }
interface LeagueBasicDto { id: string; name: string; tenantId: string; sportType?: SportType; gender?: Gender; division?: string; }


export function TeamsFilters({ filters, onFilterChange, onPageSizeChange, fixedTenantId, fixedLeagueId }: TeamsFiltersProps) {
  const user = useAuthStore((state) => state.user);
  const isSystemAdmin = user?.roles?.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = user?.roles?.includes(Role.TENANT_ADMIN);
  //const isLeagueAdmin = user?.roles?.includes(Role.LEAGUE_ADMIN);

  const [search, setSearch] = useState(filters.search || '');
  const [selectedTenantId, setSelectedTenantId] = useState(fixedTenantId || filters.tenantId || '');
  const [selectedLeagueId, setSelectedLeagueId] = useState(fixedLeagueId || filters.leagueId || '');
  const [selectedCountry, setSelectedCountry] = useState(filters.country || '');
  const [selectedCity, setSelectedCity] = useState(filters.city || '');
  const [selectedState, setSelectedState] = useState(filters.state || '');
  const [isActive, setIsActive] = useState<boolean | undefined>(filters.isActive);
  const [selectedVisibility, setSelectedVisibility] = useState<TeamVisibility | undefined>(filters.visibility);
  const [selectedGender, setSelectedGender] = useState<Gender | undefined>(filters.gender);
  const [selectedSportType, setSelectedSportType] = useState<SportType | undefined>(filters.sportType);
  const [selectedDivision, setSelectedDivision] = useState(filters.division || '');
  const [establishedYearInput, setEstablishedYearInput] = useState<string>(filters.establishedYear?.toString() || '');
  const [pageSizeInput, setPageSizeInput] = useState(String(filters.pageSize || 10));

  const [debouncedSearch] = useDebounce(search, 500);
  const [debouncedEstablishedYearInput] = useDebounce(establishedYearInput, 500);
  const [debouncedPageSizeInput] = useDebounce(pageSizeInput, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [availableTenants, setAvailableTenants] = useState<TenantBasicDto[]>([]);
  const [availableLeagues, setAvailableLeagues] = useState<LeagueBasicDto[]>([]);

  // Memoize options
  const visibilityOptions = useMemo(() => Object.values(TeamVisibility).map(vis => ({
    value: vis,
    label: vis.charAt(0) + vis.slice(1).toLowerCase()
  })), []);

  const genderOptions = useMemo(() => Object.values(Gender).map(gen => ({
    value: gen,
    label: gen.charAt(0) + gen.slice(1).toLowerCase()
  })), []);

  const sportTypeOptions = useMemo(() => Object.values(SportType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ')
  })), []);


  // Fetch tenants (for System Admin)
  const fetchTenants = useCallback(async () => {
    if (!isSystemAdmin) return;
    try {
      const response = await api.get('/tenants?pageSize=100'); // Assuming endpoint
      setAvailableTenants(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch tenants.");
      console.error("Fetch tenants error:", err);
    }
  }, [isSystemAdmin]);

  // Fetch leagues based on selectedTenantId or fixedLeagueId
  const fetchLeagues = useCallback(async (tenantId?: string) => {
    const idToFetch = tenantId || fixedTenantId;
    if (!idToFetch && !fixedLeagueId) { // No tenant selected and no fixed league
      setAvailableLeagues([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (idToFetch) params.append('tenantId', idToFetch);
      if (fixedLeagueId) params.append('leagueId', fixedLeagueId); // If league is fixed, fetch only that one

      const response = await api.get(`/leagues?${params.toString()}&pageSize=100`); // Assuming endpoint
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

  // Apply filters after debounced search or other changes
  useEffect(() => {
    const newFilters: TeamFilterParams = {
      ...filters, // Preserve existing filters like sortBy, sortOrder
      search: debouncedSearch === '' ? undefined : debouncedSearch,
      tenantId: selectedTenantId === '' ? undefined : selectedTenantId,
      leagueId: selectedLeagueId === '' ? undefined : selectedLeagueId,
      country: selectedCountry === '' ? undefined : selectedCountry,
      city: selectedCity === '' ? undefined : selectedCity,
      state: selectedState === '' ? undefined : selectedState,
      isActive: isActive,
      visibility: selectedVisibility,
      gender: selectedGender,
      sportType: selectedSportType,
      division: selectedDivision === '' ? undefined : selectedDivision,
      establishedYear: debouncedEstablishedYearInput ? parseInt(debouncedEstablishedYearInput, 10) : undefined,
      page: 1, // Reset to first page on any filter change
    };

    // Only call onFilterChange if there's an actual change in filter values
    const hasChanged = Object.keys(newFilters).some(key =>
      newFilters[key as keyof TeamFilterParams] !== filters[key as keyof TeamFilterParams]
    );

    if (hasChanged) {
      onFilterChange(newFilters);
    }
  }, [
    debouncedSearch, selectedTenantId, selectedLeagueId, selectedCountry, selectedCity, selectedState,
    isActive, selectedVisibility, selectedGender, selectedSportType, selectedDivision, debouncedEstablishedYearInput,
    filters, onFilterChange,
    fixedTenantId, fixedLeagueId // Include fixed IDs in dependency array if they can change
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
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedState('');
    setIsActive(undefined);
    setSelectedVisibility(undefined);
    setSelectedGender(undefined);
    setSelectedSportType(undefined);
    setSelectedDivision('');
    setEstablishedYearInput('');
    setPageSizeInput(String(10));

    onFilterChange({
      ...filters, // Preserve sortBy, sortOrder if any
      search: undefined,
      tenantId: fixedTenantId || undefined,
      leagueId: fixedLeagueId || undefined,
      country: undefined,
      city: undefined,
      state: undefined,
      isActive: undefined,
      visibility: undefined,
      gender: undefined,
      sportType: undefined,
      division: undefined,
      establishedYear: undefined,
      page: 1,
    });
    onPageSizeChange(10);
  }, [filters, onFilterChange, onPageSizeChange, fixedTenantId, fixedLeagueId]);

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Search Input - always visible */}
      <div className="flex-grow max-w-sm">
        <Label htmlFor="teamSearch" className="sr-only">Search Teams</Label>
        <Input
          id="teamSearch"
          type="search"
          placeholder="Search by name or short code"
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
            <DialogTitle className="text-2xl font-bold text-gray-800">Advanced Team Filters</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apply additional filters to refine your team list.
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
                    {availableTenants?.map(tenant => (
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
                  disabled={!selectedTenantId && !fixedTenantId && (isSystemAdmin || isTenantAdmin)} // Disable if no tenant selected/fixed
                >
                  <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
                    <SelectValue placeholder="Select League" />
                  </SelectTrigger>
                  <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                    <SelectItem value="clear_selection">Clear Selection</SelectItem>
                    {availableLeagues?.map(league => (
                      <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!selectedTenantId && isSystemAdmin) && <p className="text-gray-500 text-xs mt-1">Select a tenant to load leagues.</p>}
                {(selectedTenantId || fixedTenantId) && availableLeagues?.length === 0 && <p className="text-gray-500 text-xs mt-1">No leagues found for this tenant.</p>}
              </div>
            )}

            {/* Status Switch (isActive) */}
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="teamStatus"
                checked={isActive || false}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="teamStatus" className="text-sm font-medium text-gray-700">Active Teams</Label>
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

            {/* Visibility Select */}
            <div>
              <Label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</Label>
              <Select
                value={selectedVisibility || ''}
                onValueChange={(value: TeamVisibility) => setSelectedVisibility(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="Select Visibility" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {visibilityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Input */}
            <div>
              <Label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</Label>
              <CountryDropdown
                value={selectedCountry}
                onChange={(val) => setSelectedCountry(val)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* City Input */}
            <div>
              <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</Label>
              <Input
                id="city"
                placeholder="e.g., London"
                value={selectedCity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedCity(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* State/Region Input */}
            <div>
              <Label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State/Region</Label>
              <Input
                id="state"
                placeholder="e.g., California"
                value={selectedState}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedState(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Gender Select (Inherited from League) */}
            <div>
              <Label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</Label>
              <Select
                value={selectedGender || ''}
                onValueChange={(value: Gender) => setSelectedGender(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {genderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sport Type Select (Inherited from League) */}
            <div>
              <Label htmlFor="sportType" className="block text-sm font-medium text-gray-700 mb-1">Sport Type</Label>
              <Select
                value={selectedSportType || ''}
                onValueChange={(value: SportType) => setSelectedSportType(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="Select Sport Type" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {sportTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Division Input (Inherited from League) */}
            <div>
              <Label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">Division</Label>
              <Input
                id="division"
                placeholder="e.g., Premier, A-League"
                value={selectedDivision}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDivision(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Established Year Input */}
            <div>
              <Label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700 mb-1">Established Year</Label>
              <Input
                id="establishedYear"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                placeholder="e.g., 1990"
                value={establishedYearInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstablishedYearInput(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Page Size Control */}
            <div className="flex items-center space-x-2 mt-4">
              <Label htmlFor="pageSize" className="text-sm font-medium text-gray-700">Teams per page</Label>
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