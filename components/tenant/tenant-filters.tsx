// components/tenant/tenant-filters.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- MOCKED COMPONENTS & UTILITIES FOR ENVIRONMENT COMPILATION ---
// IMPORTANT: In your actual project, use your existing imports:
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from 'use-debounce'; // Your useDebounce hook
import { TenantType, SportType, TenantFilterParams } from '@/schemas'; // Your Tenant types
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui';
import { FilterIcon, SearchIcon } from 'lucide-react';

// Mock Input component (simplified)
// Mock enums and types for demonstration (from '@/prisma/')
// Defined here for self-containment, but normally imported from '@/prisma/tenant-schemas'


interface TenantFiltersProps {
  filters: TenantFilterParams;
  onFilterChange: (newFilters: TenantFilterParams) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function TenantFilters({ filters, onFilterChange, onPageSizeChange }: TenantFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [isActive, setIsActive] = useState<boolean | undefined>(filters.isActive);
  const [selectedTenantType, setSelectedTenantType] = useState<TenantType | undefined>(filters.tenantType);
  const [selectedSportType, setSelectedSportType] = useState<SportType | undefined>(filters.sportType);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(filters.country);
  const [pageSizeInput, setPageSizeInput] = useState(String(filters.pageSize || 10));

  const [debouncedSearch] = useDebounce(search, 500);
  const [debouncedPageSizeInput] = useDebounce(pageSizeInput, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Memoize options for Selects
  const tenantTypeOptions = useMemo(() => Object.values(TenantType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ')
  })), []);

  const sportTypeOptions = useMemo(() => Object.values(SportType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ')
  })), []);

  // For countries, you might have a predefined list or fetch dynamically.
  // For now, a small mock list:
  const countryOptions = useMemo(() => [
    { value: 'USA', label: 'United States' },
    { value: 'CAN', label: 'Canada' },
    { value: 'GBR', label: 'United Kingdom' },
    { value: 'AUS', label: 'Australia' },
    { value: 'DEU', label: 'Germany' },
    { value: 'FRA', label: 'France' },
  ], []);


  // Apply filters after debounced search or other changes
  useEffect(() => {
    const newSearch = debouncedSearch === '' ? undefined : debouncedSearch;
    const newIsActive = isActive;
    const newTenantType = selectedTenantType;
    const newSportType = selectedSportType;
    const newCountry = selectedCountry;

    // Check if any filter value has genuinely changed before calling onFilterChange
    const hasSearchChanged = newSearch !== (filters.search || undefined);
    const hasIsActiveChanged = newIsActive !== filters.isActive;
    const hasTenantTypeChanged = newTenantType !== filters.tenantType;
    const hasSportTypeChanged = newSportType !== filters.sportType;
    const hasCountryChanged = newCountry !== filters.country;

    if (hasSearchChanged || hasIsActiveChanged || hasTenantTypeChanged || hasSportTypeChanged || hasCountryChanged) {
      onFilterChange({
        ...filters, // Preserve existing sortBy, sortOrder etc.
        search: newSearch,
        isActive: newIsActive,
        tenantType: newTenantType,
        sportType: newSportType,
        country: newCountry,
        page: 1, // Reset to first page on filter change
      });
    }
  }, [
    debouncedSearch,
    isActive,
    selectedTenantType,
    selectedSportType,
    selectedCountry,
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
    setIsActive(undefined);
    setSelectedTenantType(undefined);
    setSelectedSportType(undefined);
    setSelectedCountry(undefined);
    setPageSizeInput(String(10));

    onFilterChange({
      ...filters,
      search: undefined,
      isActive: undefined,
      tenantType: undefined,
      sportType: undefined,
      country: undefined,
      page: 1,
    });
    onPageSizeChange(10);
  }, [filters, onFilterChange, onPageSizeChange]);

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Search Input - always visible */}
      <div className="flex-grow max-w-sm">
        <Label htmlFor="tenantSearch" className="sr-only">Search Tenants</Label>
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </div>
        <Input
          id="tenantSearch"
          type="search" // Use type="search" to benefit from native browser behaviors (e.g., clear button)
          placeholder="Search by name or code"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Button and Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-md shadow-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 transition duration-300 ease-in-out transform hover:scale-105">
            <FilterIcon />
            More Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] rounded-lg shadow-xl p-6 bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">Advanced Tenant Filters</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apply additional filters to refine your tenant list.
            </DialogDescription>
          </DialogHeader>
          {/* Advanced filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {/* Is Active Switch */}
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="isActiveTenant"
                checked={isActive || false}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200"
              />
              <Label htmlFor="isActiveTenant" className="text-sm font-medium text-gray-700">Active Tenants</Label>
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

            {/* Tenant Type Select */}
            <div>
              <Label htmlFor="tenantType" className="block text-sm font-medium text-gray-700 mb-1">Tenant Type</Label>
              <Select
                value={selectedTenantType}
                onValueChange={(value: TenantType) => setSelectedTenantType(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {tenantTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sport Type Select */}
            <div>
              <Label htmlFor="sportType" className="block text-sm font-medium text-gray-700 mb-1">Sport Type</Label>
              <Select
                value={selectedSportType}
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

            {/* Page Size Control - inside the dialog */}
            <div className="flex items-center space-x-2 mt-4">
              <Label htmlFor="pageSize" className="text-sm font-medium text-gray-700">Tenants per page</Label>
              <Input
                id="pageSize"
                type="number"
                min="1"
                max="50"
                value={pageSizeInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPageSizeInput(e.target.value)}
                className="w-20 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
