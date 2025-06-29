// app/(admin)/users/edit/[id]/page.tsx
"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserForm } from '@/components/forms/user-form';
import { toast } from 'sonner';

export default function EditUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const handleSuccess = (userId: string) => {
    toast.success('User updated successfully!');
    router.push(`/admin/users/${userId}`); // Redirect to updated user's profile
  };

  const handleCancel = () => {
    router.back(); // Go back to the previous page (likely user profile)
  };

  return (
    <div className="container mx-auto py-8">
      <UserForm
        userId={userId} // Pass the ID to the form for fetching initial data
        isEditMode={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
