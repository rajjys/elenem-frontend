"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/services/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlayerDetailsDto, TeamDetailsFrontendDto } from '@/prisma';

const playerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  profileImageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  bio: z.string().optional().nullable(),
  jerseyNumber: z.coerce.number().optional().nullable(),
  isActive: z.boolean().optional(),
  teamId: z.string().optional().nullable(), // Optional for create, required for edit
});
type PlayerFormValues = z.infer<typeof playerSchema>;

interface PlayerFormByLAProps {
  playerId?: string;
  initialData?: Partial<PlayerFormValues>;
  onSuccess?: (data: PlayerDetailsDto) => void;
}

export function PlayerFormByLA({ playerId, initialData, onSuccess }: PlayerFormByLAProps) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<TeamDetailsFrontendDto[]>([]);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: { isActive: true, ...initialData },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({ isActive: true, ...initialData });
    }
  }, [initialData, form]);

  useEffect(() => {
    // Fetch teams for the teamId dropdown
    const fetchTeams = async () => {
      try {
        const response = await api.get<TeamDetailsFrontendDto[]>('/teams/league-admin/list');
        setTeams(response.data);
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchTeams();
  }, []);

  async function onSubmit(data: PlayerFormValues) {
    setIsLoading(true);
    setApiError(null);
    try {
      let response;
      const payload = { ...data, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null };
      if (playerId) { // Edit
        response = await api.put<PlayerDetailsDto>(`/players/league-admin/${playerId}`, payload);
        if (onSuccess) onSuccess(response.data);
      } else { // Create
        response = await api.post<PlayerDetailsDto>("/players/league-admin/create", payload);
        router.push(`/league/players/${response.data.id}/edit`);
      }
    } catch (error: any) {
      setApiError(error.response?.data?.message || `Failed to ${playerId ? 'update' : 'create'} player.`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {apiError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm">{apiError}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name" {...form.register("firstName")} error={form.formState.errors.firstName?.message} />
        <Input label="Last Name" {...form.register("lastName")} error={form.formState.errors.lastName?.message} />
      </div>
      <Input label="Date of Birth" type="date" {...form.register("dateOfBirth")} error={form.formState.errors.dateOfBirth?.message} />
      <Input label="Position" {...form.register("position")} error={form.formState.errors.position?.message} />
      <Input label="Jersey Number" type="number" {...form.register("jerseyNumber")} error={form.formState.errors.jerseyNumber?.message} />
      <Input label="Profile Image URL" type="url" {...form.register("profileImageUrl")} error={form.formState.errors.profileImageUrl?.message} />
      <TextArea label="Biography" {...form.register("bio")} error={form.formState.errors.bio?.message} />

      {/* Team selection */}
      <div>
        <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
        <select
          id="teamId"
          {...form.register("teamId")}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select a team</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        {form.formState.errors.teamId && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.teamId.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" id="isActive" {...form.register("isActive")} className="h-4 w-4 rounded" />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Player is Active</label>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading}>{playerId ? "Save Changes" : "Create Player"}</Button>
      </div>
    </form>
  );
}