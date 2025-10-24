// components/forms/season-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { LeagueDetails, Roles, SeasonDetails, TenantDetails } from "@/schemas";
import { CreateSeasonSchema, SeasonStatus, CreateSeasonDto } from "@/schemas/";
import axios from "axios";
import { Button, Input, Label, TextArea } from "../ui";
import { capitalizeFirst } from "@/utils";

interface SeasonFormProps {
  onSuccess: (season: SeasonDetails) => void;
  onCancel: () => void;
  currentTenantId?: string | null;
  currentTenantName?: string | null;
  currentLeagueId?: string | null;
  currentLeagueName?: string | null;
}

export function SeasonForm({ onSuccess, onCancel, currentLeagueId, currentTenantId, currentTenantName, currentLeagueName }: SeasonFormProps) {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];

  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [tenants, setTenants] = useState<TenantDetails[]>([]);
  const [leagues, setLeagues] = useState<LeagueDetails[]>([]);

  const today = new Date().toISOString().split("T")[0]; // "2025-08-29";
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  
  // A local state to track the selected tenant ID, independent of form state
  // This is the source of truth for fetching leagues
  const [selectedTenantId, setSelectedTenantId] = useState(
    currentTenantId ||
    ((isTenantAdmin || isLeagueAdmin) ? userAuth?.tenantId : "") ||
    ""
  );

  const form = useForm<CreateSeasonDto>({
    resolver: zodResolver(CreateSeasonSchema),
    defaultValues: {
      name: "",
      startDate: today,
      endDate: tomorrow,
      description: "",
      isActive: true,
      status: SeasonStatus.ACTIVE,
      // leagueId is the only ID field submitted
      leagueId: currentLeagueId ? currentLeagueId : 
        isLeagueAdmin && userAuth?.managingLeagueId ? userAuth.managingLeagueId : ""
    },
  });

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const watchedLeagueId = watch("leagueId"); // Only watch leagueId as tenantId is gone from the form/payload

  // --- FIX 1: Tenant Fetching Logic (Only for SystemAdmin when no fixed context) ---
  useEffect(() => {
    const fetchTenants = async () => {
      // Only System Admins need to fetch the list of *all* tenants 
      // AND only if we are not in a fixed tenant/league context.
      if (isSystemAdmin && !currentTenantId && !currentLeagueId) {
        try {
          const res = await api.get("/tenants", { params: { take: 100 } });
          setTenants(res.data.data);
          // If a SystemAdmin has a default (empty string) for selectedTenantId, 
          // but there are tenants, ensure to set loading to false.
        } catch (error) {
          let errorMessage = "Failed to fetch organisations.";
          if (axios.isAxiosError(error)) {
              errorMessage = error.response?.data?.message || errorMessage;
          }
          toast.error(errorMessage);
        }
      }
      setLoadingData(false);
    };
    fetchTenants();
  }, [currentTenantId, currentLeagueId, isSystemAdmin]);

  // --- FIX 2: League Fetching Logic (Based on selectedTenantId) ---
  useEffect(() => {
    const fetchLeagues = async () => {
      // 1. Need a tenant ID to fetch leagues.
      // 2. Do NOT fetch if a league is already fixed in context.
      if (!selectedTenantId || currentLeagueId) {
        setLeagues([]);
        return;
      }
      try {
        // Fetch leagues based on the currently selected tenant
        const res = await api.get("/leagues", {
          params: { tenantId: selectedTenantId, take: 100 },
        });
        setLeagues(res.data.data);
        // Clear leagueId if the previous one is no longer available
        if (!res.data.data.find((l: LeagueDetails) => l.id === watchedLeagueId)) {
           setValue("leagueId", "");
        }
      } catch (error) {
        let errorMessage = "Failed to fetch leagues.";
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage);
      }
    };
    fetchLeagues();
  }, [currentLeagueId, selectedTenantId, setValue, watchedLeagueId]);

  // Auto-set LeagueId for LeagueAdmin and prioritize context props
  useEffect(() => {
    // Context League ID takes highest priority
    if (currentLeagueId) {
        setValue("leagueId", currentLeagueId);
        return;
    }
    // League Admin league ID is next
    if (isLeagueAdmin && userAuth?.managingLeagueId) {
      setValue("leagueId", userAuth.managingLeagueId);
    }
    // No need to set tenantId on the form anymore, only in local state (selectedTenantId)
  }, [isLeagueAdmin, userAuth, setValue, currentLeagueId]);


  const onSubmit = async (data: CreateSeasonDto) => {
    setIsSubmitting(true);
    try {
      // Removed tenantId from the payload.
      const payload = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        isActive: data.isActive,
        status: data.status,
        leagueId: data.leagueId, // Backend will derive tenantId from this
      };

      const res = await api.post<SeasonDetails>("/seasons", payload);
      toast.success("Season created successfully!");
      onSuccess(res.data);
    } catch (error) {
      let errorMessage = "Failed to create season.";
      if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine what name to display for the fixed tenant
  const displayTenantName = currentTenantName || (
    (isTenantAdmin || isLeagueAdmin) && (userAuth)?.tenant?.name
  ) || null;
  
  // Determine what name to display for the fixed league
  const displayLeagueName = currentLeagueName || (
    isLeagueAdmin && userAuth?.managingLeague?.name
  ) || null;


  return (
    <div className="p-4 bg-white max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {loadingData && (isSystemAdmin || isTenantAdmin) && !currentLeagueId && (
          <p className="text-center text-gray-500">
            Loading available organisations and leagues...
          </p>
        )}
        
        {/* --- Tenant Context Display / Selection --- */}
        <div>
          {/* Display fixed Tenant Name if context is present and no selection is needed */}
          {(displayTenantName && (currentTenantId || isTenantAdmin || isLeagueAdmin) && !isSystemAdmin) && (
             <p className="font-semibold text-lg text-slate-600 py-1 border-b border-slate-300">
                {displayTenantName}
             </p>
          )}

          {/* Tenant Select for SystemAdmin ONLY when no fixed context is set */}
          {isSystemAdmin && !currentTenantId && !currentLeagueId ? (
            <div>
              <Label htmlFor="tenantId">Organisation</Label>
              <Controller
                name="tenantId" // Field is still needed for Zod/validation, but won't be submitted
                control={control}
                render={() => (
                  <Select
                    onValueChange={(val) => {
                      // Update local state and clear league
                      setSelectedTenantId(val); 
                      setValue("leagueId", "");
                    }}
                    value={selectedTenantId}
                    disabled={isSubmitting || loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {/* Note: Errors.tenantId will still show up if validation fails, but it's not registered to an input */}
              {errors.tenantId && (
                <p className="text-red-500 text-sm">{errors.tenantId.message}</p>
              )}
            </div>
          ) : null}
        </div>
        
        {/* --- League Context Display / Selection --- */}
        <div>
          {/* Display fixed League Name if context is present */}
          {(displayLeagueName && currentLeagueId) && (
              <p className="font-semibold text-base text-slate-600 py-1 border-b border-slate-300">
                  League: {displayLeagueName}
              </p>
          )}

          {/* League Select for System/Tenant Admin when league context is NOT fixed */}
          {(!currentLeagueId && (isSystemAdmin || isTenantAdmin)) ? (
            <div>
              <Label htmlFor="leagueId" hidden>Ligue</Label>
              <Controller
                name="leagueId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    // Disable if submitting, loading, or no tenant is selected/fixed
                    disabled={isSubmitting || loadingData || !selectedTenantId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a league" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagues.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.leagueId && (
                <p className="text-red-500 text-sm">{errors.leagueId.message}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* --- Season Details --- */}

        {/* Season Name */}
        <div>
          <Label htmlFor="name" hidden>Nom</Label>
          <Input id="name" type="text" placeholder="Nom de la saison" {...register("name")} disabled={isSubmitting} />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        
        <div  className="flex items-center justify-between">
          {/* Start Date */}
          <div className="grow mr-2">
            <Label htmlFor="startDate">Date de debut</Label>
            <Input id="startDate" type="date" {...register("startDate")} disabled={isSubmitting} />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate.message}</p>
            )}
          </div>

          {/* End Date */}
          <div className="grow ml-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <Input id="endDate" type="date" {...register("endDate")} disabled={isSubmitting} />
            {errors.endDate && (
              <p className="text-red-500 text-sm">{errors.endDate.message}</p>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div>
          <Label htmlFor="description" hidden>Description (Optionelle)</Label>
          <TextArea id="description" placeholder="Description" {...register("description")} rows={3} disabled={isSubmitting} />
        </div>
        
        {/* Status */}
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
                      {capitalizeFirst(status.replace(/_/g, " "))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-between space-x-4">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || (isSystemAdmin && !selectedTenantId)}>
            {isSubmitting ? "Creating..." : "Create Season"}
          </Button>
        </div>
      </form>
    </div>
  );
}