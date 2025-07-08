// components/forms/MyTeamProfileFormByTA.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useState, useEffect } from "react";
import { UpdateTeamProfileByTaFrontendDto, TeamDetailsFrontendDto } from '@/schemas';

// Matches UpdateTeamProfileByTaDto from backend
const teamProfileSchemaByTA = z.object({
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  bannerImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  homeVenue: z.string().max(100).optional(),
});

type TeamProfileFormValuesByTA = z.infer<typeof teamProfileSchemaByTA>;

interface MyTeamProfileFormByTAProps {
  initialData: UpdateTeamProfileByTaFrontendDto;
  onSuccess: (data: TeamDetailsFrontendDto) => void;
}

export function MyTeamProfileFormByTA({ initialData, onSuccess }: MyTeamProfileFormByTAProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TeamProfileFormValuesByTA>({
    resolver: zodResolver(teamProfileSchemaByTA),
    defaultValues: initialData,
  });
  
  useEffect(() => {
    form.reset(initialData);
  }, [initialData, form]);

  async function onSubmit(data: TeamProfileFormValuesByTA) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    const changedData: Partial<UpdateTeamProfileByTaFrontendDto> = {};
    (Object.keys(data) as Array<keyof TeamProfileFormValuesByTA>).forEach(key => {
        if (data[key] !== initialData?.[key] && (data[key] !== "" || initialData?.[key] !== null)) {
             changedData[key] = data[key] === "" ? undefined : data[key];
        }
    });

    if (Object.keys(changedData).length === 0) {
        setSuccessMessage("No changes to save.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await api.put<TeamDetailsFrontendDto>("/teams/my-team/profile", changedData);
      setSuccessMessage("Team profile updated successfully!");
      if (onSuccess) {
        onSuccess(response.data);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to update team profile.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm">{apiError}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded text-sm">{successMessage}</p>}
      
      <TextArea
        label="Description (Optional)"
        {...form.register("description")}
        error={form.formState.errors.description?.message}
        rows={3}
        disabled={isLoading}
      />
      <Input
        label="Logo URL (Optional)"
        type="url"
        {...form.register("logoUrl")}
        error={form.formState.errors.logoUrl?.message}
        disabled={isLoading}
      />
      <Input
        label="Banner Image URL (Optional)"
        type="url"
        {...form.register("bannerImageUrl")}
        error={form.formState.errors.bannerImageUrl?.message}
        disabled={isLoading}
      />
      <Input
        label="Home Venue (Optional)"
        {...form.register("homeVenue")}
        error={form.formState.errors.homeVenue?.message}
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Save Profile Changes
        </Button>
      </div>
    </form>
  );
}
