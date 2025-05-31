// app/(admin)/leagues/create/page.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/textarea"; // Assuming you have this component
import { SportType } from "@/prisma";
///import { SportType } from "@prisma/client"; // Import from your prisma client types

const sportTypeOptions = Object.values(SportType).map(type => ({ value: type, label: type }));

// Matches CreateLeagueDto from backend
const leagueSchema = z.object({
  name: z.string().min(3, "League name must be at least 3 characters"),
  leagueCode: z.string().min(2, "League code must be at least 2 characters").max(10, "League code too long"),
  sportType: z.nativeEnum(SportType),
  description: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  bannerImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  ownerId: z.string().optional(), // Assuming CUID or UUID
  // pointsSystem and tiebreakerRules are JSON, handle as stringified JSON or build a dynamic form
  pointsSystem: z.string().optional().refine(val => {
    if (!val) return true;
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: "Invalid JSON format for points system" }),
  tiebreakerRules: z.string().optional().refine(val => {
    if (!val) return true;
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: "Invalid JSON format for tiebreaker rules" }),
});

type LeagueFormValues = z.infer<typeof leagueSchema>;

export default function CreateLeaguePage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LeagueFormValues>({
    resolver: zodResolver(leagueSchema),
    defaultValues: {
      name: "",
      leagueCode: "",
      sportType: undefined, // Or a default SportType
      description: "",
      logoUrl: "",
      bannerImageUrl: "",
      ownerId: "",
      pointsSystem: '{"win": 3, "draw": 1, "loss": 0}',
      tiebreakerRules: '["goalDifference", "goalsFor"]',
    },
  });

  async function onSubmit(data: LeagueFormValues) {
    setIsLoading(true);
    setApiError(null);
    try {
      const payload = {
        ...data,
        pointsSystem: data.pointsSystem ? JSON.parse(data.pointsSystem) : undefined,
        tiebreakerRules: data.tiebreakerRules ? JSON.parse(data.tiebreakerRules) : undefined,
      };
      if (payload.ownerId === '') {
        payload.ownerId = undefined;
      }
      await api.post("/system-admin/leagues", payload);
      // Could show a success toast/message here
      setIsLoading(false);
      // Redirect to leagues page after successful creation
      router.push("admin/leagues");
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to create league.");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Create New League</h1>
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
        <TextArea
          label="Description (Optional)"
          {...form.register("description")}
          error={form.formState.errors.description?.message}
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
          label="Owner User ID (Optional)"
          {...form.register("ownerId")}
          error={form.formState.errors.ownerId?.message}
          disabled={isLoading}
          placeholder="Enter User ID of the league owner"
        />
        <TextArea
          label="Points System (JSON format, Optional)"
          {...form.register("pointsSystem")}
          error={form.formState.errors.pointsSystem?.message}
          disabled={isLoading}
          placeholder='e.g., {"win": 3, "draw": 1, "loss": 0}'
          rows={3}
        />
        <TextArea
          label="Tiebreaker Rules (JSON array format, Optional)"
          {...form.register("tiebreakerRules")}
          error={form.formState.errors.tiebreakerRules?.message}
          disabled={isLoading}
          placeholder='e.g., ["goalDifference", "goalsFor", "headToHead"]'
          rows={3}
        />
        <div className="flex items-center justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            Create League
          </Button>
        </div>
      </form>
    </div>
  );
}
