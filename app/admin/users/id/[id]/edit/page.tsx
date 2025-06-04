// app/(admin)/users/[id]/edit/page.tsx
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
import { Role } from "@/prisma";



const roleOptions = Object.values(Role).map(role => ({ value: role, label: role }));

// Matches UpdateSystemUserDto and PromoteUserDto (for role changes)
const userEditSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  // username: z.string().min(3).optional(), // Backend DTO for promoteUser allows username/email change
  // email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  profileImageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  role: z.nativeEnum(Role).optional(),
  leagueId: z.string().optional().nullable(), // Can be empty string or null
  isActive: z.boolean().optional(), // Corresponds to accountLocked in backend
  // password: z.string().min(8).optional(), // For password change, usually a separate flow
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

interface LeagueOption {
  id: string;
  name: string;
  leagueCode: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [initialUsername, setInitialUsername] = useState<string>('');


  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
  });

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await api.get("/system-admin/leagues?take=1000");
        setLeagues(response.data.map((l: any) => ({ id: l.id, name: `${l.name} (${l.leagueCode})`, leagueCode: l.leagueCode })));
      } catch (error) {
        console.error("Failed to fetch leagues for dropdown", error);
      }
    };
    fetchLeagues();
  }, []);
  
  const leagueOptionsForSelect = leagues.map(league => ({ value: league.id, label: league.name }));

  useEffect(() => {
    if (id) {
      const fetchUserData = async () => {
        setIsFetching(true);
        try {
          const response = await api.get(`/system-admin/users/${id}`);
          const userData = response.data;
          setInitialUsername(userData.username);
          form.reset({
            ...userData,
            leagueId: userData.leagueId || "", // Ensure empty string if null for select
            isActive: !userData.accountLocked, // Map accountLocked to isActive
            phone: userData.phone || "",
            profileImageUrl: userData.profileImageUrl || "",
          });
        } catch (error: any) {
          setApiError(error.response?.data?.message || "Failed to fetch user data.");
        } finally {
          setIsFetching(false);
        }
      };
      fetchUserData();
    }
  }, [id, form]);

  async function onSubmit(data: UserEditFormValues) {
    setIsLoading(true);
    setApiError(null);
    
    // Backend DTOs:
    // PUT /system-admin/users/:id uses UpdateSystemUserDto { firstName, lastName, leagueId, role, isActive }
    // PUT /system-admin/users/promote-to-admin/:id uses PromoteUserDto { role, username, email, password, leagueId }
    // We'll use the first one for general updates and if role changes, we can call the promote endpoint,
    // or the backend /users/:id PUT should handle role changes if it's designed that way.
    // For simplicity, assuming /system-admin/users/:id can handle role updates via UpdateSystemUserDto.

    const payload: Partial<Record<keyof UserEditFormValues, string | boolean | undefined>> = {};
     // Construct payload with only changed values
    (Object.keys(data) as Array<keyof UserEditFormValues>).forEach(key => {
        if (data[key] !== form.formState.defaultValues?.[key] || (key === 'isActive' && data[key] !== undefined) ) {
             // Handle leagueId: if it's an empty string, send undefined instead of null
            if (key === 'leagueId' && data[key] === '') {
                payload[key] = undefined;
            } else if (data[key] === null) {
                payload[key] = undefined;
            } else {
                payload[key] = data[key];
            }
        }
    });
    
    if (Object.keys(payload).length === 0) {
        setApiError("No changes detected.");
        setIsLoading(false);
        return;
    }


    try {
      // If role changed, use the promote endpoint, otherwise the general update endpoint
      // This depends on your backend API design. For now, let's assume the general update handles role.
      // if (payload.role && payload.role !== form.formState.defaultValues?.role) {
      //   await api.put(`/system-admin/users/promote-to-admin/${id}`, { role: payload.role, leagueId: payload.leagueId });
      // } else {
      //   await api.put(`/system-admin/users/${id}`, payload);
      // }
      await api.put(`/system-admin/users/${id}`, payload);
      router.push(`/admin/users/${id}`);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to update user.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) return <div className="text-center py-10">Loading user data for editing...</div>;
   if (apiError && !initialUsername) return <div className="text-center py-10 text-red-500 bg-red-50 p-4 rounded-md">Error: {apiError}</div>;


  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Edit User: {initialUsername || 'Loading...'}</h1>
      {apiError && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded">{apiError}</p>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="First Name"
          {...form.register("firstName")}
          error={form.formState.errors.firstName?.message}
          disabled={isLoading}
        />
        <Input
          label="Last Name"
          {...form.register("lastName")}
          error={form.formState.errors.lastName?.message}
          disabled={isLoading}
        />
        <Input
          label="Phone"
          {...form.register("phone")}
          error={form.formState.errors.phone?.message}
          disabled={isLoading}
        />
        <Input
          label="Profile Image URL"
          type="url"
          {...form.register("profileImageUrl")}
          error={form.formState.errors.profileImageUrl?.message}
          disabled={isLoading}
        />
        <Select
          label="Role"
          options={roleOptions}
          {...form.register("role")}
          error={form.formState.errors.role?.message}
          disabled={isLoading}
        />
        {form.watch("role") !== Role.SYSTEM_ADMIN && (
            <Select
            label="League"
            options={leagueOptionsForSelect}
            {...form.register("leagueId")}
            error={form.formState.errors.leagueId?.message}
            disabled={isLoading}
            />
        )}
         <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Status (Is Active?)</label>
          <div className="flex items-center">
            <input
              id="isActive-true"
              type="radio"
              value="true"
              {...form.register("isActive", {setValueAs: (value) => value === "true"})}
              defaultChecked={form.formState.defaultValues?.isActive === true}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="isActive-true" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>
          <div className="flex items-center mt-1">
            <input
              id="isActive-false"
              type="radio"
              value="false"
              {...form.register("isActive", {setValueAs: (value) => value === "true"})}
               defaultChecked={form.formState.defaultValues?.isActive === false}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="isActive-false" className="ml-2 block text-sm text-gray-900">
              Inactive (Locked)
            </label>
          </div>
          {form.formState.errors.isActive && <p className="mt-1 text-xs text-red-500">{form.formState.errors.isActive.message}</p>}
        </div>

        {/* Password change should ideally be a separate, more secure form/flow */}
        {/* <Input label="New Password (leave blank to keep current)" type="password" {...form.register("password")} error={form.formState.errors.password?.message} disabled={isLoading}/> */}

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
