// components/forms/MyLeagueSettingsForm.tsx
import { useForm as useFormHook } from "react-hook-form"; // Renamed to avoid conflict
import { zodResolver as zodResolverHook } from "@hookform/resolvers/zod"; // Renamed
import * as zSchema from "zod"; // Renamed
import { Button, TextArea } from "../ui";
import { MyLeagueDetailsDto } from "@/schemas";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
// ... other imports (Input, Button, api, useState, useEffect)
// import { MyLeagueDetailsDto } from '@/shared-types/league.dto'; // Using Pick for settings

// Matches UpdateMyLeagueSettingsDto from backend
const settingsSchema = zSchema.object({
  pointsSystem: zSchema.string().optional().nullable().refine(val => {
    if (!val || val === "") return true;
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: "Invalid JSON for points system (e.g., {\"win\": 3})" }),
  tiebreakerRules: zSchema.string().optional().nullable().refine(val => {
    if (!val || val === "") return true;
    try { 
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string');
    } catch { return false; }
  }, { message: "Invalid JSON array of strings for tiebreakers (e.g., [\"gd\", \"h2h\"])" }),
});

type SettingsFormValues = zSchema.infer<typeof settingsSchema>;

interface MyLeagueSettingsFormProps {
  initialData: {
    pointsSystem?: any;
    tiebreakerRules?: string[];
  };
  onSuccess: (updatedData: Pick<MyLeagueDetailsDto, 'pointsSystem' | 'tiebreakerRules'>) => void;
}

export function MyLeagueSettingsForm({ initialData, onSuccess }: MyLeagueSettingsFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useFormHook<SettingsFormValues>({ // useFormHook
    resolver: zodResolverHook(settingsSchema), // zodResolverHook
    defaultValues: {
      pointsSystem: initialData.pointsSystem ? JSON.stringify(initialData.pointsSystem, null, 2) : '{"win": 3, "draw": 1, "loss": 0}',
      tiebreakerRules: initialData.tiebreakerRules ? JSON.stringify(initialData.tiebreakerRules, null, 2) : '["goalDifference", "goalsFor"]',
    },
  });

  useEffect(() => {
    form.reset({
      pointsSystem: initialData.pointsSystem ? JSON.stringify(initialData.pointsSystem, null, 2) : '{"win": 3, "draw": 1, "loss": 0}',
      tiebreakerRules: initialData.tiebreakerRules ? JSON.stringify(initialData.tiebreakerRules, null, 2) : '["goalDifference", "goalsFor"]',
    });
  }, [initialData, form]);

  async function onSubmit(data: SettingsFormValues) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    const payload: any = {};
    if (data.pointsSystem && data.pointsSystem !== JSON.stringify(form.formState.defaultValues?.pointsSystem || {})) {
        try { payload.pointsSystem = JSON.parse(data.pointsSystem); } catch (e) { /* already validated by zod */ }
    }
    if (data.tiebreakerRules && data.tiebreakerRules !== JSON.stringify(form.formState.defaultValues?.tiebreakerRules || [])) {
        try { payload.tiebreakerRules = JSON.parse(data.tiebreakerRules); } catch (e) { /* already validated by zod */ }
    }
     if (Object.keys(payload).length === 0) {
        setSuccessMessage("No settings changed.");
        setIsLoading(false);
        return;
    }


    try {
      const response = await api.put<Pick<MyLeagueDetailsDto, 'id' | 'pointsSystem' | 'tiebreakerRules'>>("/leagues/my-league/settings", payload);
      setSuccessMessage("League settings updated successfully!");
      onSuccess(response.data); // Notify parent
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to update league settings.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm">{apiError}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded text-sm">{successMessage}</p>}
      
      <TextArea
        label="Points System (JSON object)"
        {...form.register("pointsSystem")}
        error={form.formState.errors.pointsSystem?.message}
        rows={4}
        placeholder='e.g., {"win": 3, "draw": 1, "loss": 0}'
        disabled={isLoading}
      />
      <TextArea
        label="Tiebreaker Rules (JSON array of strings)"
        {...form.register("tiebreakerRules")}
        error={form.formState.errors.tiebreakerRules?.message}
        rows={4}
        placeholder='e.g., ["goalDifference", "goalsFor", "headToHead"]'
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}

