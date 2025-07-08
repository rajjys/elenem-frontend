// components/league/league-filters.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select'; // Assuming MultiSelect exists
import { Switch } from '@/components/ui/switch';
import { useDebounce } from 'use-debounce'; // Your useDebounce hook

// Your Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Your League-specific types and enums from prisma
import { LeagueFilterParams, SportType, LeagueVisibility, Gender } from '@/schemas';

// Icons from Lucide React
import { Filter as FilterIcon, Search as SearchIcon } from 'lucide-react';


interface LeagueFiltersProps {
  filters: LeagueFilterParams;
  onFilterChange: (newFilters: LeagueFilterParams) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function LeagueFilters({ filters, onFilterChange, onPageSizeChange }: LeagueFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedSportType, setSelectedSportType] = useState<SportType | undefined>(filters.sportType);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(filters.country);
  const [selectedVisibility, setSelectedVisibility] = useState<LeagueVisibility | undefined>(filters.visibility);
  const [isActive, setIsActive] = useState<boolean | undefined>(filters.isActive); // Corresponds to `isActive`
  const [selectedGender, setSelectedGender] = useState<Gender | undefined>(filters.gender);
  const [selectedParentLeagueId, setSelectedParentLeagueId] = useState<string | undefined>(filters.parentLeagueId);
  const [selectedDivision, setSelectedDivision] = useState<string | undefined>(filters.division);
  const [establishedYearInput, setEstablishedYearInput] = useState<string | undefined>(filters.establishedYear?.toString() || '');
  const [pageSizeInput, setPageSizeInput] = useState(String(filters.pageSize || 10));

