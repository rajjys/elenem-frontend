
// components/forms/league-form.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import {
  CreateLeagueSchema,
  UpdateLeagueSchema,
  LeagueDetails,
  UserResponseDto,
  PaginatedResponseDto,
  TenantBasicDto,
  SportType,
  LeagueVisibility,
  Gender,
  Role,
  PointSystemConfig,
  TieBreakerConfig,
  PointRule,
  BonusPointRule,
  TieBreakerRule,
  PaginatedTenantsResponseDto,
  PaginatedLeaguesResponseDto,
  PaginatedUsersResponseSchema,
  UserBasic
} from '@/schemas'; // Adjust import path as per your project structure
import { api } from '@/services/api';
import { countryNameToCode, sanitizeEmptyStrings } from '@/utils/'; // Assuming utils exists

// For unique keys in dynamic lists
//import { v4 as uuidv4 } from 'uuid';

// Helper for dynamic form values
type LeagueFormValues =
  | z.infer<typeof CreateLeagueSchema>
  | z.infer<typeof UpdateLeagueSchema>;

interface LeagueFormProps {
  initialData?: LeagueDetails; // For editing
  isEditMode?: boolean; // True for edit, false for create
  currentUserRoles: Role[]; // Roles of the currently logged-in user
  currentTenantId?: string; // Tenant ID if current user is a Tenant Admin
  onSuccess?: (leagueId: string) => void;
  onCancel?: () => void;
}

// Default/template point and tiebreaker configs based on SportType
// In a real app, this might come from an API / database
const defaultSportConfigs: {
  [key in SportType]?: {
    pointSystem: PointSystemConfig;
    tieBreakers: TieBreakerConfig;
  }
} = {
  [SportType.SOCCER]: {
    pointSystem: {
      rules: [
        { outcome: "WIN", points: 3 },
        { outcome: "DRAW", points: 1 },
        { outcome: "LOSS", points: 0 },
        { outcome: "WiN_FORFEIT", points: 3},
        { outcome: "LOSS_FORFEIT", points: 0}
      ],
      bonusPoints: [],
    },
    tieBreakers: [
      { order: 1, metric: "HEAD_TO_HEAD_POINTS", sort: "DESC" },
      { order: 2, metric: "GOAL_DIFFERENCE", sort: "DESC" },
      { order: 3, metric: "GOALS_SCORED", sort: "DESC" },
    ],
  },
  [SportType.BASKETBALL]: {
    pointSystem: {
      rules: [
        { outcome: "WIN", points: 2 },
        { outcome: "LOSS", points: 1 }, // Some basketball leagues give point for loss (e.g. for participation)
        { outcome: "WiN_FORFEIT", points: 2},
        { outcome: "LOSS_FORFEIT", points: 0}
      ],
    },
    tieBreakers: [
      { order: 1, metric: "HEAD_TO_HEAD_POINTS", sort: "DESC" },
      { order: 2, metric: "POINT_DIFFERENCE", sort: "DESC" },
      { order: 3, metric: "POINTS_SCORED", sort: "DESC" },
    ],
  },
  [SportType.VOLLEYBALL]: {
    pointSystem: {
      rules: [
        { outcome: "WIN_3_0", points: 3 },
        { outcome: "WIN_3_1", points: 3 },
        { outcome: "WIN_3_2", points: 2 },
        { outcome: "LOSS_2_3", points: 1 },
        { outcome: "LOSS_0_3", points: 0 },
        { outcome: "LOSS_1_3", points: 0 },
      ],
    },
    tieBreakers: [
      { order: 1, metric: "MATCH_WIN_RATIO", sort: "DESC" },
      { order: 2, metric: "SET_RATIO", sort: "DESC" },
      { order: 3, metric: "POINT_RATIO", sort: "DESC" },
    ],
  },
  // Add more default configurations for other SportTypes
};

