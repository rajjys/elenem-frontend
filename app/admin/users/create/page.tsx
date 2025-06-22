// app/(admin)/users/create/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserForm, UserFormValues } from '@/components/forms/user-form';
import { CreateUserDto, CreateUserSchema } from '@/prisma/user-schemas'; // Import CreateUserDto
import { api } from '@/services/api';
import { Button } from '@/components/ui/button'; // Assuming Button component
import { toast } from 'sonner'; // For notifications

export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure password is included for creation
      if (!data.password) {
        throw new Error("Password is required for new user creation.");
      }

      // Transform Date object back to ISO string for backend
      const payload: CreateUserDto = {
        username: data.username,
        email: data.email,
        password: data.password, // This will be hashed on the backend
        firstName: data.firstName,
        lastName: data.lastName,
        profileImageUrl: data.profileImageUrl || undefined,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        nationality: data.nationality || undefined,
        gender: data.gender || undefined,
        bio: data.bio || undefined,
        //avatarUrl: data.avatarUrl || undefined,
        preferredLanguage: data.preferredLanguage || undefined,
        timezone: data.timezone || undefined,
        // Roles will be assigned by the backend for this endpoint (e.g., GENERAL_USER by default, or specific roles if your backend DTO supports it for admin creation)
        // For SystemAdmin, if roles array is part of CreateSystemUserDto, you'd include it here.
        // Based on backend CreateSystemUserDto: `roles` is directly in DTO, so we will pass it.
        // Assuming this form is *only* for SYSTEM_ADMIN to create basic users initially, roles might not be selected here.
        // If SYSTEM_ADMIN can select roles here, you'd need to add `roles: z.array(z.nativeEnum(Role)).optional()` to UserFormValues
        // and add a MultiSelect for roles in the form. For now, sticking to the profile fields.
      };

      // You might need to add `roles` to this payload if your backend's CreateSystemUserDto expects it.
      // E.g., payload.roles = [Role.GENERAL_USER]; or passed from a role picker in a future enhancement.
      // Based on your `CreateSystemUserDto` from previous prompt, `roles` is a field.
      // For a SYSTEM_ADMIN creating a user, they should be able to assign an initial role.
      // I'll update CreateUserSchema and UserForm to include a basic role selection for SYSTEM_ADMIN if needed.
      // For now, let's assume default role is handled by backend or user selects only GENERAL_USER.

      const response = await api.post('/system-admin/users', payload); // POST /admin/users
      toast.success(`User '${response.data.username}' created successfully!`);
      router.push('/admin/users'); // Redirect to user list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create user.';
      toast.error('Error creating user', { description: errorMessage });
      console.error('Create user error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users'); // Go back to the users list
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
      <UserForm onSubmit={handleCreateUser} isLoading={isSubmitting} isEditMode={false} />
    </div>
  );
}
