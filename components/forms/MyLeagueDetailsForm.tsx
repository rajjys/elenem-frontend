// components/forms/MyLeagueDetailsForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";// Assuming you have TextArea from previous steps
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useState, useEffect } from "react";
import { MyLeagueDetailsDto } from "@/schemas"; // Create this shared DTO type

// Matches UpdateMyLeagueDetailsDto from backend
const detailsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')).nullable(),
  bannerImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')).nullable(),
  leagueProfile: z.string().optional().nullable().refine(val => { // Storing JSON as string in form
    if (!val || val === "") return true;
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: "Invalid JSON format for league profile" }),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

interface MyLeagueDetailsFormProps {
  initialData: {
    name: string;
    description?: string | null;
    logoUrl?: string | null;
    bannerImageUrl?: string | null;
    leagueProfile?: any;
  };
  onSuccess: (updatedData: MyLeagueDetailsDto) => void;
}

export function MyLeagueDetailsForm({ initialData, onSuccess }: MyLeagueDetailsFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
        ...initialData,
        description: initialData.description || "",
        logoUrl: initialData.logoUrl || "",
        bannerImageUrl: initialData.bannerImageUrl || "",
        leagueProfile: initialData.leagueProfile ? JSON.stringify(initialData.leagueProfile, null, 2) : "",
    },
  });
  
  useEffect(() => {
    form.reset({
        ...initialData,
        description: initialData.description || "",
        logoUrl: initialData.logoUrl || "",
        bannerImageUrl: initialData.bannerImageUrl || "",
        leagueProfile: initialData.leagueProfile ? JSON.stringify(initialData.leagueProfile, null, 2) : "",
    });
  }, [initialData, form]);


  async function onSubmit(data: DetailsFormValues) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null); 

    const payload: Partial<DetailsFormValues> = {};
    (Object.keys(data) as Array<keyof DetailsFormValues>).forEach(key => {
        if (data[key] !== form.formState.defaultValues?.[key] || (data[key] === "" && form.formState.defaultValues?.[key] !== null && form.formState.defaultValues?.[key] !== undefined)) {
            if (key === 'leagueProfile') {
                 payload[key] = data[key] ? JSON.parse(data[key] as string) : null;
            } else {
                //payload[key] = data[key] === "" ? undefined : data[key];
                payload[key] = data[key] === "" || data[key] === null ? undefined : data[key];
            }
        }
    });
     if (Object.keys(payload).length === 0) {
        setSuccessMessage("No changes to save.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await api.put<MyLeagueDetailsDto>("/leagues/my-league/details", payload);
      setSuccessMessage("League details updated successfully!");
      onSuccess(response.data); // Notify parent component
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to update league details.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm">{apiError}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded text-sm">{successMessage}</p>}
      
      <Input
        label="League Name"
        {...form.register("name")}
        error={form.formState.errors.name?.message}
        disabled={isLoading}
      />
      <TextArea
        label="Description"
        {...form.register("description")}
        error={form.formState.errors.description?.message}
        rows={4}
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
      <TextArea
        label="League Profile (JSON format)"
        {...form.register("leagueProfile")}
        error={form.formState.errors.leagueProfile?.message}
        rows={5}
        placeholder='e.g., {"city": "Metropolis", "contactEmail": "info@league.com"}'
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Save Details
        </Button>
      </div>
    </form>
  );
}
