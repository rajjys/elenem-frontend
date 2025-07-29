// components/forms/season-form.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextArea } from '../ui'; // Assuming you have a TextArea component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/services/api'; // Your actual API instance
import { useAuthStore } from '@/store/auth.store'; // Your auth store
import { LeagueBasic, Role, SeasonResponseDto, TenantBasic } from '@/schemas'; // Assuming Role enum is here
import { CreateSeasonSchema, SeasonStatus, CreateSeasonDto } from '@/schemas/'; // Your new season schemas

interface SeasonFormProps {
  initialData?: SeasonResponseDto; // Optional for edit mode, though the prompt implies create only
  onSuccess: (seasonId: string) => void;
  onCancel: () => void;
}

export function SeasonForm({ initialData, onSuccess, onCancel }: SeasonFormProps) {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];

  const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Role.LEAGUE_ADMIN);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true); // For initial fetches (tenants/leagues)
  const [tenants, setTenants] = useState<TenantBasic[]>([]);
  const [leagues, setLeagues] = useState<LeagueBasic[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(undefined);

  const isEditMode = !!initialData; // If initialData is provided, it's edit mode

  const form = useForm<CreateSeasonDto>({
    resolver: zodResolver(CreateSeasonSchema),
    defaultValues: useMemo(() => ({
      name: initialData?.name || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : undefined, // Format for date input
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : undefined,// Format for date input
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
      status: initialData?.status ?? SeasonStatus.ACTIVE,
      tenantId: initialData?.tenantId || (isTenantAdmin && userAuth?.tenantId) || (isLeagueAdmin && userAuth?.tenantId) || '',
      leagueId: initialData?.leagueId || (isLeagueAdmin && userAuth?.managingLeagueId) || '',
    }), [initialData, isTenantAdmin, isLeagueAdmin, userAuth]),
  });

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const currentWatchedTenantId = watch('tenantId'); // Watch tenantId for dynamic league fetching

  // Effect to set initial selectedTenantId for System Admin when data loads
  useEffect(() => {
    if (!loadingInitialData && isSystemAdmin && initialData?.tenantId) {
      setSelectedTenantId(initialData.tenantId);
    } else if (isTenantAdmin && userAuth?.tenantId) {
      setSelectedTenantId(userAuth.tenantId);
    } else if (isLeagueAdmin && userAuth?.tenantId) {
      setSelectedTenantId(userAuth.tenantId);
    }
  }, [loadingInitialData, initialData, isSystemAdmin, isTenantAdmin, isLeagueAdmin, userAuth]);

  // Fetch Tenants for System Admin
  useEffect(() => {
    const fetchTenants = async () => {
      if (isSystemAdmin) {
        setLoadingInitialData(true);
        try {
          const response = await api.get('/tenants', { params: { take: 100 } }); // Fetch all or paginate
          console.log("Tenants: ", response);
          setTenants(response.data.data);
        } catch (error) {
          toast.error('Failed to load tenants.', { description: 'Please try again later.' });
          console.error('Failed to load tenants:', error);
        } finally {
          setLoadingInitialData(false);
        }
      } else {
        setLoadingInitialData(false);
      }
    };
    fetchTenants();
  }, [isSystemAdmin]);

  // Fetch Leagues based on selectedTenantId (for System Admin and Tenant Admin)
  useEffect(() => {
    const fetchLeagues = async () => {
      if (currentWatchedTenantId) {
        setLoadingInitialData(true);
        try {
          const response = await api.get(`/leagues`, { params: { tenantIds: currentWatchedTenantId, take: 100 } });
          setLeagues(response.data.data);
        } catch (error) {
          toast.error('Failed to load leagues.', { description: 'Please try again later.' });
          console.error('Failed to load leagues:', error);
        } finally {
          setLoadingInitialData(false);
        }
      } else {
        setLeagues([]); // Clear leagues if no tenant selected
        setLoadingInitialData(false);
      }
    };
    fetchLeagues();
  }, [currentWatchedTenantId]);

  // Set initial tenantId and leagueId for tenant/league admins
  useEffect(() => {
    if (isTenantAdmin && userAuth?.tenantId) {
      setValue('tenantId', userAuth.tenantId);
    }
    if (isLeagueAdmin && userAuth?.tenantId && userAuth?.managingLeagueId) {
      setValue('tenantId', userAuth.tenantId);
      setValue('leagueId', userAuth.managingLeagueId);
    }
  }, [isTenantAdmin, isLeagueAdmin, userAuth, setValue]);


  const onSubmit = async (data: CreateSeasonDto) => {
    setIsSubmitting(true);
    try {
      // Ensure date objects are correctly formatted for backend if needed
      const payload = {
        ...data,
        startDate: data.startDate ,  //.toISOString(), // Send as ISO string
        endDate: data.endDate, //.toISOString(),     // Send as ISO string
      };

      let response;
      if (isEditMode) {
        // Assuming API for update: PUT /seasons/:id
        response = await api.put(`/seasons/${initialData.id}`, payload);
        toast.success('Season updated successfully!');
        onSuccess(initialData.id);
        return; // Exit if not implementing update
      } else {
        response = await api.post('/seasons', payload);
        toast.success('Season created successfully!');
        onSuccess(response.data.id);
      }
    } catch (error) {
      const errorMessage = 'Failed to create season.';
      toast.error('Error', { description: errorMessage });
      console.error('Season form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTenantSelectChange = (value: string) => {
    setSelectedTenantId(value);
    setValue('tenantId', value, { shouldValidate: true });
    setValue('leagueId', ''); // Reset leagueId when tenant changes
    setLeagues([]); // Clear leagues until new ones are fetched
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{isEditMode ? 'Edit Season' : 'Create New Season'}</h2>

      {loadingInitialData && (isSystemAdmin || isTenantAdmin) && (
        <p className="text-center text-gray-500">Loading available tenants and leagues...</p>
      )}

      {/* Tenant Selection (System Admin only) */}
      {isSystemAdmin && (
        <div>
          <Label htmlFor="tenantId">Tenant</Label>
          <Controller
            name="tenantId"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={handleTenantSelectChange}
                value={field.value}
                disabled={isSubmitting || loadingInitialData}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.length === 0 && !loadingInitialData && (
                    <SelectItem value="null" disabled>No tenants available</SelectItem>
                  )}
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tenantId && <p className="text-red-500 text-sm mt-1">{errors.tenantId.message}</p>}
        </div>
      )}

      {/* League Selection (System Admin and Tenant Admin) */}
      {(isSystemAdmin || isTenantAdmin) && (
        <div>
          <Label htmlFor="leagueId">League</Label>
          <Controller
            name="leagueId"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting || loadingInitialData || !currentWatchedTenantId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a league" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.length === 0 && !loadingInitialData && (
                    <SelectItem value="null" disabled>No leagues available for this tenant</SelectItem>
                  )}
                  {leagues.map((league) => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.leagueId && <p className="text-red-500 text-sm mt-1">{errors.leagueId.message}</p>}
        </div>
      )}

      {/* League ID for League Admin (Hidden/Read-only) */}
      {isLeagueAdmin && userAuth?.managingLeagueId && (
        <div>
          <Label htmlFor="leagueId">League (Auto-assigned)</Label>
          <Input
            id="leagueId"
            type="text"
            value={userAuth.managingLeagueId}
            disabled // Always disabled for League Admin
            className="bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">League ID is automatically set for League Admins.</p>
        </div>
      )}

      {/* Season Name */}
      <div>
        <Label htmlFor="name">Season Name</Label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      {/* Start Date */}
      <div>
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          {...register('startDate')}
          disabled={isSubmitting}
        />
        {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
      </div>

      {/* End Date */}
      <div>
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          {...register('endDate')}
          disabled={isSubmitting}
        />
        {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <TextArea
          id="description"
          {...register('description')}
          rows={3}
          disabled={isSubmitting}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
      </div>

      {/* Is Active Switch */}
      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        <Label htmlFor="isActive">Is Active</Label>
        {errors.isActive && <p className="text-red-500 text-sm mt-1">{errors.isActive.message}</p>}
      </div>

      {/* Season Status Select */}
      <div>
        <Label htmlFor="status">Status</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SeasonStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 mt-8">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Season' : 'Create Season')}
        </Button>
      </div>
    </form>
  );
}