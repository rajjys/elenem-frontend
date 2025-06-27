// app/(admin)/users/create/page.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserForm } from '@/components/forms/user-form';
import { toast } from 'sonner';

export default function CreateUserPage() {
  const router = useRouter();

  const handleSuccess = (userId: string) => {
    toast.success('User created successfully!');
    router.push(`/admin/users/${userId}`); // Redirect to new user's profile
  };

  const handleCancel = () => {
    router.push('/admin/users'); // Go back to the users list
  };

  return (
    <div className="container mx-auto py-8">
      <UserForm
        isEditMode={false}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
