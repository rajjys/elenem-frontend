// components/forms/user-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/"; // Ensure Select components are imported
import { useState, useEffect } from "react";
import { Gender, SupportedLanguage } from "@/prisma";


// Define the schema for the user form based on the provided User model
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  // Password is optional for updates, and implicitly handled by backend for creates
  // If no initialData (creating), password validation would be more strict or required
  password: z.string()
    .min(6, "Password must be at least 6 characters.")
    .optional()
    .or(z.literal('')), // Allows empty string for optional fields
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  profileImageUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(), // Convert string to Date or undefined
  nationality: z.string().optional().or(z.literal('')),
  gender: z.nativeEnum(Gender).optional(), // Use nativeEnum for TypeScript enums
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().or(z.literal('')),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
  preferredLanguage: z.nativeEnum(SupportedLanguage).optional(),
  timezone: z.string().optional().or(z.literal('')),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

// Extend UserFormValues to include id for initialData if coming from an existing user
export type UserForForm = UserFormValues & {
  id?: string;
};

interface UserFormProps {
  initialData?: UserForForm; // For editing existing users, includes ID
  onSubmit: (data: UserFormValues) => void; // onSubmit receives validated form data
  isLoading?: boolean;
  isEditMode?: boolean; // New prop to differentiate create/edit forms for labels/validation
}

export function UserForm({ initialData, onSubmit, isLoading, isEditMode = false }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: initialData?.username || "",
      email: initialData?.email || "",
      password: "", // Never pre-fill passwords
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      profileImageUrl: initialData?.profileImageUrl || "",
      phone: initialData?.phone || "",
      // Convert Date object to YYYY-MM-DD string for input type="date"
      dateOfBirth: initialData?.dateOfBirth ? initialData.dateOfBirth: undefined,
      nationality: initialData?.nationality || "",
      gender: initialData?.gender || undefined,
      bio: initialData?.bio || "",
      avatarUrl: initialData?.avatarUrl || "",
      preferredLanguage: initialData?.preferredLanguage || undefined,
      timezone: initialData?.timezone || "",
    },
    mode: "onChange", // Validate on change for better UX
  });

  // Dynamically set password field as required only for create mode if it's empty
  useEffect(() => {
    if (!isEditMode) {
      form.clearErrors("password"); // Clear password error if it's optional for edit
      form.register("password", {
        required: "Password is required for new users.",
        minLength: { value: 6, message: "Password must be at least 6 characters." },
      });
    } else {
      // If in edit mode and password field is empty, it's not required
      form.unregister("password");
    }
  }, [isEditMode, form]);


  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <Input id="username" {...form.register("username")} />
        {form.formState.errors.username && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password {isEditMode ? "(Leave blank to keep current)" : ""}
        </label>
        <Input id="password" type="password" {...form.register("password")} />
        {form.formState.errors.password && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <Input id="firstName" {...form.register("firstName")} />
          {form.formState.errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <Input id="lastName" {...form.register("lastName")} />
          {form.formState.errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="profileImageUrl" className="block text-sm font-medium text-gray-700">
          Profile Image URL
        </label>
        <Input id="profileImageUrl" type="url" {...form.register("profileImageUrl")} />
        {form.formState.errors.profileImageUrl && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.profileImageUrl.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <Input id="phone" type="tel" {...form.register("phone")} />
        {form.formState.errors.phone && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth
        </label>
        <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
        {form.formState.errors.dateOfBirth && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.dateOfBirth.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
          Nationality
        </label>
        <Input id="nationality" {...form.register("nationality")} />
        {form.formState.errors.nationality && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.nationality.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <Select
          value={form.watch("gender") || ""} // Default to empty string for Select to show placeholder
          onValueChange={(value) => form.setValue("gender", value as Gender)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select gender (optional)" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Gender).map((gender) => (
              <SelectItem key={gender} value={gender}>
                {gender}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.gender && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.gender.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        {/* Assuming `Input` component can handle multiline or you have a `Textarea` component */}
        <textarea
          id="bio"
          {...form.register("bio")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
        />
        {form.formState.errors.bio && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.bio.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">
          Avatar URL
        </label>
        <Input id="avatarUrl" type="url" {...form.register("avatarUrl")} />
        {form.formState.errors.avatarUrl && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.avatarUrl.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
          Preferred Language
        </label>
        <Select
          value={form.watch("preferredLanguage") || ""}
          onValueChange={(value) => form.setValue("preferredLanguage", value as SupportedLanguage)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language (optional)" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SupportedLanguage).map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.preferredLanguage && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.preferredLanguage.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
          Timezone
        </label>
        <Input id="timezone" {...form.register("timezone")} />
        {form.formState.errors.timezone && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.timezone.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Create User"}
      </Button>
    </form>
  );
}
