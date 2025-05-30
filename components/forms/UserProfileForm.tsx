// components/forms/UserProfileForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store"; // To get current user data and update it

// Matches UpdateUserProfileDto from backend
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  profileImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function UserProfileForm() {
  const { user, fetchUser } = useAuthStore(); // Get user and a way to refresh it
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      profileImageUrl: user?.profileImageUrl || "",
      phone: user?.phone || "",
    },
  });

  useEffect(() => {
    // Reset form if user data changes (e.g., after initial load)
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        profileImageUrl: user.profileImageUrl || "",
        phone: user.phone || "",
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    // Filter out unchanged values to send only what's modified
    const changedData: Partial<ProfileFormValues> = {};
    (Object.keys(data) as Array<keyof ProfileFormValues>).forEach(key => {
      if (data[key] !== user?.[key] && (data[key] !== "" || user?.[key] !== null)) { // Also consider empty string vs null
        changedData[key] = data[key] === "" ? undefined : data[key]; // Send undefined if field is cleared
      }
    });
    
    if (Object.keys(changedData).length === 0) {
        setSuccessMessage("No changes to save.");
        setIsLoading(false);
        return;
    }


    try {
      await api.put("/users/profile", changedData);
      setSuccessMessage("Profile updated successfully!");
      await fetchUser(); // Refresh user data in the store
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm">{apiError}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded text-sm">{successMessage}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
      <Input
        label="Username"
        {...form.register("username")}
        error={form.formState.errors.username?.message}
        disabled={isLoading}
      />
      <Input
        label="Email"
        type="email"
        {...form.register("email")}
        error={form.formState.errors.email?.message}
        disabled={isLoading}
      />
      <Input
        label="Phone (Optional)"
        {...form.register("phone")}
        error={form.formState.errors.phone?.message}
        disabled={isLoading}
      />
      <Input
        label="Profile Image URL (Optional)"
        type="url"
        {...form.register("profileImageUrl")}
        error={form.formState.errors.profileImageUrl?.message}
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
