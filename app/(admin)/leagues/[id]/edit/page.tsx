// app/(admin)/leagues/[id]/edit/page.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/textarea";
import { SportType } from "@/prisma";

const sportTypeOptions = Object.values(SportType).map(type => ({ value: type, label: type }));

// Matches UpdateLeagueDto from backend (all fields optional)
const leagueEditSchema = z.object({
  name: z.string().min(3, "League name must be at least 3 characters").optional(),
  leagueCode: z.string().min(2, "League code must be at least 2 characters").max(10, "League code too long").optional(),
  sportType: z.nativeEnum(SportType).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  bannerImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  ownerId: z.string().optional().nullable(),
  status: z.boolean().optional(),
  pointsSystem: z.string().optional().refine(val => {
    if (!val) return true;
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: "Invalid JSON format for points system" }),
  tiebreakerRules: z.string().optional().refine(val => {
    if (!val) return true;
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: "Invalid JSON format for tiebreaker rules" }),
});

type LeagueEditFormValues = z.infer<typeof leagueEditSchema>;

export default function EditLeaguePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<LeagueEditFormValues>({
    resolver: zodResolver(leagueEditSchema),
  });

  useEffect(() => {
    if (id) {
      const fetchLeagueData = async () => {
        setIsFetching(true);
        try {
          const response = await api.get(`/system-admin/leagues/${id}`);
          const leagueData = response.data;
          form.reset({
            ...leagueData,
            ownerId: leagueData.ownerId || "", // Handle null ownerId
            pointsSystem: leagueData.pointsSystem ? JSON.stringify(leagueData.pointsSystem, null, 2) : "",
            tiebreakerRules: leagueData.tiebreakerRules ? JSON.stringify(leagueData.tiebreakerRules, null, 2) : "",
          });
        } catch (error: any) {
          setApiError(error.response?.data?.message || "Failed to fetch league data.");
        } finally {
          setIsFetching(false);
        }
      };
      fetchLeagueData();
    }
  }, [id, form]);

  async function onSubmit(data: LeagueEditFormValues) {
    setIsLoading(true);
    setApiError(null);
    try {
      // Only send fields that have changed or are not empty strings if they are optional
      const changedData: Partial<LeagueEditFormValues> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const typedKey = key as keyof LeagueEditFormValues;
          if (data[typedKey] !== form.formState.defaultValues?.[typedKey] && (data[typedKey] !== "" || typedKey === "status")) { // status can be false
             if (typedKey === "pointsSystem" || typedKey === "tiebreakerRules") {
                if (data[typedKey]) {
                    try {
                        changedData[typedKey] = JSON.parse(data[typedKey] as string) as any;
                    } catch (e) {
                        form.setError(typedKey, { type: 'manual', message: 'Invalid JSON format.' });
                        setIsLoading(false);
                        return;
                    }
                } else {
                     changedData[typedKey] = undefined as any; // Or undefined, depending on backend
                }
             } else {
                changedData[typedKey] = data[typedKey] as any; ////
             }
          }
        }
      }
      if (Object.keys(changedData).length === 0) {
        setApiError("No changes detected.");
        setIsLoading(false);
        return;
      }

      await api.put(`/system-admin/leagues/${id}`, changedData);
      router.push(`/leagues/${id}`); // Go to view page or list
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to update league.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) return <div className="text-center py-10">Loading league data for editing...</div>;
  if (apiError && !form.formState.defaultValues?.name) return <div className="text-center py-10 text-red-500 bg-red-50 p-4 rounded-md">Error: {apiError}</div>;


  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Edit League: {form.formState.defaultValues?.name || 'Loading...'}</h1>
      {apiError && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded">{apiError}</p>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="League Name"
          {...form.register("name")}
          error={form.formState.errors.name?.message}
          disabled={isLoading}
        />
        <Input
          label="League Code"
          {...form.register("leagueCode")}
          error={form.formState.errors.leagueCode?.message}
          disabled={isLoading}
        />
        <Select
          label="Sport Type"
          options={sportTypeOptions}
          {...form.register("sportType")}
          error={form.formState.errors.sportType?.message}
          disabled={isLoading}
        />
         <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="flex items-center">
            <input
              id="status-active"
              type="radio"
              value="true"
              {...form.register("status", {setValueAs: (value) => value === "true"})}
              defaultChecked={form.formState.defaultValues?.status === true}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="status-active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>
          <div className="flex items-center mt-1">
            <input
              id="status-inactive"
              type="radio"
              value="false"
              {...form.register("status", {setValueAs: (value) => value === "true"})}
              defaultChecked={form.formState.defaultValues?.status === false}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="status-inactive" className="ml-2 block text-sm text-gray-900">
              Inactive
            </label>
          </div>
          {form.formState.errors.status && <p className="mt-1 text-xs text-red-500">{form.formState.errors.status.message}</p>}
        </div>
        <TextArea
          label="Description"
          {...form.register("description")}
          error={form.formState.errors.description?.message}
          disabled={isLoading}
        />
        <Input
          label="Logo URL"
          type="url"
          {...form.register("logoUrl")}
          error={form.formState.errors.logoUrl?.message}
          disabled={isLoading}
        />
        <Input
          label="Banner Image URL"
          type="url"
          {...form.register("bannerImageUrl")}
          error={form.formState.errors.bannerImageUrl?.message}
          disabled={isLoading}
        />
        <Input
          label="Owner User ID"
          {...form.register("ownerId")}
          error={form.formState.errors.ownerId?.message}
          disabled={isLoading}
        />
        <TextArea
          label="Points System (JSON)"
          {...form.register("pointsSystem")}
          error={form.formState.errors.pointsSystem?.message}
          disabled={isLoading}
          rows={3}
        />
        <TextArea
          label="Tiebreaker Rules (JSON array)"
          {...form.register("tiebreakerRules")}
          error={form.formState.errors.tiebreakerRules?.message}
          disabled={isLoading}
          rows={3}
        />
        <div className="flex items-center justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
