// components/user/user-filters.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role, Gender, SupportedLanguage, UserFilterParams } from '@/prisma/'; // Import all necessary enums and types
import { MultiSelect } from '@/components/ui/multi-select'; // Your new multi-select component
import { Switch } from '@/components/ui/switch';
import { useDebounce } from 'use-debounce'; // You'll need to install this: npm install use-debounce

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


  // Apply filters after debounced search or other changes
  useEffect(() => {
    onFilterChange({
      ...filters,
      search: debouncedSearch,
      roles: selectedRoles.length > 0 ? selectedRoles : undefined,
      isActive: isActive,
      isVerified: isVerified,
      gender: selectedGender,
      preferredLanguage: selectedLanguage,
      page: 1, // Reset to first page on filter change
    });
  }, [debouncedSearch, selectedRoles, isActive, isVerified, selectedGender, selectedLanguage]); // Exclude filters and onFilterChange to prevent infinite loop

  // Handle page size change
  useEffect(() => {
    const newSize = parseInt(debouncedPageSizeInput, 10);
    if (!isNaN(newSize) && newSize >= 1 && newSize <= 50 && newSize !== filters.pageSize) {
      onPageSizeChange(newSize);
    }
  }, [debouncedPageSizeInput]); // Exclude filters and onPageSizeChange

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name, email, or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Roles Multi-Select */}
        <div>
          <Label htmlFor="roles">Roles</Label>
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
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={selectedGender || ''}
            onValueChange={(value: Gender) => setSelectedGender(!value ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              {genderOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language Select */}
        <div>
          <Label htmlFor="language">Preferred Language</Label>
          <Select
            value={selectedLanguage || ''}
            onValueChange={(value: SupportedLanguage) => setSelectedLanguage(!value ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
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
            checked={isActive || false} // Provide a boolean default for the Switch component
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="isActive">Active Users</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsActive(undefined)}
            className="ml-2"
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
          />
          <Label htmlFor="isVerified">Verified Users</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVerified(undefined)}
            className="ml-2"
            disabled={isVerified === undefined}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Page Size Control */}
      <div className="flex items-center space-x-2 mt-4">
        <Label htmlFor="pageSize">Users per page</Label>
        <Input
          id="pageSize"
          type="number"
          min="1"
          max="50"
          value={pageSizeInput}
          onChange={(e) => setPageSizeInput(e.target.value)}
          className="w-20"
        />
      </div>
    </div>
  );
}
