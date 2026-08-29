"use client";

import { UseFormReturn } from "react-hook-form";
import { Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, getSportIcon } from "@/components/ui";
import { CountryDropdown } from "react-country-region-selector";
import { TenantTypes, SportType, VisibilityLevel } from "@/schemas";
import { TenantFormValues } from ".";

interface Step1Props {
  form: UseFormReturn<TenantFormValues>;
}

export function Step1TenantDetails({ form }: Step1Props) {
  const { register, setValue, watch, formState: { errors } } = form;
  const country = watch("country");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tenant Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom de l&apos;organisation</Label>
        <Input id="name" {...register("name")} restrict="alphanumeric" alphaFirst={true} allowSpace={true} transform="capitalize" maxCharacters={50} placeholder="ex: Ligue de la Paix"/>
        {errors.name && <p className="text-negative text-xs">{errors.name.message}</p>}
      </div>
      {/* Tenant Code */}
      <div className="space-y-2">
        <Label htmlFor="tenantCode">Code d&apos;Orgnisation</Label>
        <Input id="tenantCode" {...register("tenantCode")} restrict="alphanumeric" alphaFirst={true}  transform="uppercase" maxCharacters={12} placeholder="ex: LIGUE2" />
        <Label className="text-ink-subtle">https://<span className="text-positive">{watch("tenantCode").toLowerCase()}</span>.elenem.site</Label>
        {errors.tenantCode && <p className="text-negative text-xs">{errors.tenantCode.message}</p>}
      </div>
      <div className="border-b border-line col-span-1 md:col-span-2"/>
      {/* Sport Type */}
      <div className="space-y-2">
        <Label htmlFor="sportType">Sport</Label>
        <Select
          onValueChange={(value) => setValue("sportType", value as SportType)}
          value={watch("sportType")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selectionnez le sport" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SportType).map((type) => {
              const Icon = getSportIcon(type); // Get the icon component
              return <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-4">
                          <Icon className="w-5 h-5 font-semibold" />
                          <span>{type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                        </div>
                      </SelectItem>
                    })}
          </SelectContent>
        </Select>
        {errors.sportType && <p className="text-negative text-xs">{errors.sportType.message}</p>}
      </div>
      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <CountryDropdown
          value={country}
          aria-placeholder="Pays"
          onChange={(val) => setValue("country", val)}
                valueType="short"
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-line focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {errors.country && <p className="text-negative text-xs">{errors.country.message}</p>}
      </div>
       {/* isActive (Status) 👈 NEW CONTROL */}
      <div className="space-y-2">
        <Label htmlFor="isActive">Statut (Actif)</Label>
        <Select
          onValueChange={(value) => setValue("isActive", value === "true")}
          value={String(watch("isActive"))} // Convert boolean to string for Select value
        >
          <SelectTrigger>
            <SelectValue placeholder="Actif ou Inactif" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Actif</SelectItem>
            <SelectItem value="false">Inactif</SelectItem>
          </SelectContent>
        </Select>
        {errors.isActive && <p className="text-negative text-xs">{errors.isActive.message}</p>}
      </div>
      {/* visibility 👈 NEW CONTROL */}
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilité</Label>
        <Select
          onValueChange={(value) => setValue("visibility", value as VisibilityLevel)}
          value={watch("visibility")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selectionnez le niveau de visibilité" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(VisibilityLevel).map((level) => (
              <SelectItem key={level} value={level}>
                {level.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.visibility && <p className="text-negative text-xs">{errors.visibility.message}</p>}
      </div>
      {/* Tenant Type */}
      <div className="space-y-2">
        <Label htmlFor="tenantType">Type d&apos;Organisation</Label>
        <Select
          onValueChange={(value) => setValue("tenantType", value as TenantTypes)}
          value={watch("tenantType")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selectionnez le Type d'Organisation" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TenantTypes).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tenantType && <p className="text-negative text-xs">{errors.tenantType.message}</p>}
      </div>
    </div>
  );
}
