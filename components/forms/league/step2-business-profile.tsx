"use client";

import React, { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { api } from '@/services/api';
import { CreateLeagueDto } from '@/schemas';

export default function Step2_BusinessProfile() {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext();
  const watchedTenantId = watch('tenantId');
  const watchedCountry = watch('businessProfile.country');
  //const [tenantCountry, setTenantCountry] = useState(null);

  // Fetch the tenant's country to pre-fill the business profile
  useEffect(() => {
    if (watchedTenantId) {
      const fetchTenant = async () => {
        try {
          const res = await api.get(`/tenants/${watchedTenantId}`);
          //setTenantCountry(res.data.country);
          setValue('businessProfile.country', res.data.country);
        } catch (error) {
          console.error("Failed to fetch tenant", error);
        }
      };
      fetchTenant();
    }
  }, [watchedTenantId, setValue]);

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="businessName">Business Name</Label>
        <Input id="businessName" {...register("businessProfile.name")} />
        {//errors.businessProfile?.name && <p className="text-red-500 text-sm">{errors.businessProfile.name.message}</p>
        }
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input id="description" {...register("businessProfile.description")} />
      </div>
      
      <div className="grid w-full items-center gap-1.5 hidden">
        <Label htmlFor="country">Country</Label>
        <Controller
          control={control}
          name="businessProfile.country"
          render={({ field }) => (
            <CountryDropdown
              value={field.value || ''}
              onChange={(val) => field.onChange(val)}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="region">Region</Label>
        <Controller
          control={control}
          name="businessProfile.region"
          render={({ field }) => (
            <RegionDropdown
              country={watchedCountry || ''}
              value={field.value || ''}
              onChange={(val) => field.onChange(val)}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
        />
      </div>

      {/* Add more fields here as needed */}

      {/* Display form-wide errors */}
       {Object.keys(errors).length > 0 && (
         <div className="mt-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
           <p className="font-semibold">Please correct the following errors:</p>
           <ul className="list-disc list-inside mt-2">
             {Object.keys(errors).map(key => {
               const error = errors[key as keyof CreateLeagueDto];
               return (
                 <li key={key}>
                   {key}: {error?.message as string || 'Invalid value'}
                 </li>
               );
             })}
           </ul>
         </div>
      )}
    </div>
  );
}