// components/forms/team-form.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextArea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { FiChevronDown, FiChevronRight, FiInfo, FiLink, FiMapPin, FiGlobe, FiUsers, FiAward, FiSettings, FiImage, FiBox } from 'react-icons/fi';

import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { Role, TeamVisibility } from '@/prisma/'; // Assuming these are from your Prisma client
import {
  CreateTeamFormSchema,
  UpdateTeamByLaFormSchema,
  UpdateTeamProfileByTaFormSchema,
  TeamDetails, // Assuming TeamDetails is an extended type of your form values
  TeamFormValues,
} from '@/prisma'; // Adjust path as needed for your Zod schemas
import { sanitizeEmptyStrings } from '@/utils';

// Define types for fetched data
interface TenantBasicDto {
  id: string;
  name: string;
}

interface LeagueBasicDto {
  id: string;
  name: string;
  tenantId: string;
}

interface VenueBasicDto {
  id: string;
  name: string;
  address?: string;
}

interface UserBasicDto {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface TeamFormProps {
  initialData?: TeamDetails;
  isEditMode?: boolean;
  onSuccess: (teamId: string) => void;
  onCancel?: () => void;
  fixedTenantId?: string; // For Tenant Admin context
  fixedLeagueId?: string; // For League Admin context
}

export const TeamForm: React.FC<TeamFormProps> = ({
  initialData,
  isEditMode = false,
  onSuccess,
  onCancel,
  fixedTenantId,
  fixedLeagueId,
}) => {
  const user = useAuthStore((state) => state.user);
  const currentUserRoles = user?.roles || [];
  const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Role.LEAGUE_ADMIN);
  const isTeamAdmin = currentUserRoles.includes(Role.TEAM_ADMIN);

