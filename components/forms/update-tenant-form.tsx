// components/forms/update-tenant-form.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, TextArea, Label, Switch, LoadingSpinner } from '@/components/ui/';
import {
  TenantDetails,
  UpdateTenantSchema,
  UpdateTenantDto,
  SportType,
  TenantDetailsSchema,
} from '@/prisma'; // Import necessary types and schemas
import { api } from '@/services/api';

interface UpdateTenantFormProps {
  tenantId: string;
  onSuccess?: (tenantId: string) => void;
  onCancel?: () => void;
}

export function UpdateTenantForm({ tenantId, onSuccess, onCancel }: UpdateTenantFormProps) {
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<UpdateTenantDto>({
    resolver: zodResolver(UpdateTenantSchema),
    defaultValues: {
      // Default values will be overridden by fetched data
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = form;

  // Effect to fetch tenant data when component mounts or tenantId changes
  useEffect(() => {
    const fetchTenantData = async () => {
      setLoadingTenant(true);
      setError(null);
      try {
        const response = await api.get<TenantDetails>(`/system-admin/tenants/${tenantId}`);
        const validatedTenant = TenantDetailsSchema.parse(response.data);

        // Populate form with fetched data
        // Explicitly cast to UpdateTenantDto if necessary, ensuring fields match
        reset({
          name: validatedTenant.name,
          description: validatedTenant.description || '',
          tenantCode: validatedTenant.tenantCode,
          sportType: validatedTenant.sportType,
          country: validatedTenant.country || '',
          region: validatedTenant.region || '',
          city: validatedTenant.city || '',
          state: validatedTenant.state || '',
          establishedYear: validatedTenant.establishedYear || undefined,
          logoUrl: validatedTenant.logoUrl || '',
          bannerImageUrl: validatedTenant.bannerImageUrl || '',
          isActive: validatedTenant.isActive,
          // ownerId etc., can be added if your form allows updating them
        });
        setSuccessMessage(null); // Clear any previous success messages
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load tenant data.';
        setError(errorMessage);
        console.error('Fetch tenant data error:', err);
      } finally {
        setLoadingTenant(false);
      }
    };

    if (tenantId) {
      fetchTenantData();
    } else {
      setError('No tenant ID provided for update.');
      setLoadingTenant(false);
    }
  }, [tenantId, reset]); // `reset` from useForm is stable, no need to worry about re-renders

  const onSubmit = async (data: UpdateTenantDto) => {
    setError(null);
    setSuccessMessage(null);
    try {
      // Ensure establishedYear is number or undefined
      const payload = {
        ...data,
        establishedYear: data.establishedYear !== undefined ? Number(data.establishedYear) : undefined,
      };

      await api.put(`/system-admin/tenants/${tenantId}`, payload); // Assuming PUT /admin/tenants/:id
      setSuccessMessage('Tenant updated successfully!');
      onSuccess?.(tenantId); // Call onSuccess callback
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update tenant.';
      setError(errorMessage);
      console.error('Update tenant error:', err);
    }
  };

  if (loadingTenant) {
    return <LoadingSpinner />;
  }

  if (error && !tenantId) { // Only show global error if tenantId is missing initially
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}

      <div>
        <Label htmlFor="name">Tenant Name</Label>
        <Input id="name" type="text" {...register('name')} disabled={isSubmitting} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="tenantCode">Tenant Code</Label>
        <Input id="tenantCode" type="text" {...register('tenantCode')} disabled={isSubmitting} />
        {errors.tenantCode && <p className="text-red-500 text-xs mt-1">{errors.tenantCode.message}</p>}
        <p className="text-gray-500 text-xs mt-1">
          A unique short code (e.g., 'KBA', 'GSA').
        </p>
      </div>

      <div>
        <Label htmlFor="sportType">Sport Type</Label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country (ISO 2-letter code)</Label>
          <Input id="country" type="text" {...register('country')} disabled={isSubmitting} placeholder="US, CD, GB" maxLength={2} />
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input id="region" type="text" {...register('region')} disabled={isSubmitting} />
          {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
        </div>
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
        <Input id="establishedYear" type="number" {...register('establishedYear', { valueAsNumber: true })} disabled={isSubmitting} placeholder="e.g., 2020" />
        {errors.establishedYear && <p className="text-red-500 text-xs mt-1">{errors.establishedYear.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="isActive">Active</Label>
        {/* Use form.watch to get the current value for the Switch component's checked prop */}
        <Switch id="isActive" {...register('isActive')} disabled={isSubmitting} checked={form.watch('isActive')} onCheckedChange={(checked) => setValue('isActive', checked)} />
        {errors.isActive && <p className="text-red-500 text-xs mt-1">{errors.isActive.message}</p>}
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Tenant'}
        </Button>
      </div>
    </form>
  );
}
