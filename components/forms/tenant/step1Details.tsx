"use client";

import { UseFormReturn } from "react-hook-form";
import { Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { CountryDropdown } from "react-country-region-selector";
import { TenantTypes, SportType } from "@/schemas";
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
        <Label htmlFor="name">Nom de l&apos;Organisation</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      {/* Tenant Code */}
      <div className="space-y-2">
        <Label htmlFor="tenantCode">Code d&apos;Orgnisation</Label>
        <Input id="tenantCode" {...register("tenantCode")} placeholder="ex: LIGUE2" />
        {errors.tenantCode && <p className="text-red-500 text-xs">{errors.tenantCode.message}</p>}
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
        {errors.tenantType && <p className="text-red-500 text-xs">{errors.tenantType.message}</p>}
      </div>

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
            {Object.values(SportType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sportType && <p className="text-red-500 text-xs">{errors.sportType.message}</p>}
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <CountryDropdown
          value={country}
          aria-placeholder="Pays"
          onChange={(val) => setValue("country", val)}
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
      </div>
    </div>
  );
}