export function LeagueForm({
  initialData,
  isEditMode = false,
  currentUserRoles,
  currentTenantId,
  onSuccess,
  onCancel,
}: LeagueFormProps) {
  const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);

  const formSchema = isEditMode ? UpdateLeagueSchema : CreateLeagueSchema;

  const defaultFormValues: LeagueFormValues = useMemo(() => {
    const defaultPoints = defaultSportConfigs[initialData?.sportType || SportType.SOCCER]?.pointSystem || { rules: [], bonusPoints: [] };
    const defaultTiebreakers = defaultSportConfigs[initialData?.sportType || SportType.SOCCER]?.tieBreakers || [];

    return isEditMode
      ? {
        name: initialData?.name || '',
        description: initialData?.description ?? undefined,
        leagueCode: initialData?.leagueCode || '',
        sportType: initialData?.sportType || SportType.SOCCER,
        visibility: initialData?.visibility || LeagueVisibility.PUBLIC,
        gender: initialData?.gender || Gender.MIXED,
        country: initialData?.country || '',
        region: initialData?.region ?? undefined,
        city: initialData?.city ?? undefined,
        state: initialData?.state ?? undefined,
        establishedYear: initialData?.establishedYear ?? undefined,
        logoUrl: initialData?.logoUrl ?? undefined,
        bannerImageUrl: initialData?.bannerImageUrl ?? undefined,
        isActive: initialData?.isActive ?? true,
        ownerId: initialData?.ownerId ?? undefined,
        tenantId: initialData?.tenantId || (isTenantAdmin && currentTenantId ? currentTenantId : ''),
        parentLeagueId: initialData?.parentLeagueId ?? undefined,
        division: initialData?.division ?? undefined,
        pointSystemConfig: initialData?.pointSystemConfig || defaultPoints,
        tieBreakerConfig: initialData?.tieBreakerConfig || defaultTiebreakers,
      }
      : {
        name: '',
        description: undefined,
        leagueCode: '',
        sportType: SportType.SOCCER,
        visibility: LeagueVisibility.PUBLIC,
        gender: Gender.MIXED,
        country: '',
        region: undefined,
        city: undefined,
        state: undefined,
        establishedYear: undefined,
        logoUrl: undefined,
        bannerImageUrl: undefined,
        isActive: true,
        ownerId: undefined,
        tenantId: (isTenantAdmin && currentTenantId) ? currentTenantId : '',
        parentLeagueId: undefined,
        division: undefined,
        pointSystemConfig: defaultSportConfigs[SportType.SOCCER]!.pointSystem, // Default for new creation
        tieBreakerConfig: defaultSportConfigs[SportType.SOCCER]!.tieBreakers, // Default for new creation
      };
  }, [initialData, isEditMode, isTenantAdmin, currentTenantId]);


  const form = useForm<LeagueFormValues>({
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
    control,
  } = form;

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<UserBasic[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<TenantBasicDto[]>([]);
  const [loadingParentLeagues, setLoadingParentLeagues] = useState(false);
  const [availableParentLeagues, setAvailableParentLeagues] = useState<{ id: string; name: string }[]>([]);

  const [selectedCountry, setSelectedCountry] = useState(initialData?.country ? Object.keys(countryNameToCode).find(key => countryNameToCode[key] === initialData.country) || '' : '');
  const [selectedRegion, setSelectedRegion] = useState(initialData?.region || '');

  const watchSportType = watch('sportType');
  const watchTenantId = watch('tenantId');

  // Dynamic fields for PointSystemConfig
  const { fields: pointRules, append: appendPointRule, remove: removePointRule } = useFieldArray({
    control,
    name: "pointSystemConfig.rules"
  });

  const { fields: bonusPointRules, append: appendBonusPointRule, remove: removeBonusPointRule } = useFieldArray({
    control,
    name: "pointSystemConfig.bonusPoints"
  });

  // Dynamic fields for TieBreakerConfig
  const { fields: tieBreakerRules, append: appendTieBreakerRule, remove: removeTieBreakerRule } = useFieldArray({
    control,
    name: "tieBreakerConfig"
  });

  // Fetch GENERAL_USERs for owner selection
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          //roles: Role.GENERAL_USER.toString(),
          //pageSize: '100',
          tenantId: currentTenantId || '',
        });
        const response = await api.get(`/users?${params.toString()}`);
        const validatedOwners = PaginatedUsersResponseSchema.parse(response.data);
        setAvailableOwners(validatedOwners.data);
      } catch (error) {
        console.error('Failed to fetch users for owner dropdown:', error);
        toast.error("Failed to load users for owner selection.");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [isSystemAdmin, isTenantAdmin, currentTenantId]);


  // Fetch Tenants for System Admin
  useEffect(() => {
    if (isSystemAdmin) {
      const fetchTenants = async () => {
        setLoadingTenants(true);
        try {
          const response = await api.get<PaginatedTenantsResponseDto>('/tenants?pageSize=100');
          setAvailableTenants(response.data.data);
        } catch (error) {
          console.error('Failed to fetch tenants:', error);
          toast.error("Failed to load tenants for selection.");
        } finally {
          setLoadingTenants(false);
        }
      };
      fetchTenants();
    } else if (isTenantAdmin && currentTenantId) {
      // For Tenant Admin, set the tenant and disable the selection
      setValue('tenantId', currentTenantId);
    }
  }, [isSystemAdmin, isTenantAdmin, currentTenantId, setValue]);

  // Fetch Parent Leagues based on selected tenant and sport type
  useEffect(() => {
    if (watchTenantId) {
      const fetchParentLeagues = async () => {
        setLoadingParentLeagues(true);
        try {
          const params = new URLSearchParams({
            tenantIds: watchTenantId,
            sportType: watchSportType,
            pageSize: '100', // Fetch all potential parent leagues within the tenant
            // A parent league usually has no parent itself (or null) and is a top-level league
            // The backend query should filter for this to prevent circular references and illogical nesting
            ///parentLeagueId: 'null', // Assuming parent leagues are those without a parent themselves
          });
          const response = await api.get<PaginatedLeaguesResponseDto>(`/leagues?${params.toString()}`);
          // Filter out the current league itself in edit mode to prevent self-parenting
          const filteredLeagues = response.data.data.filter((l: LeagueDetails) => l.id !== initialData?.id);
          setAvailableParentLeagues(filteredLeagues.map((l: LeagueDetails) => ({ id: l.id, name: l.name })));
        } catch (error) {
          console.error('Failed to fetch parent leagues:', error);
          toast.error("Failed to load parent leagues.");
        } finally {
          setLoadingParentLeagues(false);
        }
      };
      fetchParentLeagues();
    } else {
      setAvailableParentLeagues([]);
    }
  }, [watchTenantId, watchSportType, initialData?.id]);


  // Reset country/region dropdowns if initialData changes (e.g., in edit mode)
  useEffect(() => {
    if (initialData) {
      setSelectedCountry(Object.keys(countryNameToCode).find(key => countryNameToCode[key] === initialData.country) || '');
      setSelectedRegion(initialData.region || '');
    } else {
      // Reset for new creation
      setSelectedCountry('');
      setSelectedRegion('');
    }
  }, [initialData]);

  // Update point system and tiebreakers when sport type changes
  useEffect(() => {
    const newPointSystem = defaultSportConfigs[watchSportType]?.pointSystem || { rules: [], bonusPoints: [] };
    const newTieBreakers = defaultSportConfigs[watchSportType]?.tieBreakers || [];

    // Ensure we replace all current entries
    form.setValue('pointSystemConfig.rules', newPointSystem.rules, { shouldValidate: true });
    form.setValue('pointSystemConfig.bonusPoints', newPointSystem.bonusPoints || [], { shouldValidate: true });
    form.setValue('tieBreakerConfig', newTieBreakers, { shouldValidate: true });
  }, [watchSportType, form]);


  const onSubmit = async (rawData: LeagueFormValues) => {
    const sanitizedData = sanitizeEmptyStrings(rawData);
    const payload = {
      ...sanitizedData,
      establishedYear: sanitizedData.establishedYear ? Number(sanitizedData.establishedYear) : undefined,
      // Ensure tenantId is always a string for the payload, even if it was potentially nullish initially
      tenantId: sanitizedData.tenantId || (isTenantAdmin && currentTenantId ? currentTenantId : undefined),
      // Ensure pointSystemConfig and tieBreakerConfig are always objects/arrays even if empty
      pointSystemConfig: sanitizedData.pointSystemConfig || { rules: [], bonusPoints: [] },
      tieBreakerConfig: sanitizedData.tieBreakerConfig || [],
    };

    if (!payload.tenantId) {
      toast.error("Tenant is required for league creation.");
      return;
    }

    try {
      let response;
      if (isEditMode && initialData?.id) {
        response = await api.put(`/leagues/${initialData.id}`, payload);
        toast.success("League updated successfully!");
      } else {
        response = await api.post('/leagues', payload);
        toast.success("League created successfully!");
        reset(defaultFormValues); // Reset form for new creation
      }
      onSuccess?.(response.data.id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} league.`;
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} league`, { description: errorMessage });
      console.error(`${isEditMode ? 'Update' : 'Create'} league error:`, err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditMode ? `Edit League: ${initialData?.name}` : 'Create New League'}
      </h2>

      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isSystemAdmin && (
          <div>
            <Label htmlFor="tenantId" required>Tenant</Label>
            {loadingTenants ? (
              <p className="text-gray-500">Loading tenants...</p>
            ) : (
              <Select
                value={watch('tenantId') || ''}
                onValueChange={(value) => setValue('tenantId', value, { shouldValidate: true })}
                disabled={isSubmitting || isEditMode} // Tenant usually not editable after creation
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.tenantCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.tenantId && <p className="text-red-500 text-xs mt-1">{errors.tenantId.message}</p>}
          </div>
        )}

        {isTenantAdmin && currentTenantId && (
          <div>
            <Label htmlFor="tenantId">Tenant (Pre-selected)</Label>
            <Input
              id="tenantId"
              value={initialData?.tenant?.name || "Current Tenant"}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
            {/* Hidden input to ensure tenantId is passed */}
            <input type="hidden" {...register('tenantId')} value={currentTenantId} />
          </div>
        )}

        <div>
          <Label htmlFor="name" required>League Name</Label>
          <Input id="name" placeholder="e.g., Premier League" {...register('name')} maxLength={100} disabled={isSubmitting} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="leagueCode" required>League Code</Label>
          <Input
            id="leagueCode"
            placeholder="e.g., EPL"
            {...register('leagueCode')}
            maxLength={10}
            onBlur={(e) => setValue('leagueCode', e.target.value.toUpperCase(), { shouldValidate: true })}
            disabled={isSubmitting || isEditMode} // League code usually not editable after creation
          />
          {errors.leagueCode && <p className="text-red-500 text-xs mt-1">{errors.leagueCode.message}</p>}
          <p className="text-gray-500 text-xs mt-1">A unique short code for the league.</p>
        </div>

        <div>
          <Label htmlFor="sportType" required>Sport Type</Label>
          <Select
            value={watch('sportType')}
            onValueChange={(value: SportType) => setValue('sportType', value, { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Sport Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SportType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sportType && <p className="text-red-500 text-xs mt-1">{errors.sportType.message}</p>}
        </div>

        <div>
          <Label htmlFor="gender" required>Gender</Label>
          <Select
            value={watch('gender')}
            onValueChange={(value: Gender) => setValue('gender', value, { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Gender).map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender.charAt(0) + gender.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
        </div>

        <div>
          <Label htmlFor="visibility" required>Visibility</Label>
          <Select
            value={watch('visibility')}
            onValueChange={(value: LeagueVisibility) => setValue('visibility', value, { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Visibility" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(LeagueVisibility).map((vis) => (
                <SelectItem key={vis} value={vis}>
                  {vis.charAt(0) + vis.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.visibility && <p className="text-red-500 text-xs mt-1">{errors.visibility.message}</p>}
        </div>

        <div className="flex items-center space-x-2 col-span-1">
          <Switch
            id="isActive"
            checked={watch('isActive')}
            onCheckedChange={(checked) => setValue('isActive', checked, { shouldValidate: true })}
            disabled={isSubmitting}
          />
          <Label htmlFor="isActive">Active League</Label>
          {errors.isActive && <p className="text-red-500 text-xs mt-1">{errors.isActive.message}</p>}
        </div>
      </div>

      {/* Description & URLs */}
      <div>
        <Label htmlFor="description">Description</Label>
        <TextArea id="description" placeholder="A brief description of the league." {...register('description')} rows={3} disabled={isSubmitting} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" type="url" placeholder="https://example.com/league-logo.png" {...register('logoUrl')} disabled={isSubmitting} />
          {errors.logoUrl && <p className="text-red-500 text-xs mt-1">{errors.logoUrl.message}</p>}
        </div>
        <div>
          <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
          <Input id="bannerImageUrl" type="url" placeholder="https://example.com/league-banner.png" {...register('bannerImageUrl')} disabled={isSubmitting} />
          {errors.bannerImageUrl && <p className="text-red-500 text-xs mt-1">{errors.bannerImageUrl.message}</p>}
        </div>
      </div>

      {/* Location and Established Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country" required>Country</Label>
          <CountryDropdown
            id="country"
            value={selectedCountry}
            onChange={(val) => {
              const isoCode = countryNameToCode[val] || '';
              setSelectedCountry(val);
              setValue('country', isoCode, { shouldValidate: true });
              setSelectedRegion('');
              setValue('region', undefined, { shouldValidate: true }); // Clear region when country changes
            }}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isSubmitting}
          />
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
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
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" type="text" placeholder="e.g., London" {...register('city')} disabled={isSubmitting} />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="state">State (Deprecated, use Region)</Label>
          <Input id="state" type="text" placeholder="e.g., California" {...register('state')} disabled={isSubmitting} />
          {errors.state && <p className="text-gray-500 text-xs mt-1">Consider using "Region / Province / State" for better compatibility.</p>}
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
        </div>
        <div>
          <Label htmlFor="establishedYear">Established Year</Label>
          <Input
            id="establishedYear"
            type="number"
            min="1800"
            max={new Date().getFullYear()}
            placeholder="e.g., 2005"
            {...register('establishedYear', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.establishedYear && <p className="text-red-500 text-xs mt-1">{errors.establishedYear.message}</p>}
        </div>
      </div>

      {/* Parent League & Division */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="parentLeagueId">Parent League (Optional)</Label>
          {loadingParentLeagues ? (
            <p className="text-gray-500">Loading parent leagues...</p>
          ) : (
            <Select
              value={watch('parentLeagueId') || ''}
              onValueChange={(value) => setValue('parentLeagueId', value || undefined, { shouldValidate: true })}
              disabled={isSubmitting || !watchTenantId} // Disable if no tenant selected
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a parent league" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Parent League (Top-level)</SelectItem>
                {availableParentLeagues.map((league) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.parentLeagueId && <p className="text-red-500 text-xs mt-1">{errors.parentLeagueId.message}</p>}
          <p className="text-gray-500 text-xs mt-1">Select if this is a division or sub-league.</p>
        </div>
        <div>
          <Label htmlFor="division">Division (e.g., D1, Pro League)</Label>
          <Input
            id="division"
            placeholder="e.g., D1 Male, Amateur League"
            {...register('division')}
            maxLength={50}
            disabled={isSubmitting}
          />
          {errors.division && <p className="text-red-500 text-xs mt-1">{errors.division.message}</p>}
          <p className="text-gray-500 text-xs mt-1">A specific division name within the league hierarchy.</p>
        </div>
      </div>

      {/* Owner Selection */}
      <div>
        <Label htmlFor="ownerId">Owner (General User)</Label>
        {loadingUsers ? (
          <p className="text-gray-500">Loading users...</p>
        ) : (
          <Select
            value={watch('ownerId') || ''}
            onValueChange={(value) => setValue('ownerId', value || undefined, { shouldValidate: true })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an owner (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No Owner (Platform Controlled)</SelectItem>
              {availableOwners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.username} ({owner.email}) {owner.firstName && owner.lastName ? ` - ${owner.firstName} ${owner.lastName}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId.message}</p>}
        <p className="text-gray-500 text-xs mt-1">Assign an existing GENERAL_USER as the primary owner of this league.</p>
      </div>

      {/* Points System Configuration */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Points System Configuration for {watchSportType.replace(/_/g, ' ')}</h3>
        <p className="text-gray-600 text-sm mb-4">Define how points are awarded for different match outcomes.</p>

        {pointRules.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2 mb-2">
            <div className="flex-grow">
              <Label htmlFor={`rules-${index}-outcome`}>Outcome</Label>
              <Input
                id={`rules-${index}-outcome`}
                placeholder="e.g., WIN, DRAW, WIN_3_0"
                {...register(`pointSystemConfig.rules.${index}.outcome`)}
              />
              {errors.pointSystemConfig?.rules?.[index]?.outcome && (
                <p className="text-red-500 text-xs mt-1">{errors.pointSystemConfig.rules[index]?.outcome?.message}</p>
              )}
            </div>
            <div className="w-24">
              <Label htmlFor={`rules-${index}-points`}>Points</Label>
              <Input
                id={`rules-${index}-points`}
                type="number"
                placeholder="e.g., 3"
                {...register(`pointSystemConfig.rules.${index}.points`, { valueAsNumber: true })}
              />
              {errors.pointSystemConfig?.rules?.[index]?.points && (
                <p className="text-red-500 text-xs mt-1">{errors.pointSystemConfig.rules[index]?.points?.message}</p>
              )}
            </div>
            <Button type="button" variant="danger" onClick={() => removePointRule(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendPointRule({ outcome: '', points: 0 })}
          className="mt-2"
        >
          Add Point Rule
        </Button>

        <h4 className="text-md font-medium mt-6 mb-2">Bonus Points (Optional)</h4>
        {bonusPointRules.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2 mb-2">
            <div className="flex-grow">
              <Label htmlFor={`bonus-${index}-condition`}>Condition</Label>
              <Input
                id={`bonus-${index}-condition`}
                placeholder="e.g., CLEAN_SHEET"
                {...register(`pointSystemConfig.bonusPoints.${index}.condition`)}
              />
              {errors.pointSystemConfig?.bonusPoints?.[index]?.condition && (
                <p className="text-red-500 text-xs mt-1">{errors.pointSystemConfig.bonusPoints[index]?.condition?.message}</p>
              )}
            </div>
            <div className="w-24">
              <Label htmlFor={`bonus-${index}-points`}>Points</Label>
              <Input
                id={`bonus-${index}-points`}
                type="number"
                placeholder="e.g., 1"
                {...register(`pointSystemConfig.bonusPoints.${index}.points`, { valueAsNumber: true })}
              />
              {errors.pointSystemConfig?.bonusPoints?.[index]?.points && (
                <p className="text-red-500 text-xs mt-1">{errors.pointSystemConfig.bonusPoints[index]?.points?.message}</p>
              )}
            </div>
            <Button type="button" variant="danger" onClick={() => removeBonusPointRule(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendBonusPointRule({ condition: '', points: 0 })}
          className="mt-2"
        >
          Add Bonus Point Rule
        </Button>
      </div>

      {/* Tiebreakers Configuration */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Tiebreaker Configuration</h3>
        <p className="text-gray-600 text-sm mb-4">Ordered list of rules to break ties in standings. Drag to reorder.</p>

        {tieBreakerRules.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2 mb-2">
            <div className="w-16">
              <Label htmlFor={`tiebreaker-${index}-order`}>Order</Label>
              <Input
                id={`tiebreaker-${index}-order`}
                type="number"
                value={index + 1} // Display 1-based order
                disabled // Order is implicitly by array position
                className="bg-gray-100"
              />
            </div>
            <div className="flex-grow">
              <Label htmlFor={`tiebreaker-${index}-metric`}>Metric</Label>
              <Input
                id={`tiebreaker-${index}-metric`}
                placeholder="e.g., HEAD_TO_HEAD_POINTS, GOAL_DIFFERENCE"
                {...register(`tieBreakerConfig.${index}.metric`)}
              />
              {errors.tieBreakerConfig?.[index]?.metric && (
                <p className="text-red-500 text-xs mt-1">{errors.tieBreakerConfig[index]?.metric?.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`tiebreaker-${index}-sort`}>Sort Order</Label>
              <Select
                value={watch(`tieBreakerConfig.${index}.sort`)}
                onValueChange={(val: 'ASC' | 'DESC' | 'RANDOM') => setValue(`tieBreakerConfig.${index}.sort`, val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Descending</SelectItem>
                  <SelectItem value="ASC">Ascending</SelectItem>
                  <SelectItem value="RANDOM">Random (Last Resort)</SelectItem>
                </SelectContent>
              </Select>
              {errors.tieBreakerConfig?.[index]?.sort && (
                <p className="text-red-500 text-xs mt-1">{errors.tieBreakerConfig[index]?.sort?.message}</p>
              )}
            </div>
            <Button type="button" variant="danger" onClick={() => removeTieBreakerRule(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendTieBreakerRule({ order: tieBreakerRules.length + 1, metric: '', sort: 'DESC' })}
          className="mt-2"
        >
          Add Tiebreaker Rule
        </Button>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 mt-8">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update League' : 'Create League')}
        </Button>
      </div>
    </form>
  );
}