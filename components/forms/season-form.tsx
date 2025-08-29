// components/forms/season-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TextArea } from "../ui"; // Assuming you have a TextArea component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { LeagueBasic, Roles, SeasonDetails, TenantBasic } from "@/schemas";
import { CreateSeasonSchema, SeasonStatus, CreateSeasonDto } from "@/schemas/";
import axios from "axios";
import Link from "next/link";

interface SeasonFormProps {
  onSuccess: (season: SeasonDetails) => void;
  onCancel: () => void;
  dashboardLink: string;
  seasonsPageLink: string;
}

export function SeasonForm({ onSuccess, onCancel, dashboardLink, seasonsPageLink}: SeasonFormProps) {
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];

  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [tenants, setTenants] = useState<TenantBasic[]>([]);
  const [leagues, setLeagues] = useState<LeagueBasic[]>([]);

  const today = new Date().toISOString().split("T")[0]; // "2025-08-29";
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const form = useForm<CreateSeasonDto>({
    resolver: zodResolver(CreateSeasonSchema),
    defaultValues: {
      name: "",
      startDate: today,
      endDate: tomorrow,
      description: "",
      isActive: true,
      status: SeasonStatus.ACTIVE,
      tenantId:
        (isTenantAdmin && userAuth?.tenantId) ||
        (isLeagueAdmin && userAuth?.tenantId) ||
        "",
      leagueId: (isLeagueAdmin && userAuth?.managingLeagueId) || "",
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

  const watchedTenantId = watch("tenantId");

  // Fetch tenants for SystemAdmin
  useEffect(() => {
    const fetchTenants = async () => {
      if (isSystemAdmin) {
        try {
          const res = await api.get("/tenants", { params: { take: 100 } });
          setTenants(res.data.data);
        } catch (error) {
          let errorMessage = "Failed to fetch tenants.";
          if (axios.isAxiosError(error)) {
              errorMessage = error.response?.data?.message || errorMessage;
          }
          //setError(errorMessage);
          toast.error(errorMessage);
        }
      }
      setLoadingData(false);
    };
    fetchTenants();
  }, [isSystemAdmin]);

  // Fetch leagues when tenant changes
  useEffect(() => {
    const fetchLeagues = async () => {
      if (!watchedTenantId) {
        setLeagues([]);
        return;
      }
      try {
        const res = await api.get("/leagues", {
          params: { tenantIds: watchedTenantId, take: 100 },
        });
        setLeagues(res.data.data);
      } catch (error) {
        let errorMessage = "Failed to fetch leagues.";
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || errorMessage;
        }
        //setError(errorMessage);
        toast.error(errorMessage);
      }
    };
    fetchLeagues();
  }, [watchedTenantId]);

  // Auto-set tenant/league for tenant/league admins
  useEffect(() => {
    if (isTenantAdmin && userAuth?.tenantId) {
      setValue("tenantId", userAuth.tenantId);
    }
    if (isLeagueAdmin && userAuth?.tenantId && userAuth?.managingLeagueId) {
      setValue("tenantId", userAuth.tenantId);
      setValue("leagueId", userAuth.managingLeagueId);
    }
  }, [isTenantAdmin, isLeagueAdmin, userAuth, setValue]);

  const onSubmit = async (data: CreateSeasonDto) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        startDate: data.startDate,
        endDate: data.endDate,
      };
      const res = await api.post<SeasonDetails>("/seasons", payload);
      onSuccess(res.data);
    } catch (error) {
      let errorMessage = "Failed to fetch Seasons.";
      if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
      }
      //setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Season</h1>
      {/* Back to Dashboard */}
      <div className="pb-6 flex justify-between border-b border-blue-100">
        <Link href={dashboardLink} 
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 
                    bg-transparent border border-transparent rounded-md shadow-sm hover:bg-blue-50 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-300 cursor-pointer">
           ← Back to Dashboard
        </Link>
        <Link href={seasonsPageLink} 
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 
                   bg-transparent border border-transparent rounded-md shadow-sm hover:bg-blue-50 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-300 cursor-pointer">
           ← Back to Seasons
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {loadingData && (isSystemAdmin || isTenantAdmin) && (
          <p className="text-center text-gray-500">
            Loading available tenants and leagues...
          </p>
        )}
        {/* Active toggle */}
        <div className="flex items-center space-x-2 pt-6 md:pt-10">
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
          <Label htmlFor="isActive px-2" >Is Active</Label>
        </div>
        {/* Tenant select for SystemAdmin */}
        {isSystemAdmin && (
          <div>
            <Label htmlFor="tenantId">Tenant</Label>
            <Controller
              name="tenantId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue("leagueId", "");
                  }}
                  value={field.value}
                  disabled={isSubmitting || loadingData}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tenant" />
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
            {errors.tenantId && (
              <p className="text-red-500 text-sm">{errors.tenantId.message}</p>
            )}
          </div>
        )}

        {/* League select */}
        {(isSystemAdmin || isTenantAdmin) && (
          <div>
            <Label htmlFor="leagueId" hidden>League</Label>
            <Controller
              name="leagueId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting || loadingData || !watchedTenantId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select league" />
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
        )}

        {/* Auto League ID for LeagueAdmin */}
        {isLeagueAdmin && userAuth?.managingLeagueId && (
          <div>
            <Label htmlFor="leagueId">League (Auto-assigned)</Label>
            <Input
              id="leagueId"
              type="text"
              value={userAuth.managingLeagueId}
              disabled
              className="bg-gray-100"
            />
          </div>
        )}

        {/* Season Name */}
        <div>
          <Label htmlFor="name" hidden>Season Name</Label>
          <Input id="name" type="text" placeholder="Season Name" {...register("name")} disabled={isSubmitting} />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        <div  className="flex items-center justify-between">
          {/* Start Date */}
          <div className="grow mr-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" {...register("startDate")} disabled={isSubmitting} />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate.message}</p>
            )}
          </div>

          {/* End Date */}
          <div className="grow ml-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" {...register("endDate")} disabled={isSubmitting} />
            {errors.endDate && (
              <p className="text-red-500 text-sm">{errors.endDate.message}</p>
            )}
          </div>
        </div>
        {/* Description */}
        <div>
          <Label htmlFor="description" hidden>Description (Optional)</Label>
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
                      {status.replace(/_/g, " ")}
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Season"}
          </Button>
        </div>
      </form>
    </div>
  );
}
