// components/forms/ChangePasswordForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useState } from "react";

// Matches ChangePasswordDto from backend
const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"], // path of error
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  async function onSubmit(data: PasswordFormValues) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);
    try {
      await api.post("/users/profile/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setSuccessMessage("Password changed successfully!");
      form.reset(); // Clear form
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm">{apiError}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded text-sm">{successMessage}</p>}
      <Input
        label="Current Password"
        type="password"
        {...form.register("oldPassword")}
        error={form.formState.errors.oldPassword?.message}
        disabled={isLoading}
      />
      <Input
        label="New Password"
        type="password"
        {...form.register("newPassword")}
        error={form.formState.errors.newPassword?.message}
        disabled={isLoading}
      />
      <Input
        label="Confirm New Password"
        type="password"
        {...form.register("confirmNewPassword")}
        error={form.formState.errors.confirmNewPassword?.message}
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Change Password
        </Button>
      </div>
    </form>
  );
}
