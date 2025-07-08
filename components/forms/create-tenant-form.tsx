// components/forms/create-tenant-form.tsx
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Switch, Label, TextArea, Input } from '@/components/ui/'; 

import {
  CreateTenantSchema,
  CreateTenantDto,
  SportType,
  SportTypeSchema,
  Role, // Assuming Role for context (though not directly used in this form)
} from '@/schemas'; // Import your new types

import { api } from '@/services/api'; // Your Axios instance
import { useRouter } from 'next/navigation';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { countryNameToCode } from '@/utils';

interface CreateTenantFormProps {
  onSuccess?: (tenantId: string) => void;
  onCancel?: () => void;
}

function sanitizeEmptyStrings<T extends Record<string, any>>(data: T): T {
  const cleaned: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() === '') {
      cleaned[key] = undefined;
    } else {
      cleaned[key] = value;
    }
  });

  return cleaned as T;
}

export function CreateTenantForm({ onSuccess, onCancel }: CreateTenantFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  const form = useForm<CreateTenantDto>({
    resolver: zodResolver(CreateTenantSchema),
    defaultValues: {
      name: '',
      description: '',
      tenantCode: '',
      sportType: SportType.FOOTBALL, // Default sport type
      country: '',
      region: '',
      city: '',
      state: '',
      establishedYear: undefined, // undefined for optional number
      logoUrl: '',
      bannerImageUrl: '',
      isActive: true, // Default to active
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const onSubmit = async (rawData: CreateTenantDto) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const sanitized = sanitizeEmptyStrings(rawData);
      // Ensure establishedYear is number or undefined
      console.log("Sanitezed: ", sanitized);
      const payload = {
        ...sanitized,
        establishedYear: sanitized.establishedYear ? Number(sanitized.establishedYear) : undefined,
      };

      const response = await api.post('/system-admin/tenants', payload); // Assuming this is your backend endpoint
      setSuccessMessage('Tenant created successfully!');
      reset(); // Clear form fields
      onSuccess?.(response.data.id); // Call onSuccess callback with new tenant ID
      router.push('/admin/tenants'); // Redirect to tenants list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create tenant.';
      setError(errorMessage);
      console.error('Create tenant error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      {error && <p className="text-red-500 text-sm mb-4">Server Error. Contact Admin</p>}
      {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
      <div className="flex items-center space-x-2">
        <input
          id="isActive"
          type="checkbox"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          checked={form.watch('isActive')}
          onChange={(e) => form.setValue('isActive', e.target.checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="isActive">Active Tenant</Label>
        {errors.isActive && (
          <p className="text-red-500 text-xs mt-1">{errors.isActive.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="name" required>Tenant Name</Label>
        <Input
            id="name"
            placeholder="e.g., Association Sportive Recoba"
            {...register('name')}
            restrict="alpha"
            required
            maxCharacters={30}
            autoTrim
            disabled={isSubmitting}
          />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="tenantCode" required>Tenant Code</Label>
        <Input
            id="tenantCode"
            placeholder="e.g., RECOBA"
            {...register('tenantCode')}
            restrict="uppercase"
            required
            maxCharacters={7}
            autoTrim
            onBlur={(e) => form.setValue('tenantCode', e.target.value.toUpperCase())}
            disabled={isSubmitting}
          />
        {errors.tenantCode && <p className="text-red-500 text-xs mt-1">{errors.tenantCode.message}</p>}
        <p className="text-gray-500 text-xs mt-1">
          A unique short code (e.g., 'KBA', 'GSA').
        </p>
      </div>

      <div>
        <Label htmlFor="sportType" required>Sport Type</Label>
        <select
          id="sportType"
          {...register('sportType')}
          disabled={isSubmitting}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {Object.values(SportType).map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        {errors.sportType && <p className="text-red-500 text-xs mt-1">{errors.sportType.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <TextArea id="description" {...register('description')} disabled={isSubmitting} rows={3} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" type="url" {...register('logoUrl')} disabled={isSubmitting} placeholder="https://example.com/logo.png" />
        {errors.logoUrl && <p className="text-red-500 text-xs mt-1">{errors.logoUrl.message}</p>}
      </div>

      <div>
        <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
        <Input id="bannerImageUrl" type="url" {...register('bannerImageUrl')} disabled={isSubmitting} placeholder="https://example.com/banner.png" />
        {errors.bannerImageUrl && <p className="text-red-500 text-xs mt-1">{errors.bannerImageUrl.message}</p>}
      </div>

        <div>
          <Label htmlFor="country" required>Country</Label>
          <CountryDropdown
            id="country"
            value={selectedCountry}
            onChange={(val) => {
              const isoCode = countryNameToCode[val] || '';
              console.log(isoCode)
              setSelectedCountry(val);
              form.setValue('country', isoCode);
            }}
            style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
            backgroundColor: 'white',
          }}
          required
            //classes="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <RegionDropdown
            id="region"
            country={selectedCountry}
            value={selectedRegion}
            onChange={(val) => {
              setSelectedRegion(val);
              form.setValue('region', val);
            }}
            style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
            backgroundColor: 'white',
          }}
            //classeName="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
        </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" type="text" {...register('city')} disabled={isSubmitting} />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" type="text" {...register('state')} disabled={isSubmitting} />
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="establishedYear">Established Year</Label>
        <Input id="establishedYear" 
               type="number" 
               {...register('establishedYear', { valueAsNumber: true })} 
               disabled={isSubmitting} 
               placeholder="e.g., 2020" 
               restrict="year"
               maxCharacters={4}
               autoTrim/>
        {errors.establishedYear && <p className="text-red-500 text-xs mt-1">{errors.establishedYear.message}</p>}
      </div>

      {/* For SYSTEM_ADMIN to assign an owner during creation - might be optional */}
      {<div>
        <Label htmlFor="ownerId">Owner User ID (Optional)</Label>
        <Input id="ownerId" type="text" {...register('ownerId')} disabled={isSubmitting} />
        {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId.message}</p>}
        <p className="text-gray-500 text-xs mt-1">
          Assign an existing user as the owner of this tenant.
        </p>
      </div> }
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
}
