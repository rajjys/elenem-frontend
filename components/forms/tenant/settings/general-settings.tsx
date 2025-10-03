"use client";

import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Label,
  Button,
  Switch,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  getSportIcon
} from "@/components/ui";
import { CountryDropdown } from "react-country-region-selector"; // Add import for CountryDropdown
import { api } from "@/services/api";
import { UpdateTenantSchema, VisibilityLevel, TenantDetails, SportType, TenantTypes } from "@/schemas"; // Add SportType, TenantTypes to imports
import axios from "axios";
import { Loader2 } from "lucide-react"; // Add Loader2 import
import { countryCodeToName } from "@/utils";

type FormValues = z.infer<typeof UpdateTenantSchema>;

interface TenantGeneralSettingsProps {
  tenant: TenantDetails;
  onSuccess?: () => void;
}

// Helper: build a shape matching UpdateTenantSchema from the full TenantDetails
function buildDefaultValues(tenant: TenantDetails): FormValues {
  return {
    // make sure all keys expected by UpdateTenantSchema are present
    name: tenant.name,
    tenantCode: tenant.tenantCode,
    tenantType: tenant.tenantType,
    sportType: tenant.sportType,
    country: tenant.country,
    isActive: tenant.isActive,
    visibility: tenant.visibility,
    ownerId: tenant.ownerId, // Include ownerId
  } as FormValues; // cast - your UpdateTenantSchema determines exact optionality
}

function isEqual(a: unknown, b: unknown) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function computeDelta(oldObj: Partial<FormValues>, newObj: Partial<FormValues>) {
  const delta: Partial<FormValues> = {};
  Object.keys(newObj).forEach((key) => {
    const k = key as keyof FormValues;
    if (!isEqual(oldObj[k], newObj[k])) {
      // Only include keys that changed
      // Note: we don't remove keys that became `null`/`undefined` on purpose — backend should handle nullable fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delta[k] = newObj[k] as any;
    }
  });
  return delta;
}

export default function TenantGeneralSettings({ tenant, onSuccess  }: TenantGeneralSettingsProps) {
  // initial values stored in a ref so we can update it after successful saves
  const initialRef = useRef<FormValues>(buildDefaultValues(tenant));

  const form = useForm<FormValues>({
    resolver: zodResolver(UpdateTenantSchema),
    defaultValues: initialRef.current,
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty, errors },
    reset,
    getValues,
    setValue,
    watch, // Use watch to read current values
  } = form;

  // Watch for country change for CountryDropdown
  const countryCodeOrName = watch("country")
  const country = countryCodeOrName ? countryCodeToName[countryCodeOrName] || countryCodeOrName : countryCodeOrName;
  const tenantCode = watch("tenantCode");

  // keep form in sync when tenant prop changes (route navigation / data refetch)
  useEffect(() => {
    const defaults = buildDefaultValues(tenant);
    initialRef.current = defaults;
    reset(defaults);
  }, [tenant, reset]);

  const onSubmit = async () => {
    // compute the delta between the latest "saved" initial values and the current form values
    const currentValues = getValues();
    const deltaPayload = computeDelta(initialRef.current, currentValues);

    if (Object.keys(deltaPayload).length === 0) {
      toast.info("No changes detected to save.");
      return;
    }
    try {
      // call backend with partial payload. The backend should accept partial updates (PATCH/PUT semantics)
      await api.put(`/tenants/${tenant.id}`, deltaPayload);
      toast.success("General settings updated successfully!");
      // update the "saved" baseline and reset the form's dirty state
      initialRef.current = getValues();
      // Only reset with the new initial values, which are now current values
      reset(initialRef.current);
      if (onSuccess) onSuccess();
    } catch (error) {
      let errorMessage = "Failed to update tenant settings";
      if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage)
      console.error("error updating Tenant:", error);
    }finally {
        // Ensure form state is updated regardless of the initial try/catch success/failure
        // This is important to clear submitting state and dirty state
        // If an error occurred before setting initialRef.current, we still want to reset to initialRef.current
        reset(initialRef.current);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 shadow-md bg-white rounded-lg">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Tenant Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom de l&apos;organisation</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="name"
                {...field}
                placeholder="ex: Ligue de la Paix"
                // No need for restrict/transform/maxCharacters on a simple input, rely on schema validation
              />
            )}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        {/* Tenant Code */}
        <div className="space-y-2">
          <Label htmlFor="tenantCode">Code d&apos;Orgnisation</Label>
          <Controller
          disabled={true}
            name="tenantCode"
            control={control}
            render={({ field }) => (
              <Input
                id="tenantCode"
                {...field}
                value={(field.value ?? "").toString()}
                onChange={(e) => {
                  // Keep the inline uppercase transformation logic for UX
                  const upper = e.target.value.toUpperCase();
                  field.onChange(upper);
                  setValue("tenantCode", upper, { shouldDirty: true });
                }}
                placeholder="ex: LIGUE2"
              />
            )}
          />
          <Label className="text-slate-400">https://<span className="text-green-700">{tenantCode?.toLowerCase()}</span>.elenem.site</Label>
          {errors.tenantCode && <p className="text-red-500 text-xs">{errors.tenantCode.message}</p>}
        </div>

        <div className="border-b border-slate-200 col-span-1 md:col-span-2"/>

        {/* Sport Type */}
        <div className="space-y-2">
          <Label htmlFor="sportType">Sport</Label>
          <Controller
            name="sportType"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value as SportType)}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez le sport" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SportType).map((type) => {
                    const Icon = getSportIcon(type);
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-4">
                          <Icon className="w-5 h-5 font-semibold" />
                          <span>{type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
          {errors.sportType && <p className="text-red-500 text-xs">{errors.sportType.message}</p>}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              // Use CountryDropdown for consistency
              <CountryDropdown
                value={country} // Use watched value
                aria-placeholder="Pays"
                onChange={(val) => field.onChange(val)} // Update field value on change
                className="w-full h-10 px-3 py-2 text-sm border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
        </div>

        {/* isActive (Status) - Refactored to Select for consistency, but kept Switch logic for reference */}
        {/* Keeping the Switch as it's the current implementation in the settings page */}
        <div className="space-y-2">
          <Label htmlFor="isActive">Status de l&apos;organisation</Label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                {/* Use the Switch component */}
                <Switch id="isActive" checked={!!field.value} onCheckedChange={(val) => field.onChange(val)} />
                <span className="text-sm text-gray-600">{field.value ? "Actif" : "Inactif"}</span>
              </div>
            )}
          />
        </div>

        {/* visibility select */}
        <div className="space-y-2">
          <Label htmlFor="visibility">Visibilité</Label>
          <Controller
            name="visibility"
            control={control}
            render={({ field }) => (
              // Use Select component for consistency
              <Select
                onValueChange={(value) => field.onChange(value as VisibilityLevel)}
                value={field.value}
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
            )}
          />
          {errors.visibility && <p className="text-red-500 text-xs">{errors.visibility.message}</p>}
        </div>

        {/* Tenant Type - Added for completeness and consistency with creation form */}
        <div className="space-y-2">
          <Label htmlFor="tenantType">Type d&apos;Organisation</Label>
          <Controller
            name="tenantType"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value as TenantTypes)}
                value={field.value}
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
            )}
          />
          {errors.tenantType && <p className="text-red-500 text-xs">{errors.tenantType.message}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => reset(initialRef.current)}
            disabled={isSubmitting || !isDirty} // Disable reset if nothing is dirty
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}