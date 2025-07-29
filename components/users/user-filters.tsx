// components/user/user-filters.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role, Gender, SupportedLanguage, UserFilterParams } from '@/schemas'; // Import all necessary enums and types
import { MultiSelect } from '@/components/ui/multi-select'; // Your new multi-select component
import { Switch } from '@/components/ui/switch';
import { useDebounce } from 'use-debounce'; // You'll need to install this: npm install use-debounce
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui';
import { FilterIcon } from 'lucide-react';

interface UserFiltersProps {
  filters: UserFilterParams;
  onFilterChange: (newFilters: UserFilterParams) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function UserFilters({ filters, onFilterChange, onPageSizeChange }: UserFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(filters.roles || []);
  const [isActive, setIsActive] = useState<boolean | undefined>(filters.isActive);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(filters.isVerified);
  const [selectedGender, setSelectedGender] = useState<Gender | undefined>(filters.gender);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | undefined>(filters.preferredLanguage);
  const [pageSizeInput, setPageSizeInput] = useState(String(filters.pageSize || 10));

  const [debouncedSearch] = useDebounce(search, 500);
  const [debouncedPageSizeInput] = useDebounce(pageSizeInput, 500);

  // State to control the dialog open/close
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Memoize role options for MultiSelect
  const roleOptions = useMemo(() => Object.values(Role).map(role => ({
    value: role,
    label: role.replace(/_/g, ' ') // Display "SYSTEM ADMIN" instead of "SYSTEM_ADMIN"
  })), []);

  // Memoize gender options
  const genderOptions = useMemo(() => Object.values(Gender).map(gender => ({
    value: gender,
    label: gender.charAt(0) + gender.slice(1).toLowerCase()
  })), []);

  // Memoize language options
  const languageOptions = useMemo(() => Object.values(SupportedLanguage).map(lang => ({
    value: lang,
    label: lang.charAt(0) + lang.slice(1).toLowerCase()
  })), []);

  // Helper for array comparison (deep comparison for roles)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arraysEqual = useCallback((a: any[] | undefined, b: any[] | undefined): boolean => {
    if (!a && !b) return true; // Both undefined/null
    if (!a || !b) return false; // One is undefined/null, the other is not
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }, []); // useCallback to ensure stable reference


  // Apply filters after debounced search or other changes
  // This useEffect is critical for preventing infinite loops
  useEffect(() => {
    const newSearch = debouncedSearch === '' ? undefined : debouncedSearch;
    const newRoles = selectedRoles.length > 0 ? selectedRoles : undefined;
    const newIsActive = isActive;
    const newIsVerified = isVerified;
    const newGender = selectedGender;
    const newLanguage = selectedLanguage;

    // Perform a comprehensive comparison between current internal states and the parent's filters prop
    const hasSearchChanged = newSearch !== (filters.search || undefined);
    const hasRolesChanged = !arraysEqual(newRoles, filters.roles);
    const hasIsActiveChanged = newIsActive !== filters.isActive;
    const hasIsVerifiedChanged = newIsVerified !== filters.isVerified;
    const hasGenderChanged = newGender !== filters.gender;
    const hasLanguageChanged = newLanguage !== filters.preferredLanguage;

    // Only call onFilterChange if any of the effective filter values have genuinely changed
    if (hasSearchChanged || hasRolesChanged || hasIsActiveChanged || hasIsVerifiedChanged || hasGenderChanged || hasLanguageChanged) {
      onFilterChange({
        ...filters, // Preserve existing sortBy, sortOrder, tenantId, etc. from parent
        search: newSearch,
        roles: newRoles,
        isActive: newIsActive,
        isVerified: newIsVerified,
        gender: newGender,
        preferredLanguage: newLanguage,
        page: 1, // Reset to first page on filter change
      });
    }
  }, [
    debouncedSearch,
    selectedRoles,
    isActive,
    isVerified,
    selectedGender,
    selectedLanguage,
    filters, // This must be a dependency as we are comparing against it
    onFilterChange, // This must be a dependency, ensure it's wrapped in useCallback in parent
    arraysEqual // Include helper function if defined within component or memoized
  ]);

  // Handle page size change - similar check to prevent redundant updates
  useEffect(() => {
    const newSize = parseInt(debouncedPageSizeInput, 10);
    // Only call onPageSizeChange if newSize is valid AND different from current filters.pageSize
    if (!isNaN(newSize) && newSize >= 1 && newSize <= 50 && newSize !== filters.pageSize) {
      onPageSizeChange(newSize);
    }
  }, [debouncedPageSizeInput, onPageSizeChange, filters.pageSize]); // filters.pageSize must be a dependency


  // Function to reset all filters
  const handleClearAllFilters = useCallback(() => {
    setSearch('');
    setSelectedRoles([]);
    setIsActive(undefined);
    setIsVerified(undefined);
    setSelectedGender(undefined);
    setSelectedLanguage(undefined);
    setPageSizeInput(String(10)); // Reset page size to default

    // Immediately apply these cleared filters to the parent
    // Ensure this only triggers onFilterChange if something actually changed
    onFilterChange({
      ...filters, // Keep existing sortBy, sortOrder if any
      search: undefined,
      roles: undefined,
      isActive: undefined,
      isVerified: undefined,
      gender: undefined,
      preferredLanguage: undefined,
      page: 1, // Reset page to 1
    });
    onPageSizeChange(10); // Also update page size in parent
  }, [filters, onFilterChange, onPageSizeChange]); // Dependencies for useCallback

  return (
    <div className="flex items-center gap-4 w-full"> {/* Use flexbox for alignment */}
      {/* Search Input - stays outside the dialog */}
      <div className="flex-grow max-w-sm"> {/* Allow search input to grow but with a max width */}
        <Label htmlFor="search" className="sr-only">Search Users</Label> {/* Screen reader only label */}
        <Input
          id="search"
          placeholder="Search by name, email, or username"
          value={search}
          type='search'
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Button and Dialog - to the right of the search input */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-md shadow-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 transition duration-300 ease-in-out transform hover:scale-105">
            <FilterIcon />
            More Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] rounded-lg shadow-xl p-6 bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">Advanced Filters</DialogTitle>
            <DialogDescription className="text-gray-600">
              Apply additional filters to refine your user list.
            </DialogDescription>
          </DialogHeader>
          {/* All other filter content inside the dialog */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {/* Roles Multi-Select */}
            <div>
              <Label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">Roles</Label>
              <MultiSelect
                options={roleOptions}
                selected={selectedRoles}
                onChange={(values) => setSelectedRoles(values as Role[])}
                placeholder="Select Roles"
                className="w-full"
              />
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
                  {/* Option to clear gender filter */}
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {genderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Select */}
            <div>
              <Label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value: SupportedLanguage) => setSelectedLanguage(!value ? undefined : value)}
              >
                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent className='bg-white rounded-md shadow-lg z-50'>
                  {/* Option to clear language filter */}
                  <SelectItem value="clear_selection">Clear Selection</SelectItem>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Is Active Switch */}
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="isActive"
                checked={isActive || false}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200"
              />
              <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Users</Label>
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

            {/* Is Verified Switch */}
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="isVerified"
                checked={isVerified || false}
                onCheckedChange={setIsVerified}
                className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-200"
              />
              <Label htmlFor="isVerified" className="text-sm font-medium text-gray-700">Verified Users</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVerified(undefined)}
                className="ml-2 text-gray-500 hover:bg-gray-100 rounded-md px-2 py-1"
                disabled={isVerified === undefined}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Page Size Control - inside the dialog */}
          <div className="flex items-center space-x-2 mt-4">
            <Label htmlFor="pageSize" className="text-sm font-medium text-gray-700">Users per page</Label>
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