// components/forms/league-form.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge, TextArea } from '../ui';
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
  SportType,
  LeagueVisibility,
  Gender,
  Role,
  PointSystemConfig,
  TieBreakerConfig,
  PointRule,
  BonusPointRule,
  TieBreakerRule,
  TenantBasicDto, // Assuming this is the type for availableTenants
  PaginatedLeaguesResponseDto
} from '@/prisma/';
import { api } from '@/services/api';
import { countryNameToCode, sanitizeEmptyStrings } from '@/utils/';
import { useAuthStore } from '@/store/auth.store';

// DTO for the Sport Rules API response (matching backend)
interface SportRulesApiResponse {
  sportType: SportType;
  pointSystem: {
    rules: { outcome: string; points: number; condition?: string }[];
    bonusPoints?: { outcome: string; points: number; condition?: string }[];
    commonMetrics?: Record<string, string>;
  };
  tieBreakers: { order: number; rule: string; description: string; sort: 'ASC' | 'DESC' | 'RANDOM' }[];
}

type LeagueFormValues =
  | z.infer<typeof CreateLeagueSchema>
  | z.infer<typeof UpdateLeagueSchema>;

interface LeagueFormProps {
  initialData?: LeagueDetails; // For editing
  isEditMode?: boolean; // True for edit, false for create
  onSuccess?: (leagueId: string) => void;
  onCancel?: () => void;
}

