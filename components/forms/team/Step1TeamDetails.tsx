// Step1_TeamDetails.tsx
"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Label, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { TeamVisibility } from "@/schemas";
import { TeamFormValues } from "./team-form";

interface TenantLite { id: string; name: string; }
interface LeagueLite { id: string; name: string; tenantId: string; }
interface VenueLite { id: string; name: string; }

interface Props {
  form: UseFormReturn<TeamFormValues>;
  tenants: TenantLite[];
  leagues: LeagueLite[];
  venues: VenueLite[];
  isSystemAdmin: boolean;
  isTenantAdmin: boolean;
  isLeagueAdmin: boolean;
}

export default function Step1TeamDetails({ form, tenants, leagues, venues, isSystemAdmin, isLeagueAdmin }: Props) {
  const { register, setValue, watch, formState: { errors } } = form;
  const selectedTenantId = watch("tenantId");
  const selectedLeagueId = watch("leagueId");

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isSystemAdmin && (
          <div className="space-y-2">
            <Label>Organisation</Label>
            <Select value={selectedTenantId || ""} onValueChange={(v) => setValue("tenantId", v)}>
              <SelectTrigger><SelectValue placeholder="Selectionnez l'Organisation" /></SelectTrigger>
              <SelectContent>
                {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isLeagueAdmin && (
          <div className="space-y-2">
            <Label>Ligue</Label>
            <Select value={selectedLeagueId || ""} onValueChange={(v) => setValue("leagueId", v)} disabled={isSystemAdmin && !selectedTenantId}>
              <SelectTrigger><SelectValue placeholder="Selectionnez une ligue" /></SelectTrigger>
              <SelectContent>
                {leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.leagueId && <p className="text-xs text-red-500">{errors.leagueId.message}</p>}
          </div>
        )}
        <div className="space-y-2">
          <Label>Equipe</Label>
          <Input {...register("name")} placeholder="ex: Real Madrid F.C" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Code</Label>
          <Input {...register("shortCode")} placeholder="ex: FCB" />
          {errors.shortCode && <p className="text-xs text-red-500">{errors.shortCode.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Visibilite</Label>
          <Select value={String(watch("visibility"))} onValueChange={(v) => setValue("visibility", v as unknown as TeamVisibility)}>
            <SelectTrigger><SelectValue placeholder="Type de visibilite" /></SelectTrigger>
            <SelectContent>
              {Object.values(TeamVisibility).map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Home Venue placeholder moved here */}
        <div className="space-y-2">
          <Label>Stade</Label>
          <Select value={watch("homeVenueId") ?? ""} onValueChange={(v) => setValue("homeVenueId", v)}>
            <SelectTrigger><SelectValue placeholder="Stade domicile" /></SelectTrigger>
            <SelectContent>
              {venues.length ? venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>) : <SelectItem value="null" disabled>Aucun stade disponible</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