  // Determine the schema based on user role and edit mode
  // 1. Dynamically select the schema and default values
let formSchema: z.ZodTypeAny;
let defaultValues: any;

if (isEditMode) {
  if (isTeamAdmin) {
    formSchema = UpdateTeamProfileByTaFormSchema;
    defaultValues = {
      ...initialData,
      // Only include fields allowed for Team Admin
    };
  } else {
    formSchema = UpdateTeamByLaFormSchema;
    defaultValues = {
      ...initialData,
      // Only include fields allowed for LA/TA/SA
    };
  }
} else {
  formSchema = CreateTeamFormSchema;
  defaultValues = {
    name: '',
    shortCode: '',
    description: '',
    logoUrl: '',
    bannerImageUrl: '',
    country: '',
    city: '',
    state: '',
    establishedYear: undefined,
    visibility: TeamVisibility.PUBLIC,
    isActive: true,
    initialTeamAdminId: '',
    teamProfile: {},
    tenantId: fixedTenantId || '',
    leagueId: fixedLeagueId || '',
  };
}

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues});

  const watchedTenantId = watch('tenantId');
  const watchedCountry = watch('country');
  const watchedIsActive = watch('isActive'); // Watch for LA/SA to see/change
  const watchedVisibility = watch('visibility'); // Watch for LA/SA to see/change

  const [availableTenants, setAvailableTenants] = useState<TenantBasicDto[]>([]);
  const [availableLeagues, setAvailableLeagues] = useState<LeagueBasicDto[]>([]);
  const [availableVenues, setAvailableVenues] = useState<VenueBasicDto[]>([]);
  const [availableTeamAdmins, setAvailableTeamAdmins] = useState<UserBasicDto[]>([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);

  // State for collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basicInfo: true,
    location: false,
    media: false,
    adminSettings: false,
    teamAdmin: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch initial data for edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      reset({
        ...initialData,
        // Ensure fixed IDs override initialData if provided by context
        tenantId: fixedTenantId || initialData.tenantId,
        leagueId: fixedLeagueId || initialData.leagueId,
        // Handle boolean conversion for Switch if needed (Zod handles nativeEnum)
        isActive: initialData.isActive,
        visibility: initialData.visibility,
        // initialTeamAdminId might need to be fetched separately or included in initialData
        initialTeamAdminId: initialData.managers?.[0]?.id || '', // Assuming first manager is the admin
      });
      // Open all sections in edit mode for easier review
      setOpenSections({
        basicInfo: true,
        location: true,
        media: true,
        adminSettings: true,
        teamAdmin: true,
      });
    }
    setLoadingDependencies(false); // If no initialData, we're ready for create mode
  }, [isEditMode, initialData, reset, fixedTenantId, fixedLeagueId]);


  // Fetch tenants (for SYSTEM_ADMIN)
  const fetchTenants = useCallback(async () => {
    if (!isSystemAdmin) return;
    try {
      const response = await api.get('/tenants?pageSize=100'); // Fetch all or paginate
      setAvailableTenants(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch tenants.");
      console.error("Fetch tenants error:", err);
    }
  }, [isSystemAdmin]);

  // Fetch leagues based on tenantId
  const fetchLeagues = useCallback(async (tenantId: string) => {
    if (!tenantId) {
      setAvailableLeagues([]);
      setValue('leagueId', ''); // Clear league if tenant changes
      return;
    }
    try {
      const response = await api.get(`/leagues?tenantIds=${tenantId}&pageSize=100`);
      setAvailableLeagues(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch leagues for the selected tenant.");
      console.error("Fetch leagues error:", err);
    }
  }, [setValue]);

  // Fetch venues based on tenantId
  const fetchVenues = useCallback(async (tenantId: string) => {
    if (!tenantId) {
      setAvailableVenues([]);
      return;
    }
    try {
      const response = await api.get(`/venues?tenantId=${tenantId}&pageSize=100`); // Assuming venues endpoint
      setAvailableVenues(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch venues for the selected tenant.");
      console.error("Fetch venues error:", err);
    }
  }, []);

  // Fetch users for initialTeamAdminId based on tenantId
  const fetchUsersForTeamAdmin = useCallback(async (tenantId: string) => {
    if (!tenantId) {
      setAvailableTeamAdmins([]);
      return;
    }
    try {
      // Fetch users who are not already SYSTEM_ADMIN, TENANT_ADMIN, LEAGUE_ADMIN, or TEAM_ADMIN
      // This might require a backend endpoint that filters by roles and managingTeamId
      const response = await api.get(`/users?tenantId=${tenantId}&roles[]=PLAYER&roles[]=COACH&pageSize=100`); // Example: fetch players/coaches
      setAvailableTeamAdmins(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch users for team admin assignment.");
      console.error("Fetch users error:", err);
    }
  }, []);

  useEffect(() => {
    if (isSystemAdmin) {
      fetchTenants();
    } else if (fixedTenantId) {
      // If tenant is fixed by context (Tenant Admin or League Admin), fetch leagues/venues for that tenant
      fetchLeagues(fixedTenantId);
      fetchVenues(fixedTenantId);
      fetchUsersForTeamAdmin(fixedTenantId);
    }
  }, [isSystemAdmin, fixedTenantId, fetchTenants, fetchLeagues, fetchVenues, fetchUsersForTeamAdmin]);

  // Effect to fetch leagues, venues, and potential team admins when tenantId changes (for System Admin)
  useEffect(() => {
    if (isSystemAdmin && watchedTenantId) {
      fetchLeagues(watchedTenantId);
      fetchVenues(watchedTenantId);
      fetchUsersForTeamAdmin(watchedTenantId);
    }
  }, [isSystemAdmin, watchedTenantId, fetchLeagues, fetchVenues, fetchUsersForTeamAdmin]);


  const onSubmit = async (data: TeamFormValues) => {
    setLoadingDependencies(true); // Use loadingDependencies for form submission state
    try {
      let response;
      const payload = sanitizeEmptyStrings(data);// Clean up empty strings to undefined for optional fields, as per DTOs

      // Ensure tenantId and leagueId are correctly set based on context
      if (fixedTenantId) {
        payload.tenantId = fixedTenantId;
      }
      if (fixedLeagueId) {
        payload.leagueId = fixedLeagueId;
      }

      if (isEditMode && initialData) {
        // For update, use the appropriate schema based on role
        const updatePayload = isTeamAdmin
          ? UpdateTeamProfileByTaFormSchema.parse(payload) // Team Admin can only update profile
          : UpdateTeamByLaFormSchema.parse(payload); // LA/TA/SA can update more

        response = await api.put(`/teams/${initialData.id}`, updatePayload);
        toast.success('Team updated successfully!');
      } else {
        // For creation, tenantId and leagueId are required
        if (!payload.tenantId || !payload.leagueId) {
          toast.error("Validation Error", { description: "Tenant and League are required for team creation." });
          setLoadingDependencies(false);
          return;
        }
        const createPayload = CreateTeamFormSchema.parse(payload);
        response = await api.post('/teams', createPayload);
        toast.success('Team created successfully!');
      }
      onSuccess(response.data.id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to save team.";
      setError(errorMessage);
      toast.error("Error saving team", { description: errorMessage });
      console.error('Team form submission error:', err);
    } finally {
      setLoadingDependencies(false);
    }
  };

  const setError = (message: string) => {
    // This is a simple way to show a general error.
    // For field-specific errors, react-hook-form's errors object is used.
    console.error(message);
  };

  if (loadingDependencies && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading team data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {isEditMode ? 'Edit Team' : 'Create New Team'}
      </h2>

      {/* Tenancy & League Section (Conditional based on role) */}
      {(isSystemAdmin || !isEditMode) && ( // Show for SA always, and for creation if not fixed
        <div className="border rounded-lg bg-gray-50">
          <button
            type="button"
            className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-700"
            onClick={() => toggleSection('tenancyLeague')}
          >
            <span><FiAward className="inline-block mr-2" /> Tenancy & League Assignment</span>
            {openSections.tenancyLeague ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.tenancyLeague && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              {/* Tenant Selection (SYSTEM_ADMIN only) */}
              {isSystemAdmin ? (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="tenantId" required>Tenant</Label>
                  <Select
                    onValueChange={(value) => setValue('tenantId', value, { shouldValidate: true })}
                    value={watchedTenantId || ''}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className={errors.tenantId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tenantId?.message && (
                    <p className="text-red-500 text-xs mt-1">
                      {typeof errors.tenantId.message === 'string' ? errors.tenantId.message : 'Invalid input'}
                    </p>
                  )}
                </div>
              ) : (
                // Display fixed tenant for TENANT_ADMIN/LEAGUE_ADMIN
                fixedTenantId && (
                  <Input
                    label="Tenant"
                    name="tenantId"
                    value={availableTenants.find(t => t.id === fixedTenantId)?.name || 'Loading...'}
                    disabled={true}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                    hint="This team will belong to your tenant."
                  />
                )
              )}

              {/* League Selection (Conditional based on role and tenant selection) */}
              {(isSystemAdmin || isTenantAdmin || isLeagueAdmin) && (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="leagueId" required>League</Label>
                  {fixedLeagueId ? (
                    <Input
                      label="League"
                      name="leagueId"
                      value={availableLeagues.find(l => l.id === fixedLeagueId)?.name || 'Loading...'}
                      disabled={true}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed"
                      hint="This team will belong to your assigned league."
                    />
                  ) : (
                    <Select
                      onValueChange={(value) => setValue('leagueId', value, { shouldValidate: true })}
                      value={watch('leagueId') || ''}
                      disabled={isSubmitting || !watchedTenantId || availableLeagues.length === 0}
                    >
                      <SelectTrigger className={errors.leagueId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a league" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLeagues.map((league) => (
                          <SelectItem key={league.id} value={league.id}>
                            {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.leagueId?.message && (
                      <p className="text-red-500 text-xs mt-1">
                        {typeof errors.leagueId.message === 'string' ? errors.leagueId.message : 'Invalid input'}
                      </p>
                    )}
                  {!watchedTenantId && isSystemAdmin && <p className="text-gray-500 text-xs mt-1">Please select a tenant first to load leagues.</p>}
                  {watchedTenantId && availableLeagues.length === 0 && !fixedLeagueId && <p className="text-gray-500 text-xs mt-1">No leagues found for the selected tenant.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Basic Information Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-700"
          onClick={() => toggleSection('basicInfo')}
        >
          <span><FiInfo className="inline-block mr-2" /> Basic Information</span>
          {openSections.basicInfo ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        {openSections.basicInfo && (
          <div className="p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Team Name"
              {...register('name')}
              error={typeof errors.name?.message === 'string' ? errors.name.message : 'Invalid input'}
              required
              disabled={isSubmitting}
            />
            <Input
              label="Short Code"
              {...register('shortCode')}
              error={typeof errors.shortCode?.message === 'string' ? errors.shortCode.message : 'Invalid input'}
              disabled={isSubmitting}
              hint="e.g., FCB, LFC (unique within league)"
            />
            <div className="md:col-span-2">
              <TextArea
                label="Description"
                {...register('description')}
                error={typeof errors.description?.message === 'string' ? errors.description.message : 'Invalid input'}
                disabled={isSubmitting}
              />
            </div>
            <Input
              label="Established Year"
              type="number"
              {...register('establishedYear', { valueAsNumber: true })}
              error={typeof errors.establishedYear?.message === 'string' ? errors.establishedYear.message : 'Invalid input'}
              disabled={isSubmitting}
              hint="Year the team was established (e.g., 1990)"
              restrict="numeric"
              maxCharacters={4}
            />
          </div>
        )}
      </div>

      {/* Location Details Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-700"
          onClick={() => toggleSection('location')}
        >
          <span><FiMapPin className="inline-block mr-2" /> Location Details</span>
          {openSections.location ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        {openSections.location && (
          <div className="p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="country">Country</Label>
              <CountryDropdown
                value={watchedCountry || ''}
                onChange={(val) => setValue('country', val, { shouldValidate: true })}
                className={`w-full px-3 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                disabled={isSubmitting}
              />
              {errors.country?.message && (
                <p className="text-red-500 text-xs mt-1">
                  {typeof errors.country.message === 'string' ? errors.country.message : 'Invalid input'}
                </p>
              )}
            </div>
            <Input
              label="City"
              {...register('city')}
              error={typeof errors.city?.message === 'string' ? errors.city.message : 'Invalid input'}
              disabled={isSubmitting}
            />
            <Input
              label="State/Region"
              {...register('state')}
              error={typeof errors.state?.message === 'string' ? errors.state.message : 'Invalid input'}
              disabled={isSubmitting}
            />
            {/* Home Venue (only editable by SA/TA/LA) */}
            {(!isTeamAdmin || !isEditMode) && ( // Show if not Team Admin OR if in create mode
              <div className="flex flex-col space-y-2">
                <Label htmlFor="homeVenueId">Home Venue</Label>
                <Select
                  onValueChange={(value) => setValue('homeVenueId', value, { shouldValidate: true })}
                  value={watch('homeVenueId') || ''}
                  disabled={isSubmitting || !watchedTenantId || availableVenues.length === 0}
                >
                  <SelectTrigger className={errors.homeVenueId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a home venue (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVenues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name} {venue.address ? `(${venue.address})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.homeVenueId?.message && (
                  <p className="text-red-500 text-xs mt-1">
                    {typeof errors.homeVenueId.message === 'string' ? errors.homeVenueId.message : 'Invalid input'}
                  </p>
                )}
                {!watchedTenantId && <p className="text-gray-500 text-xs mt-1">Select a tenant to load venues.</p>}
                {watchedTenantId && availableVenues.length === 0 && <p className="text-gray-500 text-xs mt-1">No venues found for the selected tenant.</p>}
              </div>
            )}
            {isTeamAdmin && isEditMode && initialData?.homeVenueId && ( // Show read-only for Team Admin in edit mode
                <Input
                    label="Home Venue"
                    name="homeVenueId"
                    value={availableVenues.find(v => v.id === initialData.homeVenueId)?.name || 'N/A'}
                    disabled={true}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                    hint="Team Admins cannot change the home venue."
                />
            )}
             {isTeamAdmin && isEditMode && !initialData?.homeVenueId && (
                <Input
                    label="Home Venue"
                    name="homeVenueId"
                    value="N/A"
                    disabled={true}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                    hint="No home venue assigned."
                />
            )}
          </div>
        )}
      </div>

      {/* Media & Branding Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-700"
          onClick={() => toggleSection('media')}
        >
          <span><FiImage className="inline-block mr-2" /> Media & Branding</span>
          {openSections.media ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        {openSections.media && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <Input
              label="Logo URL"
              {...register('logoUrl')}
              error={typeof errors.logoUrl?.message === 'string' ? errors.logoUrl.message : 'Invalid input'}
              disabled={isSubmitting}
              hint="URL to the team's primary logo image"
            />
            <Input
              label="Banner Image URL"
              {...register('bannerImageUrl')}
              error={typeof errors.bannerImageUrl?.message === 'string' ? errors.bannerImageUrl.message : 'Invalid input'}
              disabled={isSubmitting}
              hint="URL to the team's banner image (e.g., for profile header)"
            />
          </div>
        )}
      </div>

      {/* Administrative Settings Section (Only for SA/TA/LA) */}
      {(!isTeamAdmin || !isEditMode) && ( // Show if not Team Admin OR if in create mode
        <div className="border rounded-lg">
          <button
            type="button"
            className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-700"
            onClick={() => toggleSection('adminSettings')}
          >
            <span><FiSettings className="inline-block mr-2" /> Administrative Settings</span>
            {openSections.adminSettings ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.adminSettings && (
            <div className="p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Switch
                label="Is Active"
                name="isActive"
                checked={watchedIsActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
                disabled={isSubmitting}
                error={typeof errors.isActive?.message === 'string' ? errors.isActive.message : 'Invalid input'}
              />
              <div className="flex flex-col space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  onValueChange={(value: TeamVisibility) => setValue('visibility', value, { shouldValidate: true })}
                  value={watchedVisibility}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={errors.visibility ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TeamVisibility).map((vis) => (
                      <SelectItem key={vis} value={vis}>
                        {vis.charAt(0).toUpperCase() + vis.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.visibility?.message && (
                    <p className="text-red-500 text-xs mt-1">
                      {typeof errors.visibility.message === 'string' ? errors.visibility.message : 'Invalid input'}
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Team Admin Assignment (Only for creation or if not already assigned) */}
      {!isEditMode && (isSystemAdmin || isTenantAdmin || isLeagueAdmin) && (
        <div className="border rounded-lg">
          <button
            type="button"
            className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-700"
            onClick={() => toggleSection('teamAdmin')}
          >
            <span><FiUsers className="inline-block mr-2" /> Assign Initial Team Admin</span>
            {openSections.teamAdmin ? <FiChevronDown /> : <FiChevronRight />}
          </button>
          {openSections.teamAdmin && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="initialTeamAdminId">Select User</Label>
                <Select
                  onValueChange={(value) => setValue('initialTeamAdminId', value, { shouldValidate: true })}
                  value={watch('initialTeamAdminId') || ''}
                  disabled={isSubmitting || availableTeamAdmins.length === 0}
                >
                  <SelectTrigger className={errors.initialTeamAdminId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeamAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.username} ({admin.firstName} {admin.lastName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.initialTeamAdminId?.message && (
                    <p className="text-red-500 text-xs mt-1">
                      {typeof errors.initialTeamAdminId.message === 'string' ? errors.initialTeamAdminId.message : 'Invalid input'}
                    </p>
                  )}
                {availableTeamAdmins.length === 0 && <p className="text-gray-500 text-xs mt-1">No eligible users found for team admin. Ensure a tenant is selected and users are not already higher-level admins.</p>}
                <p className="text-gray-500 text-xs mt-1">This user will be assigned the `TEAM_ADMIN` role for this team.</p>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Team Profile (JSON) - Always editable by anyone who can edit the team */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-700"
          onClick={() => toggleSection('teamProfile')}
        >
          <span><FiBox className="inline-block mr-2" /> Custom Team Profile Data (JSON)</span>
          {openSections.teamProfile ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        {openSections.teamProfile && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <TextArea
              label="Team Profile JSON"
              {...register('teamProfile', {
                validate: (value) => {
                  if (value === undefined || value === null) return true;
                  try {
                    // Attempt to parse if it's a string, otherwise assume it's already an object
                    JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
                    return true;
                  } catch (e) {
                    return "Invalid JSON format.";
                  }
                }
              })}
              value={typeof watch('teamProfile') === 'object' && watch('teamProfile') !== null
                ? JSON.stringify(watch('teamProfile'), null, 2)
                : watch('teamProfile') as string || ''
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setValue('teamProfile', parsed, { shouldValidate: true });
                } catch (error) {
                  // If invalid JSON, store as string and let validation handle it
                  setValue('teamProfile', e.target.value as any, { shouldValidate: true });
                }
              }}
              error={typeof errors.teamProfile?.message === 'string' ? errors.teamProfile.message : 'Invalid input'}
              disabled={isSubmitting}
              rows={8}
              //hint="Enter custom team data in JSON format (e.g., {'slogan': 'Go Team!'})"
            />
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 mt-8">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} variant="primary">
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Team' : 'Create Team')}
        </Button>
      </div>
    </form>
  );
};
