// components/forms/TeamFormByLA.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateTeamFrontendDto, UpdateTeamByLaFrontendDto, TeamDetailsFrontendDto } from '@/schemas';

// Schema for both create and update by LA
const teamSchemaByLA = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  bannerImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  homeVenue: z.string().max(100).optional()
});

type TeamFormValuesByLA = z.infer<typeof teamSchemaByLA>;

interface TeamFormByLAProps {
  teamId?: string; // If provided, it's an edit form
  initialData?: Partial<TeamFormValuesByLA>;
  onSuccess?: (data: TeamDetailsFrontendDto) => void; // Callback for parent component
}

export function TeamFormByLA({ teamId, initialData, onSuccess }: TeamFormByLAProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TeamFormValuesByLA>({
    resolver: zodResolver(teamSchemaByLA),
    defaultValues: initialData || {
      name: "",
      logoUrl: "",
      bannerImageUrl: "",
      description: "",
      homeVenue: "",
    },
  });
  
  useEffect(() => {
    if (initialData) {
        form.reset(initialData);
    }
  }, [initialData, form]);

  async function onSubmit(data: TeamFormValuesByLA) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      let response;
      if (teamId) { // Edit mode
        // Filter out unchanged values for PUT request
        const changedData: Partial<UpdateTeamByLaFrontendDto> = {};
        (Object.keys(data) as Array<keyof TeamFormValuesByLA>).forEach(key => {
            if (data[key] !== initialData?.[key] && (data[key] !== "" || initialData?.[key] !== null)) {
                 changedData[key] = data[key] === "" ? undefined : data[key];
            }
        });
        if (Object.keys(changedData).length === 0) {
            setSuccessMessage("No changes to save.");
            setIsLoading(false);
            return;
        }
        response = await api.put<TeamDetailsFrontendDto>(`/teams/league-admin/${teamId}`, changedData);
        setSuccessMessage("Team updated successfully!");
      } else { // Create mode
        response = await api.post<TeamDetailsFrontendDto>("/teams/league-admin/create", data as CreateTeamFrontendDto);
        setSuccessMessage("Team created successfully!");
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      if (!teamId) { // If creating, redirect to team list or edit page of new team
        router.push(`/league/teams/id/${response.data.id}/edit`); // Go to edit page after creation
      } else {
         setTimeout(() => setSuccessMessage(null), 3000);
      }

    } catch (error: any) {
      setApiError(error.response?.data?.message || (teamId ? "Failed to update team." : "Failed to create team."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm">{apiError}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded text-sm">{successMessage}</p>}
      
      <Input
        label="Team Name"
        {...form.register("name")}
        error={form.formState.errors.name?.message}
        disabled={isLoading}
      />
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
      <div className="flex justify-end space-x-3 pt-4">
        {!teamId && // Only show cancel for create form if it's not part of a larger page
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
                Cancel
            </Button>
        }
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {teamId ? "Save Changes" : "Create Team"}
        </Button>
      </div>
    </form>
  );
}