export function LeagueForm({
  initialData,
  isEditMode = false,
  onSuccess,
  onCancel,
}: LeagueFormProps) {

  const userAuth = useAuthStore((state) => state.user);
  const currentUserRoles = userAuth?.roles || [];
  const currentUsersTenantId = userAuth?.tenantId;
  const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Role.LEAGUE_ADMIN); // Added League Admin check
  
  const formSchema = isEditMode ? UpdateLeagueSchema : CreateLeagueSchema;

  const form = useForm<LeagueFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => {
      // Initialize pointSystemConfig and tieBreakerConfig from initialData or empty
      const defaultPointsConfig = initialData?.pointSystemConfig || { rules: [], bonusPoints: [] };
      const defaultTieBreakerConfig = initialData?.tieBreakerConfig || [];

      return isEditMode
        ? {
          name: initialData?.name || '',
          description: initialData?.description ?? undefined,
          leagueCode: initialData?.leagueCode || '',
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
          tenantId: initialData?.tenantId || (isTenantAdmin && currentUsersTenantId ? currentUsersTenantId : ''),
          parentLeagueId: initialData?.parentLeagueId ?? undefined,
          division: initialData?.division ?? undefined,
          pointSystemConfig: defaultPointsConfig,
          tieBreakerConfig: defaultTieBreakerConfig,
        }
        : {
          name: '',
          description: undefined,
          leagueCode: '',
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
          tenantId: (isTenantAdmin && currentUsersTenantId) ? currentUsersTenantId : '',
          parentLeagueId: undefined,
          division: undefined,
          pointSystemConfig: { rules: [], bonusPoints: [] }, // Start empty for creation
          tieBreakerConfig: [], // Start empty for creation
        };
    }, [initialData, isEditMode, isTenantAdmin, currentUsersTenantId]),
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

  const [loadingForm, setLoadingForm] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<UserResponseDto[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<TenantBasicDto[]>([]); 
  const [loadingParentLeagues, setLoadingParentLeagues] = useState(false);
  const [availableParentLeagues, setAvailableParentLeagues] = useState<{ id: string; name: string }[]>([]);
  const [sportRulesTemplate, setSportRulesTemplate] = useState<SportRulesApiResponse | null>(null); // Renamed to template
  const [loadingSportRulesTemplate, setLoadingSportRulesTemplate] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(initialData?.country ? Object.keys(countryNameToCode).find(key => countryNameToCode[key] === initialData.country) || '' : '');
  const [selectedRegion, setSelectedRegion] = useState(initialData?.region || '');

  const watchTenantId = watch('tenantId');
  const watchPointRules = watch('pointSystemConfig.rules');
  const watchTieBreakerRules = watch('tieBreakerConfig');

  // Determine the effective sportType based on the selected/current tenant
  const effectiveTenantSportType = useMemo(() => {
    if (isEditMode && initialData?.tenant?.sportType) {
      return initialData.tenant.sportType;
    }
    const selectedTenant = availableTenants.find(t => t.id === watchTenantId);
    return selectedTenant?.sportType || userAuth?.tenant?.sportType;
  }, [watchTenantId, availableTenants, isEditMode, initialData?.tenant?.sportType, userAuth?.tenant?.sportType]);


  // Fetch initial league data for edit mode and set country/region
  useEffect(() => {
    if (isEditMode && initialData) {
      setLoadingForm(false);
      setSelectedCountry(Object.keys(countryNameToCode).find(key => countryNameToCode[key] === initialData.country) || '');
      setSelectedRegion(initialData.region || '');
    } else {
      if (isTenantAdmin && currentUsersTenantId) {
        setValue("tenantId", currentUsersTenantId);
      }
      setLoadingForm(false);
    }
  }, [isEditMode, initialData, isTenantAdmin, currentUsersTenantId, setValue]);


  // Fetch GENERAL_USERs for owner selection based on tenant context
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({
          roles: Role.GENERAL_USER.toString(),
          pageSize: '100',
          managingLeagueId: 'null', 
          managingTeamId: 'null',
        });

        const targetTenantId = watchTenantId || currentUsersTenantId; // Use selected tenant or current user's tenant

        if (targetTenantId) {
          params.append('tenantId', targetTenantId);
        } else if (!isSystemAdmin) {
          // If not System Admin and no tenant selected/available, don't fetch users
          setAvailableOwners([]);
          setLoadingUsers(false);
          return;
        }

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
  }, [isSystemAdmin, isTenantAdmin, currentUsersTenantId, watchTenantId]);


  // Fetch Tenants for System Admin
  useEffect(() => {
    if (isSystemAdmin) {
      const fetchTenants = async () => {
        setLoadingTenants(true);
        try {
          const response = await api.get<{ data: TenantBasicDto[] }>('/tenants?pageSize=100'); // Use /tenants endpoint
          setAvailableTenants(response.data.data);
        } catch (error) {
          console.error('Failed to fetch tenants:', error);
          toast.error("Failed to load tenants for selection.");
        } finally {
          setLoadingTenants(false);
        }
      };
      fetchTenants();
    } else if (isTenantAdmin && currentUsersTenantId) {
      setValue('tenantId', currentUsersTenantId);
    }
  }, [isSystemAdmin, isTenantAdmin, currentUsersTenantId, setValue]);


  // Fetch Parent Leagues based on selected tenant
  useEffect(() => {
    if (watchTenantId) {
      const fetchParentLeagues = async () => {
        setLoadingParentLeagues(true);
        try {
          const params = new URLSearchParams({
            tenantIds: watchTenantId,
            pageSize: '100',
            parentLeagueId: 'null', // Backend should handle logic for top-level leagues
          });
          const response = await api.get<PaginatedLeaguesResponseDto>(`/leagues?${params.toString()}`);
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
  }, [watchTenantId, initialData?.id]);


  // Fetch Sport Rules TEMPLATE based on effectiveTenantSportType
  useEffect(() => {
    if (effectiveTenantSportType) {
      const fetchRulesTemplate = async () => {
        setLoadingSportRulesTemplate(true);
        try {
          const response = await api.get<SportRulesApiResponse>(`/sport-rules/${effectiveTenantSportType}`);
          setSportRulesTemplate(response.data);

          // For CREATE mode: Pre-populate pointSystemConfig and tieBreakerConfig from template
          if (!isEditMode) {
            const newPointRules: PointRule[] = response.data.pointSystem.rules.map(rule => ({
              outcome: rule.outcome,
              points: rule.points, // Use suggested points
            }));
            const newBonusPointRules: BonusPointRule[] = (response.data.pointSystem.bonusPoints || []).map(rule => ({
              condition: rule.condition || rule.outcome, // Use condition or outcome as default
              points: rule.points,
            }));
            const newTieBreakerRules: TieBreakerRule[] = response.data.tieBreakers.map(breaker => ({
              order: breaker.order,
              rule: breaker.rule,
              description: breaker.description,
              sort: breaker.sort,
            }));

            setValue('pointSystemConfig.rules', newPointRules);
            setValue('pointSystemConfig.bonusPoints', newBonusPointRules);
            setValue('tieBreakerConfig', newTieBreakerRules);
          }
        } catch (error) {
          console.error('Failed to fetch sport rules template:', error);
          toast.error('Failed to load sport-specific rules template.');
          setSportRulesTemplate(null);
        } finally {
          setLoadingSportRulesTemplate(false);
        }
      };
      fetchRulesTemplate();
    } else {
      setSportRulesTemplate(null);
      // Clear existing rules if tenant/sport type is cleared
      if (!isEditMode) {
        setValue('pointSystemConfig.rules', []);
        setValue('pointSystemConfig.bonusPoints', []);
        setValue('tieBreakerConfig', []);
      }
    }
  }, [effectiveTenantSportType, isEditMode, setValue]);

  // Field arrays for dynamic point and tie-breaker rules
  const { fields: pointRulesFields, append: appendPointRule, remove: removePointRule } = useFieldArray({
    control,
    name: "pointSystemConfig.rules",
  });

  const { fields: bonusPointRulesFields, append: appendBonusPointRule, remove: removeBonusPointRule } = useFieldArray({
    control,
    name: "pointSystemConfig.bonusPoints",
  });

  const { fields: tieBreakerRulesFields, append: appendTieBreakerRule, remove: removeTieBreakerRule, move: moveTieBreakerRule } = useFieldArray({
    control,
    name: "tieBreakerConfig",
  });

  const onSubmit = useCallback(async (rawData: LeagueFormValues) => {
    console.log("Submitting form data:", rawData); // Debugging: Log raw data
    if (!userAuth) {
      toast.error("Authentication required.", { description: "Please log in to perform this action." });
      return;
    }

    const sanitizedData = sanitizeEmptyStrings(rawData);
    const payload = {
      ...sanitizedData,
      establishedYear: sanitizedData.establishedYear ? Number(sanitizedData.establishedYear) : undefined,
      tenantId: sanitizedData.tenantId === "" ? null : sanitizedData.tenantId, // Convert empty string to null
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
        const leagueId = initialData.id;
        response = await api.put(`/leagues/${leagueId}`, payload);
        toast.success("League updated successfully!");
      } else {
        response = await api.post('/leagues', payload);
        toast.success("League created successfully!");
        reset();
      }
      onSuccess?.(response.data.id);
    } catch (err: any) {
      console.error("API Error during submission:", err); // Debugging: Log API error
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} league.`;
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} league`, { description: errorMessage });

      // Debugging: Log Zod errors if available
      if (errors && Object.keys(errors).length > 0) {
        console.error("Form validation errors:", errors);
        // Optionally, iterate and show specific errors
        Object.entries(errors).forEach(([field, error]) => {
          if (error && typeof error === 'object' && 'message' in error) {
            toast.error(`Field Error: ${field}`, { description: (error as any).message });
          }
        });
      }
    }
  }, [isEditMode, initialData?.id, onSuccess, reset, userAuth, errors]); // Added 'errors' to dependencies


  const overallLoading = isSubmitting || loadingForm || loadingUsers || loadingTenants || loadingParentLeagues || loadingSportRulesTemplate || userAuth === undefined;

  // Authorization check for rendering the form
  const isAuthorizedToViewForm =
    isSystemAdmin ||
    (isTenantAdmin && currentUsersTenantId !== null) ||
    (isEditMode && initialData && (
      (isTenantAdmin && initialData.tenantId === currentUsersTenantId) ||
      (isLeagueAdmin && initialData.ownerId === userAuth?.id)
    ));


  if (userAuth === undefined) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading authentication state...</p>
      </div>
    );
  }

  if (userAuth === null) {
    toast.error("Authentication required", { description: "Please log in to access league management." });
    if (typeof window !== 'undefined') {
      //window.location.href = '/login';
    }
    return null;
  }

  if (!isAuthorizedToViewForm) {
    toast.error("Unauthorized", { description: "You do not have permission to manage leagues." });
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
    return null;
  }

  if (overallLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditMode ? `Edit League: ${initialData?.name}` : 'Create New League'}
      </h2>

      {isSystemAdmin && (
        <div>
          <Label htmlFor="tenantId" required>Tenant</Label>
          <Select
            value={watch('tenantId') || ''}
            onValueChange={(value) => setValue('tenantId', value, { shouldValidate: true })}
            disabled={isSubmitting || isEditMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {availableTenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.tenantCode}) - {tenant.sportType.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tenantId && <p className="text-red-500 text-xs mt-1">{errors.tenantId.message}</p>}
        </div>
      )}

      {(isTenantAdmin || isLeagueAdmin) && currentUsersTenantId && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
          <p>This league will be associated with tenant:</p>
          <p className="font-semibold">
            {initialData?.tenant?.name || availableTenants.find(t => t.id === currentUsersTenantId)?.name || currentUsersTenantId}
          </p>
          <p className="text-sm">Sport Type: <span className="font-semibold">{effectiveTenantSportType?.replace(/_/g, ' ')}</span></p>
          <input type="hidden" {...register('tenantId')} value={currentUsersTenantId} />
        </div>
      )}

      {/* Display the inferred Sport Type */}
      <div className="mt-4">
        <Label htmlFor='sportType'>Sport Type (Inherited from Tenant)</Label>
        <Input
          value={effectiveTenantSportType ? effectiveTenantSportType.replace(/_/g, ' ') : 'Select Tenant'}
          disabled
          className="bg-gray-100 cursor-not-allowed"
          id='sportType'
        />
      </div>

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
          disabled={isSubmitting || isEditMode}
        />
        {errors.leagueCode && <p className="text-red-500 text-xs mt-1">{errors.leagueCode.message}</p>}
        <p className="text-gray-500 text-xs mt-1">A unique short code for the league.</p>
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
              setValue('region', undefined, { shouldValidate: true });
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
              disabled={isSubmitting || !watchTenantId}
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
        <Label htmlFor="ownerId">
                        Owner ({isEditMode && initialData?.owner?.username && 
                          <span>{initialData?.owner?.firstName} - {initialData?.owner?.lastName}</span>})
        </Label>
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

      {/* Points System Configuration - Dynamic and Editable */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">
          Point System Configuration for {effectiveTenantSportType ? effectiveTenantSportType.replace(/_/g, ' ') : 'Selected Sport'}
        </h3>
        {loadingSportRulesTemplate ? (
          <p className="text-gray-500">Loading sport-specific rule templates...</p>
        ) : sportRulesTemplate ? (
          <div className="space-y-4">
            <h4 className="text-md font-medium">Basic Rules</h4>
            <p className="text-gray-600 text-sm mb-2">Set points for standard outcomes. Only predefined outcomes from the sport template are allowed.</p>
            {pointRulesFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 mb-2">
                <div className="flex-grow">
                  <Label htmlFor={`rules-${index}-outcome`}>Outcome</Label>
                  <Select
                    value={watch(`pointSystemConfig.rules.${index}.outcome`)}
                    onValueChange={(value: string) => setValue(`pointSystemConfig.rules.${index}.outcome`, value, { shouldValidate: true })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportRulesTemplate.pointSystem.rules.map(rule => (
                        <SelectItem key={rule.outcome} value={rule.outcome}>
                          {rule.outcome.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    disabled={isSubmitting}
                  />
                  {errors.pointSystemConfig?.rules?.[index]?.points && (
                    <p className="text-red-500 text-xs mt-1">{errors.pointSystemConfig.rules[index]?.points?.message}</p>
                  )}
                </div>
                <Button type="button" variant="danger" onClick={() => removePointRule(index)} disabled={isSubmitting}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendPointRule({ outcome: '', points: 0 })}
              className="mt-2"
              disabled={isSubmitting}
            >
              Add Point Rule
            </Button>

            <h4 className="text-md font-medium mt-6 mb-2">Bonus Points (Optional)</h4>
            <p className="text-gray-600 text-sm mb-2">Define custom bonus point conditions and their values.</p>
            {bonusPointRulesFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 mb-2">
                <div className="flex-grow">
                  <Label htmlFor={`bonus-${index}-condition`}>Condition</Label>
                  <Input
                    id={`bonus-${index}-condition`}
                    placeholder="e.g., CLEAN_SHEET"
                    {...register(`pointSystemConfig.bonusPoints.${index}.condition`)}
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  {errors.pointSystemConfig?.bonusPoints?.[index]?.points && (
                    <p className="text-red-500 text-xs mt-1">{errors.pointSystemConfig.bonusPoints[index]?.points?.message}</p>
                  )}
                </div>
                <Button type="button" variant="danger" onClick={() => removeBonusPointRule(index)} disabled={isSubmitting}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendBonusPointRule({ condition: '', points: 0 })}
              className="mt-2"
              disabled={isSubmitting}
            >
              Add Bonus Point Rule
            </Button>

            {sportRulesTemplate.pointSystem.commonMetrics && Object.keys(sportRulesTemplate.pointSystem.commonMetrics).length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium">Common Metrics for Display</h4>
                <ul className="list-disc list-inside text-gray-700">
                  {Object.entries(sportRulesTemplate.pointSystem.commonMetrics).map(([key, value]) => (
                    <li key={key}>{value}</li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500 mt-1">These are standard metrics for {effectiveTenantSportType?.replace(/_/g, ' ')} standings.</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No sport rules template loaded. Please select a tenant with a defined sport type.</p>
        )}
      </div>

      {/* Tiebreakers Configuration - Dynamic and Sortable */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Tiebreaker Configuration</h3>
        <p className="text-gray-600 text-sm mb-4">Ordered list of rules to break ties in standings. Drag to reorder (not implemented yet, but order matters).</p>
        {loadingSportRulesTemplate ? (
          <p className="text-gray-500">Loading sport-specific rule templates...</p>
        ) : sportRulesTemplate ? (
          <div>
            {tieBreakerRulesFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 mb-2">
                <div className="w-16">
                  <Label htmlFor={`tiebreaker-${index}-order`}>Order</Label>
                  <Input
                    id={`tiebreaker-${index}-order`}
                    type="number"
                    value={index + 1}
                    disabled
                    className=""
                  />
                </div>
                <div className="flex-grow">
                  <Label htmlFor={`tiebreaker-${index}-rule`}>Rule</Label>
                  <Select
                    value={watch(`tieBreakerConfig.${index}.rule`)}
                    onValueChange={(value: string) => setValue(`tieBreakerConfig.${index}.rule`, value, { shouldValidate: true })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Rule" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportRulesTemplate.tieBreakers.map(breaker => (
                        <SelectItem key={breaker.rule} value={breaker.rule}>
                          {breaker.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tieBreakerConfig?.[index]?.rule && (
                    <p className="text-red-500 text-xs mt-1">{errors.tieBreakerConfig[index]?.rule?.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`tiebreaker-${index}-sort`}>Sort Order</Label>
                  <Select
                    value={watch(`tieBreakerConfig.${index}.sort`)}
                    onValueChange={(val: 'ASC' | 'DESC' | 'RANDOM') => setValue(`tieBreakerConfig.${index}.sort`, val, { shouldValidate: true })}
                    disabled={isSubmitting}
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
                <Button type="button" variant="danger" onClick={() => removeTieBreakerRule(index)} disabled={isSubmitting}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendTieBreakerRule({ order: tieBreakerRulesFields.length + 1, rule: '', description: '', sort: 'DESC' })}
              className="mt-2"
              disabled={isSubmitting}
            >
              Add Tiebreaker Rule
            </Button>
          </div>
        ) : (
          <p className="text-gray-600">No tie-breaker rules template loaded. Please select a tenant with a defined sport type.</p>
        )}
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