  const [debouncedSearch] = useDebounce(search, 500);
  const [debouncedEstablishedYearInput] = useDebounce(establishedYearInput, 500);
  const [debouncedPageSizeInput] = useDebounce(pageSizeInput, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Memoize options for Selects
  const sportTypeOptions = useMemo(() => Object.values(SportType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ')
  })), []);

  const visibilityOptions = useMemo(() => Object.values(LeagueVisibility).map(vis => ({
    value: vis,
    label: vis.charAt(0) + vis.slice(1).toLowerCase()
  })), []);

  const genderOptions = useMemo(() => Object.values(Gender).map(gen => ({
    value: gen,
    label: gen.charAt(0) + gen.slice(1).toLowerCase()
  })), []);

  // For countries, you might have a predefined list or fetch dynamically.
  // Using a small example list.
  const countryOptions = useMemo(() => [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    // ... add more countries (ISO 3166-1 alpha-2)
  ], []);

  // For parentLeagueId, you'd typically fetch available parent leagues.
  // For now, a mock or empty list.
  const parentLeagueOptions = useMemo(() => [
    // { value: 'some-parent-league-id-1', label: 'Premier League (Top)' },
    // { value: 'some-parent-league-id-2', label: 'NBA (Main)' },
    // ... actual parent leagues
  ], []);


  // Apply filters after debounced search or other changes
  useEffect(() => {
    const newSearch = debouncedSearch === '' ? undefined : debouncedSearch;
    const newSportType = selectedSportType;
    const newCountry = selectedCountry;
    const newVisibility = selectedVisibility;
    const newisActive = isActive;
    const newGender = selectedGender;
    const newParentLeagueId = selectedParentLeagueId;
    const newDivision = selectedDivision === '' ? undefined : selectedDivision;
    const newEstablishedYear = debouncedEstablishedYearInput ? parseInt(debouncedEstablishedYearInput, 10) : undefined;


    // Check if any filter value has genuinely changed before calling onFilterChange
    const hasSearchChanged = newSearch !== (filters.search || undefined);
    const hasSportTypeChanged = newSportType !== filters.sportType;
    const hasCountryChanged = newCountry !== filters.country;
    const hasVisibilityChanged = newVisibility !== filters.visibility;
    const hasStatusChanged = newisActive !== filters.isActive;
    const hasGenderChanged = newGender !== filters.gender;
    const hasParentLeagueIdChanged = newParentLeagueId !== filters.parentLeagueId;
    const hasDivisionChanged = newDivision !== (filters.division || undefined);
    const hasEstablishedYearChanged = newEstablishedYear !== (filters.establishedYear || undefined);


    if (hasSearchChanged || hasSportTypeChanged || hasCountryChanged || hasVisibilityChanged ||
        hasStatusChanged || hasGenderChanged || hasParentLeagueIdChanged || hasDivisionChanged ||
        hasEstablishedYearChanged) {
      onFilterChange({
        ...filters, // Preserve other filters like tenantIds, leagueIds, sortBy, sortOrder
        search: newSearch,
        sportType: newSportType,
        country: newCountry,
        visibility: newVisibility,
        isActive: newisActive,
        gender: newGender,
        parentLeagueId: newParentLeagueId,
        division: newDivision,
        establishedYear: newEstablishedYear,
        page: 1, // Reset to first page on filter change
      });
    }
  }, [
    debouncedSearch,
    selectedSportType,
    selectedCountry,
    selectedVisibility,
    isActive,
    selectedGender,
    selectedParentLeagueId,
    selectedDivision,
    debouncedEstablishedYearInput,
    filters,
    onFilterChange
  ]);

  // Handle page size change
  useEffect(() => {
    const newSize = parseInt(debouncedPageSizeInput, 10);
    if (!isNaN(newSize) && newSize >= 1 && newSize <= 50 && newSize !== filters.pageSize) {
      onPageSizeChange(newSize);
    }
  }, [debouncedPageSizeInput, onPageSizeChange, filters.pageSize]);

  // Function to reset all filters
  const handleClearAllFilters = useCallback(() => {
    setSearch('');
    setSelectedSportType(undefined);
    setSelectedCountry(undefined);
    setSelectedVisibility(undefined);
    setIsActive(undefined);
    setSelectedGender(undefined);
    setSelectedParentLeagueId(undefined);
    setSelectedDivision(undefined);
    setEstablishedYearInput('');
    setPageSizeInput(String(10));

    onFilterChange({
      ...filters, // Preserve sortBy, sortOrder if any
      search: undefined,
      sportType: undefined,
      country: undefined,
      visibility: undefined,
      isActive: undefined,
      gender: undefined,
      parentLeagueId: undefined,
      division: undefined,
      establishedYear: undefined,
      page: 1,
    });
    onPageSizeChange(10);
  }, [filters, onFilterChange, onPageSizeChange]);

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Search Input - always visible */}
      <div className="flex-grow max-w-sm">
        <Label htmlFor="leagueSearch" className="sr-only">Search Leagues</Label>
        <Input
          id="leagueSearch"
          type="search"
          placeholder="Search by name or code"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Button and Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-md shadow-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 transition duration-300 ease-in-out transform hover:scale-105">
            <FilterIcon className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] rounded-lg shadow-xl p-6 bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">Advanced League Filters</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apply additional filters to refine your league list.
            </DialogDescription>
          </DialogHeader>
          {/* Advanced filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {/* Status Switch (corresponds to isActive) */}
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="leagueStatus"
                checked={isActive || false}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="leagueStatus" className="text-sm font-medium text-gray-700">Active Leagues</Label>
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

            {/* Sport Type Select */}
            <div>
              <Label htmlFor="sportType" className="block text-sm font-medium text-gray-700 mb-1">Sport Type</Label>
              <Select
                value={selectedSportType || ''}
                onValueChange={(value: SportType) => setSelectedSportType(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select Sport" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {sportTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Select */}
            <div>
              <Label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</Label>
              <Select
                value={selectedCountry || ''}
                onValueChange={(value: string) => setSelectedCountry(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {countryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visibility Select */}
            <div>
              <Label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</Label>
              <Select
                value={selectedVisibility || ''}
                onValueChange={(value: LeagueVisibility) => setSelectedVisibility(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
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

            {/* Gender Select */}
            <div>
              <Label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</Label>
              <Select
                value={selectedGender}
                onValueChange={(value: Gender) => setSelectedGender(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
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

            {/* Parent League ID Select 
            <div>
              <Label htmlFor="parentLeague" className="block text-sm font-medium text-gray-700 mb-1">Parent League</Label>
              <Select
                value={selectedParentLeagueId || ''}
                onValueChange={(value: string) => setSelectedParentLeagueId(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select Parent League" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {/* You would fetch and populate parentLeagueOptions dynamically }
                  {parentLeagueOptions.length > 0 ? (
                    parentLeagueOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No parent leagues available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
                    */}
            {/* Division Input */}
            <div>
              <Label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">Division</Label>
              <Input
                id="division"
                placeholder="e.g., D1, Pro"
                value={selectedDivision || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDivision(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Established Year Input */}
            <div>
              <Label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700 mb-1">Established Year</Label>
              <Input
                id="establishedYear"
                type="number"
                min="1800" // Example minimum year
                max={new Date().getFullYear()} // Current year
                placeholder="e.g., 2005"
                value={establishedYearInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstablishedYearInput(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {/* Page Size Control - inside the dialog */}
            <div className="flex items-center space-x-2 mt-4">
              <Label htmlFor="pageSize" className="text-sm font-medium text-gray-700">Leagues per page</Label>
              <Input
                id="pageSize"
                type="number"
                min="1"
                max="50"
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
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition duration-300 ease-in-out"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
