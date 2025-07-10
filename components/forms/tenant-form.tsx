// components/forms/tenant-form.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Label, TextArea, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { countryNameToCode, sanitizeEmptyStrings } from '@/utils/';
import { api } from '@/services/api';
import { toast } from 'sonner';

import {
  CreateTenantSchema,
  UpdateTenantSchema,
  TenantDetails,
  UserResponseDto,
  PaginatedResponseDto,
  SportType,
  Role,
  TenantType,
 
} from '@/schemas'; // Import types and schemas, including UserResponseDto and PaginatedResponseDto
import { init } from 'next/dist/compiled/webpack/webpack';

// Define a union type for form input based on create or update
type TenantFormValues = 
  | z.infer<typeof CreateTenantSchema>
  | z.infer<typeof UpdateTenantSchema>;

interface TenantFormProps {
  initialData?: TenantDetails; // For editing, pre-populates the form
  isEditMode?: boolean; // True for edit mode, false for create mode
  onSuccess?: (tenantId: string) => void;
  onCancel?: () => void;
}

export function TenantForm({ initialData, isEditMode = false, onSuccess, onCancel }: TenantFormProps) {
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<UserResponseDto[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(initialData?.country ? Object.keys(countryNameToCode).find(key => countryNameToCode[key] === initialData.country) || '' : '');
  const [selectedRegion, setSelectedRegion] = useState(initialData?.region || '');

  const formSchema = isEditMode ? UpdateTenantSchema : CreateTenantSchema;

  const defaultFormValues = isEditMode
    ? {
        name: initialData?.name || '',
        description: initialData?.description ?? undefined,
        tenantCode: initialData?.tenantCode || '',
        sportType: initialData?.sportType || SportType.FOOTBALL,
        tenantType: initialData?.tenantType || TenantType.COMMERCIAL,
        country: initialData?.country || '',
        region: initialData?.region ?? undefined,
        city: initialData?.city ?? undefined,
        state: initialData?.state ?? undefined,
        establishedYear: initialData?.establishedYear ?? undefined,
        logoUrl: initialData?.logoUrl ?? undefined,
        bannerImageUrl: initialData?.bannerImageUrl ?? undefined,
        isActive: initialData?.isActive ?? true,
        ownerId: initialData?.ownerId ?? undefined,
      }
    : {
        name: '',
        description: undefined,
        tenantCode: '',
        sportType: SportType.FOOTBALL,
        tenantType: initialData?.tenantType || TenantType.COMMERCIAL,
        country: '',
        region: undefined,
        city: undefined,
        state: undefined,
        establishedYear: undefined,
        logoUrl: undefined,
        bannerImageUrl: undefined,
        isActive: true,
        ownerId: undefined,
      };
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = form;

  // Fetch general users for owner selection
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {

        const params = new URLSearchParams();
        const roles = [Role.GENERAL_USER];
        roles.forEach(role => params.append('roles', role));
        params.append('tenantId', 'null');
        console.log('Params: ', params.toString());
        const response = await api.get<PaginatedResponseDto>(`/users?${params.toString()}`);
        setAvailableOwners(response.data.data);
      } catch (error) {
        console.error('Failed to fetch users for owner dropdown:', error);
        toast.error("Failed to load users for owner selection.");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Update country/region dropdowns if initialData changes (e.g., in edit mode)
  useEffect(() => {
    if (initialData) {
      setSelectedCountry(Object.keys(countryNameToCode).find(key => countryNameToCode[key] === initialData.country) || '');
      setSelectedRegion(initialData.region || '');
    }
  }, [initialData]);

  const onSubmit = async (rawData: TenantFormValues) => {
    const sanitizedData = sanitizeEmptyStrings(rawData);
    // Ensure establishedYear is number or undefined
    const payload = {
      ...sanitizedData,
      establishedYear: sanitizedData.establishedYear ? Number(sanitizedData.establishedYear) : undefined,
    };

    try {
      let response;
      if (isEditMode && initialData?.id) {
        // Update existing tenant
        response = await api.put(`/tenants/${initialData.id}`, payload);
        console.log(response);
        toast.success("Tenant updated successfully!");
      } else {
        // Create new tenant
        response = await api.post('/tenants', payload);
        toast.success("Tenant created successfully!");
        reset(defaultFormValues); // Reset form for new creation
      }
      onSuccess?.(response.data.id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} tenant.`;
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} tenant`, { description: errorMessage });
      console.error(`${isEditMode ? 'Update' : 'Create'} tenant error:`, err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2">
        <input
          id="isActive"
          type="checkbox"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          checked={watch('isActive')}
          onChange={(e) => setValue('isActive', e.target.checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="isActive">Active Tenant</Label>
        {errors.isActive && (
          <p className="text-red-500 text-xs mt-1">{errors.isActive.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="name" required={!isEditMode}>Tenant Name</Label>
        <Input
          id="name"
          placeholder="e.g., Association Sportive Recoba"
          {...register('name')}
          required={!isEditMode}
          maxLength={100}
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="tenantCode" required={!isEditMode}>Tenant Code</Label>
        <Input
          id="tenantCode"
          placeholder="e.g., RECOBA"
          {...register('tenantCode')}
          required={!isEditMode}
          maxLength={7}
          type='uppercase'
          onBlur={(e) => setValue('tenantCode', e.target.value.toUpperCase())}
          disabled={isSubmitting || isEditMode} // Tenant code usually not editable after creation
        />
        {errors.tenantCode && <p className="text-red-500 text-xs mt-1">{errors.tenantCode.message}</p>}
        <p className="text-gray-500 text-xs mt-1">
          A unique short code (e.g., 'KBA', 'GSA').
        </p>
      </div>

      <div>
        <Label htmlFor="sportType" required={!isEditMode}>Sport Type</Label>
        <Select
          value={watch('sportType')}
          onValueChange={(value: SportType) => setValue('sportType', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Sport" />
            </SelectTrigger>
          <SelectContent>
            {Object.values(SportType).map((type) => (
              <SelectItem key={type} value={type} >
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sportType && <p className="text-red-500 text-xs mt-1">{errors.sportType.message}</p>}
      </div>
      {/* Tenant Type Dropdown - NEW */}
      <div>
        <Label htmlFor="tenantType" required={!isEditMode}>Tenant Type</Label>
        <Select
          value={watch('tenantType')}
          onValueChange={(value: TenantType) => setValue('tenantType', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a tenant type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TenantType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tenantType && <p className="text-red-500 text-xs mt-1">{errors.tenantType.message}</p>}
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
        <Label htmlFor="country" required={!isEditMode}>Country</Label>
        <CountryDropdown
          id="country"
          value={selectedCountry}
          onChange={(val) => {
            const isoCode = countryNameToCode[val] || '';
            setSelectedCountry(val);
            setValue('country', isoCode, { shouldValidate: true });
            // Clear region when country changes
            setSelectedRegion('');
            setValue('region', undefined, { shouldValidate: true });
          }}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isSubmitting}
        />
        {errors.country?.message && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
      </div>
      <div>
        <Label htmlFor="region">Region / Province / State</Label>
        <RegionDropdown
          id="region"
          country={selectedCountry}
          value={selectedRegion}
          onChange={(val) => {
            setSelectedRegion(val);
            setValue('region', val, { shouldValidate: true });
          }}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isSubmitting}
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
          <Label htmlFor="state">State (Deprecated, use Region)</Label>
          <Input id="state" type="text" {...register('state')} disabled={isSubmitting} />
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Consider using the "Region / Province / State" field above for better compatibility.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="establishedYear">Established Year</Label>
        <Input
          id="establishedYear"
          type="number"
          {...register('establishedYear', { valueAsNumber: true })}
          disabled={isSubmitting}
          placeholder="e.g., 2020"
        />
        {errors.establishedYear && <p className="text-red-500 text-xs mt-1">{errors.establishedYear.message}</p>}
      </div>

      <div className='py-2'>
        <Label htmlFor="ownerId">
                Owner ({isEditMode && initialData?.owner?.username && 
                  <span>{initialData?.owner?.firstName} - {initialData?.owner?.lastName}</span>})
        </Label>
        {loadingUsers ? (
          <p className="text-gray-500">Loading users...</p>
        ) : (
          <Select
            value={watch('ownerId') || ''}
            onValueChange={(value) => setValue('ownerId', value || undefined)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an owner (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No Owner (Platform Controlled)</SelectItem>
              {availableOwners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.username} ({owner.email})
                  {owner.firstName && owner.lastName ? ` - ${owner.firstName} ${owner.lastName}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId.message}</p>}
        <p className="text-gray-500 text-xs mt-1">
          Assign an existing GENERAL_USER as the primary owner of this tenant.
        </p>
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Tenant' : 'Create Tenant')}
        </Button>
      </div>
    </form>
  );
}
