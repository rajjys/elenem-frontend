// components/forms/league-form.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextArea } from '../ui';
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
  TenantBasicDto,
  PaginatedLeaguesResponseDto
} from '@/schemas';
import { api } from '@/services/api';
import { countryCodeToName, countryNameToCode, sanitizeEmptyStrings } from '@/utils/';
import { useAuthStore } from '@/store/auth.store';
import { XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// DTO for the Sport Rules API response (matching backend)
interface SportRulesApiResponse {
  sportType: SportType;
  pointSystem: {
    rules: { outcome: string; points: number; condition?: string }[];
    bonusPoints?: { outcome: string; points: number; condition?: string }[];
    commonMetrics?: Record<string, string>;
  };
  tieBreakers: { order: number; rule: string; description: string; sort: 'asc' | 'desc' | 'random' }[];
}

type LeagueFormValues = z.infer<typeof CreateLeagueSchema>;

interface LeagueFormProps {
  initialData?: LeagueDetails;
  isEditMode?: boolean;
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
  
  const formSchema = isEditMode ? UpdateLeagueSchema : CreateLeagueSchema;

  const form = useForm<LeagueFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => {
        const defaultPointsConfig = initialData?.pointSystemConfig || { rules: [], bonusPoints: [] };
        const defaultTieBreakerConfig = initialData?.tieBreakerConfig || [];
        return {
            name: initialData?.name || '',
            description: initialData?.description ?? undefined,
            leagueCode: initialData?.leagueCode || '',
            visibility: initialData?.visibility || LeagueVisibility.PUBLIC,
            gender: initialData?.gender || Gender.MALE,
            country: initialData?.country ? 
                     countryCodeToName[initialData.country] || initialData.country : '',
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
        };
    }, [initialData, isTenantAdmin, currentUsersTenantId]),
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control,
  } = form;

  // --- State for UI and Data ---
  const [loading, setLoading] = useState(true);
  const [availableOwners, setAvailableOwners] = useState<UserResponseDto[]>([]);
  const [availableTenants, setAvailableTenants] = useState<TenantBasicDto[]>([]);
  const [availableParentLeagues, setAvailableParentLeagues] = useState<{ id: string; name: string }[]>([]);
  const [sportRulesTemplate, setSportRulesTemplate] = useState<SportRulesApiResponse | null>(null);

  const [nextPointRule, setNextPointRule] = useState('');
  const [nextBonusRule, setNextBonusRule] = useState({ condition: '', points: 1 });
  const [nextTiebreaker, setNextTiebreaker] = useState('');

  const watchTenantId = watch('tenantId');
  const watchPointSystemRules = watch('pointSystemConfig.rules');
  const watchTieBreakerConfig = watch('tieBreakerConfig');

  const { fields: pointRulesFields, append: appendPointRule, remove: removePointRule } = useFieldArray({
    control, name: "pointSystemConfig.rules",
  });
  const { fields: bonusPointRulesFields, append: appendBonusPointRule, remove: removeBonusPointRule } = useFieldArray({
    control, name: "pointSystemConfig.bonusPoints",
  });
  const { fields: tieBreakerRulesFields, append: appendTieBreakerRule, remove: removeTieBreakerRule } = useFieldArray({
    control, name: "tieBreakerConfig",
  });

  useEffect(() => {
    const loadInitialData = async () => {
        setLoading(true);
        if (isSystemAdmin) {
            try {
                const tenantsRes = await api.get('/tenants?pageSize=100');
                setAvailableTenants(tenantsRes.data.data);
            } catch {
                toast.error("Failed to load tenants.");
            }
        }
        if (isEditMode && initialData) {
            reset(form.getValues());
        }
        setLoading(false);
    };
    loadInitialData();
  }, [isSystemAdmin, isEditMode, initialData, reset, form]);

  useEffect(() => {
    const tenantId = watchTenantId;
    if (!tenantId) {
        setAvailableOwners([]);
        setAvailableParentLeagues([]);
        setSportRulesTemplate(null);
        return;
    }

    const fetchDependencies = async () => {
        try {
            const [usersRes, leaguesRes] = await Promise.all([
                api.get('/users', { params: { tenantId, roles: Role.GENERAL_USER, pageSize: 100 } }),
                api.get('/leagues', { params: { tenantId, pageSize: 100 } })
            ]);
            setAvailableOwners(usersRes.data.data);
            setAvailableParentLeagues(leaguesRes.data.data.filter((l: LeagueDetails) => l.id !== initialData?.id));
            
            const tenant = availableTenants.find(t => t.id === tenantId) || userAuth?.tenant;
            if (tenant?.sportType) {
                const rulesRes = await api.get<SportRulesApiResponse>(`/sport-rules/${tenant.sportType}`);
                setSportRulesTemplate(rulesRes.data);
            }
        } catch {
            toast.error("Failed to load league dependencies.");
        }
    };
    fetchDependencies();
  }, [watchTenantId, isEditMode, initialData?.id, availableTenants, userAuth?.tenant]);

  const usedPointRuleOutcomes = useMemo(() => 
    new Set(watchPointSystemRules?.map(rule => rule.outcome)), 
    [watchPointSystemRules]
  );

  const availablePointRules = useMemo(() => 
    sportRulesTemplate?.pointSystem.rules.filter(rule => !usedPointRuleOutcomes.has(rule.outcome)) || [],
    [sportRulesTemplate, usedPointRuleOutcomes]
  );

  const usedTiebreakerRules = useMemo(() => 
    new Set(watchTieBreakerConfig?.map(rule => rule.rule)),
    [watchTieBreakerConfig]
  );

  const availableTiebreakers = useMemo(() =>
    sportRulesTemplate?.tieBreakers.filter(tb => !usedTiebreakerRules.has(tb.rule)) || [],
    [sportRulesTemplate, usedTiebreakerRules]
  );

  const handleAddPointRule = () => {
    if (!nextPointRule) {
      toast.warning("Please select an outcome to add.");
      return;
    }
    const ruleTemplate = sportRulesTemplate?.pointSystem.rules.find(r => r.outcome === nextPointRule);
    if (ruleTemplate) {
      appendPointRule({
        outcome: ruleTemplate.outcome,
        points: ruleTemplate.points,
      });
      setNextPointRule('');
    }
  };

  const handleAddBonusPointRule = () => {
      if (!nextBonusRule.condition.trim()) {
          toast.warning("Please enter a condition for the bonus point.");
          return;
      }
      appendBonusPointRule({
          condition: nextBonusRule.condition.trim(),
          points: nextBonusRule.points,
      });
      setNextBonusRule({ condition: '', points: 1 });
  };

  const handleAddTiebreakerRule = () => {
    if (!nextTiebreaker) {
      toast.warning("Please select a tiebreaker rule to add.");
      return;
    }
    const tiebreakerTemplate = sportRulesTemplate?.tieBreakers.find(tb => tb.rule === nextTiebreaker);
    if (tiebreakerTemplate) {
      appendTieBreakerRule({
        order: (watchTieBreakerConfig?.length || 0) + 1,
        rule: tiebreakerTemplate.rule,
        description: tiebreakerTemplate.description,
        sort: tiebreakerTemplate.sort,
      });
      setNextTiebreaker('');
    }
  };

  const onSubmit = async (data: LeagueFormValues) => {
    console.log("Subbmitting: ", data);
    try {
      const countryCode = countryNameToCode[data.country] || data.country;
      const establishedYear = data?.establishedYear ? Number(data.establishedYear) : undefined;
      const payload = sanitizeEmptyStrings({ ...data, establishedYear, country: countryCode });
      let response;
      if (isEditMode && initialData?.id) {
        response = await api.put(`/leagues/${initialData.id}`, payload);
        toast.success("League updated successfully!");
      } else {
        response = await api.post('/leagues', payload);
        toast.success("League created successfully!");
      }
      onSuccess?.(response.data.id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} league.`;
      toast.error("Error", { description: errorMessage });
    }
  };

  if (loading) return <p>Loading form...</p>;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold text-gray-800 pb-4">
        {isEditMode ? `Edit League: ${initialData?.name}` : 'Create New League'}
      </h2>
      
      {/* --- Basic Info Section --- */}
      <div className="space-y-4 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        {isSystemAdmin && (
            <div>
                <Label htmlFor="tenantId">Tenant</Label>
                <Controller name="tenantId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || isEditMode}>
                        <SelectTrigger><SelectValue placeholder="Select a Tenant" /></SelectTrigger>
                        <SelectContent>{availableTenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
                {errors.tenantId && <p className="text-red-500 text-xs mt-1">{errors.tenantId.message as string}</p>}
            </div>
        )}

        <div>
          <Label htmlFor="name">League Name</Label>
          <Input id="name" {...control.register('name')} disabled={isSubmitting} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="leagueCode">League Code</Label>
          <Input id="leagueCode" {...control.register('leagueCode')} disabled={isSubmitting || isEditMode} />
          {errors.leagueCode && <p className="text-red-500 text-xs mt-1">{errors.leagueCode.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Controller name="description" control={control} render={({ field }) => (
            <TextArea id="description" {...field} value={field.value ?? ''} disabled={isSubmitting} />
          )} />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message as string}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Controller name="visibility" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select Visibility" /></SelectTrigger>
                        <SelectContent>{Object.values(LeagueVisibility).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
                {errors.visibility && <p className="text-red-500 text-xs mt-1">{errors.visibility.message as string}</p>}
            </div>
            <div>
                <Label htmlFor="gender">Gender</Label>
                <Controller name="gender" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>{Object.values(Gender).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message as string}</p>}
            </div>
        </div>
        
        <div className="flex items-center space-x-2">
            <Controller name="isActive" control={control} render={({ field }) => (
                <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
            )} />
            <Label htmlFor="isActive">Active League</Label>
        </div>
      </div>

      {/* --- Location & Details Section --- */}
      <div className="space-y-4 border m-2 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Location & Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="country">Country</Label>
                  <Controller name="country" control={control} render={({ field }) => (
                      <CountryDropdown
                        value={field.value || ''}
                        onChange={field.onChange} // Pass the country name directly
                        className="w-full p-2 border m-2 rounded-md"
                      />)} />
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message as string}</p>}
              </div>
              <div>
                  <Label htmlFor="region">Region/State</Label>
                  <Controller name="region" control={control} render={({ field }) => (
                      <RegionDropdown country={watch('country') || ''} value={field.value || ''} onChange={val => field.onChange(val)} className="w-full p-2 border rounded-md"/>
                  )} />
                  {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message as string}</p>}
              </div>
              <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...control.register('city')} disabled={isSubmitting} />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message as string}</p>}
              </div>
              <div>
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input id="establishedYear" type="number" min="1800"
                         max={new Date().getFullYear()}placeholder="e.g., 2005" 
                         {...control.register('establishedYear', { valueAsNumber: true })} 
                          disabled={isSubmitting} />
                  {errors.establishedYear && <p className="text-red-500 text-xs mt-1">{errors.establishedYear.message as string}</p>}
              </div>
          </div>
      </div>

      {/* --- Hierarchy & Administration Section --- */}
      <div className="space-y-4 border m-2 p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Hierarchy & Administration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="parentLeagueId">Parent League</Label>
                <Controller name="parentLeagueId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isSubmitting || !watchTenantId}>
                        <SelectTrigger><SelectValue placeholder="Select Parent League (Optional)" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">None (Top Level)</SelectItem>
                            {availableParentLeagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )} />
                {errors.parentLeagueId && <p className="text-red-500 text-xs mt-1">{errors.parentLeagueId.message as string}</p>}
            </div>
            <div>
                <Label htmlFor="division">Division</Label>
                <Input id="division" {...control.register('division')} disabled={isSubmitting} />
                {errors.division && <p className="text-red-500 text-xs mt-1">{errors.division.message as string}</p>}
            </div>
        </div>
        <div>
            <Label htmlFor="ownerId">League Owner</Label>
            <Controller name="ownerId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isSubmitting || !watchTenantId}>
                    <SelectTrigger><SelectValue placeholder="Select an Owner (Optional)" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        {availableOwners.map(o => <SelectItem key={o.id} value={o.id}>{o.firstName} {o.lastName} ({o.email})</SelectItem>)}
                    </SelectContent>
                </Select>
            )} />
            {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId.message as string}</p>}
        </div>
      </div>

      {/* --- Media Section --- */}
      <div className="space-y-4 border m-2 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" type="url" {...control.register('logoUrl')} disabled={isSubmitting} />
                  {errors.logoUrl && <p className="text-red-500 text-xs mt-1">{errors.logoUrl.message as string}</p>}
              </div>
              <div>
                  <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
                  <Input id="bannerImageUrl" type="url" {...control.register('bannerImageUrl')} disabled={isSubmitting} />
                  {errors.bannerImageUrl && <p className="text-red-500 text-xs mt-1">{errors.bannerImageUrl.message as string}</p>}
              </div>
          </div>
      </div>
      {/* --- Point System Configuration --- */}
      <div className="border p-4 m-2 rounded-lg bg-gray-50 space-y-4">
        <h3 className="text-lg font-semibold">Point System</h3>
        {!sportRulesTemplate ? <p className="text-sm text-gray-500">Select a tenant to load sport-specific rules.</p> : (
          <>
            <div>
              <h4 className="font-medium">Basic Rules</h4>
              {pointRulesFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mt-2 p-2 border m-2 rounded-md bg-white">
                  <span className="font-mono text-sm text-gray-600 flex-grow">{field.outcome.replace(/_/g, ' ')}</span>
                  <Controller name={`pointSystemConfig.rules.${index}.points`} control={control} render={({ field: numField }) => (
                      <Input type="number" {...numField} className="w-24" />
                  )} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePointRule(index)}><XIcon className="h-4 w-4" /></Button>
                </div>
              ))}
              {availablePointRules.length > 0 && (
                <div className="flex items-end gap-2 mt-4 pt-4 border-t">
                  <div className="flex-grow">
                    <Label>Add New Outcome</Label>
                    <Select value={nextPointRule} onValueChange={setNextPointRule}>
                        <SelectTrigger><SelectValue placeholder="Select an outcome..." /></SelectTrigger>
                        <SelectContent>
                            {availablePointRules.map(rule => <SelectItem key={rule.outcome} value={rule.outcome}>{rule.outcome.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleAddPointRule}>Add Rule</Button>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mt-4">Bonus Points</h4>
                {bonusPointRulesFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 mt-2 p-2 border m-2 rounded-md bg-white">
                        <span className="font-mono text-sm text-gray-600 flex-grow">{field.condition}</span>
                        <Controller name={`pointSystemConfig.bonusPoints.${index}.points`} control={control} render={({ field: numField }) => (
                            <Input type="number" {...numField} className="w-24" />
                        )} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeBonusPointRule(index)}><XIcon className="h-4 w-4" /></Button>
                    </div>
                ))}
                <div className="flex items-end gap-2 mt-4 pt-4 border-t">
                    <div className="flex-grow">
                        <Label>New Bonus Condition</Label>
                        <Input placeholder="e.g., Scored 3+ goals" value={nextBonusRule.condition} onChange={e => setNextBonusRule(prev => ({...prev, condition: e.target.value}))} />
                    </div>
                    <div className="w-24">
                        <Label>Points</Label>
                        <Input type="number" value={nextBonusRule.points} onChange={e => setNextBonusRule(prev => ({...prev, points: Number(e.target.value)}))} />
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddBonusPointRule}>Add Bonus</Button>
                </div>
            </div>
          </>
        )}
      </div>

      {/* --- Tiebreakers Configuration --- */}
      <div className="border p-4 m-2 rounded-lg bg-gray-50 space-y-4">
        <h3 className="text-lg font-semibold">Tiebreaker Configuration</h3>
        {!sportRulesTemplate ? <p className="text-sm text-gray-500">Select a tenant to load sport-specific rules.</p> : (
            <>
                {tieBreakerRulesFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md bg-white">
                        <span className="font-bold text-gray-500">{index + 1}.</span>
                        <span className="font-mono text-sm text-gray-600 flex-grow">{field.description}</span>
                        <Badge variant="success">{field.sort}</Badge>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeTieBreakerRule(index)}><XIcon className="h-4 w-4" /></Button>
                    </div>
                ))}
                {availableTiebreakers.length > 0 && (
                    <div className="flex items-end gap-2 mt-4 pt-4 border-t">
                        <div className="flex-grow">
                            <Label>Add New Tiebreaker</Label>
                            <Select value={nextTiebreaker} onValueChange={setNextTiebreaker}>
                                <SelectTrigger><SelectValue placeholder="Select a tiebreaker rule..." /></SelectTrigger>
                                <SelectContent>
                                    {availableTiebreakers.map(tb => <SelectItem key={tb.rule} value={tb.rule}>{tb.description}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddTiebreakerRule}>Add Tiebreaker</Button>
                    </div>
                )}
            </>
        )}
      </div>
      <div className="flex justify-end space-x-4 pt-4 m-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
        <Button type="submit" disabled={isSubmitting || loading}>
          {isSubmitting ? 'Saving...' : (isEditMode ? 'Update League' : 'Create League')}
        </Button>
      </div>
    </form>
  );
}
