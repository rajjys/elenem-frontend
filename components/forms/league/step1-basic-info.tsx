"use client";

import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { LeagueLiteResponseDto } from "@/schemas/league-schemas";
import { Gender, TenantDetails } from "@/schemas";
import { Roles } from "@/schemas";
import { LeagueFormValues } from ".";

interface Step1Props {
  form: UseFormReturn<LeagueFormValues>;
}

export default function Step1BasicInfo({ form }: Step1Props) {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.roles.includes(Roles.SYSTEM_ADMIN);
  const { register, setValue, watch, formState: { errors } } = form;

  const [tenants, setTenants] = useState<TenantDetails[]>([]);
  const [parentLeagues, setParentLeagues] = useState<LeagueLiteResponseDto[]>(
    []
  );

  const watchedTenantId = watch("tenantId");

  // Fetch tenants for System Admin
  useEffect(() => {
    if (isSystemAdmin) {
      const fetchTenants = async () => {
        try {
          const res = await api.get("/tenants");
          setTenants(res.data.data);
        } catch (error) {
          console.error("Failed to fetch tenants", error);
        }
      };
      fetchTenants();
    }
  }, [isSystemAdmin]);

  // Fetch leagues for tenant
  useEffect(() => {
    if (watchedTenantId) {
      const fetchLeagues = async () => {
        try {
          const res = await api.get(`/leagues?tenantId=${watchedTenantId}`);
          setParentLeagues(res.data.data);
        } catch (error) {
          console.error("Failed to fetch leagues", error);
          setParentLeagues([]);
        }
      };
      fetchLeagues();
    }
  }, [watchedTenantId]);

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">League Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      {isSystemAdmin && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="tenantId">Tenant</Label>
          <Select
            onValueChange={(value) => setValue("tenantId", value)}
            value={watchedTenantId || ""}
          >
            <SelectTrigger id="tenantId">
              <SelectValue placeholder="Select a tenant..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tenantId && <p className="text-red-500 text-xs">{errors.tenantId.message}</p>}
        </div>
      )}

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="parentLeagueId">Parent League (Optional)</Label>
        <Select
          onValueChange={(value) => setValue("parentLeagueId", value)}
          value={watch("parentLeagueId") || ""}
        >
          <SelectTrigger id="parentLeagueId">
            <SelectValue placeholder="Select a parent league..." />
          </SelectTrigger>
          <SelectContent>
            {parentLeagues.map((league) => (
              <SelectItem key={league.id} value={league.id}>
                {league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.parentLeagueId && <p className="text-red-500 text-xs">{errors.parentLeagueId.message}</p>}
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="division">Division</Label>
        <Input id="division" {...register("division")} defaultValue="D1" />
        {errors.division && <p className="text-red-500 text-xs">{errors.division.message}</p>}
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="gender">Gender</Label>
        <Select
          onValueChange={(value: Gender) => setValue("gender", value)}
          value={watch("gender") || ""}
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select gender..." />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Gender).map((gender) => (
              <SelectItem key={gender} value={gender}>
                {gender}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
      </div>
    </div>
  );
}
