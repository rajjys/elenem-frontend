// app/(admin)/users/[userId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { UserDetail, UserDetailSchema, UpdateUserDto, UpdateUserSchema } from '@/prisma/user-schemas'; // Import UserDetail and its schema, plus UpdateUserDto
import { UserForForm, UserForm, UserFormValues } from '@/components/forms/user-form'; // Import the reusable user form
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'; // For notifications

interface UserDetailPageProps {
  params: {
    userId: string; // The user ID will be extracted from the URL path
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const router = useRouter();
  const { userId } = params;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to fetch user details
  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/system-admin/users/${userId}`); // GET /admin/users/:id
      console.log(response.data);
      const validatedUser = response.data; // Validate with Zod
      setUser(validatedUser);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch user details.";
      setError(errorMessage);
      toast.error("Error loading user", { description: errorMessage });
      console.error('Fetch user details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    } else {
      setError("User ID not provided.");
      setLoading(false);
    }
  }, [userId]); // Re-fetch if userId changes

  // Handle form submission for updating a user
  const handleUpdateUser = async (data: UserFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Prepare data for the API based on UpdateUserDto
      const payload: UpdateUserDto = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        profileImageUrl: data.profileImageUrl || undefined,
        phone: data.phone || undefined,
        // Ensure dateOfBirth is sent as ISO string if not null/undefined
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        nationality: data.nationality || undefined,
        gender: data.gender || undefined,
        bio: data.bio || undefined,
        //avatarUrl: data.avatarUrl || undefined,
        preferredLanguage: data.preferredLanguage || undefined,
        timezone: data.timezone || undefined,
        // isActive and isVerified can also be updated here if needed
        // password is handled separately or by a different endpoint
      };

      await api.put(`/system-admin/users/${userId}`, payload); // PUT /admin/users/:id
      toast.success("User updated successfully!");
      setIsEditMode(false); // Exit edit mode
      fetchUserDetails(); // Re-fetch updated data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update user.";
      setError(errorMessage);
      toast.error("Error updating user", { description: errorMessage });
      console.error('Update user error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logic for deleting a user (from UsersTable, but can also be here)
  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await api.delete(`/system-admin/users/${userId}`); // DELETE /admin/users/:id
      toast.success('User soft-deleted successfully.');
      router.push('/admin/users'); // Redirect back to user list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete user.';
      toast.error('Error deleting user', { description: errorMessage });
      console.error('Delete user error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">{error}</p>;
  }

  if (!user) {
    return <p className="text-center mt-8">User not found.</p>;
  }

  // Transform UserDetail to UserForForm for initialData prop
  const userForForm: UserForForm = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl || undefined,
    phone: user.phone || undefined,
    //dateOfBirth: user.dateOfBirth || undefined,
    nationality: user.nationality || undefined,
    gender: user.gender || undefined,
    bio: user.bio || undefined,
    avatarUrl: user.avatarUrl || undefined,
    preferredLanguage: user.preferredLanguage || undefined,
    timezone: user.timezone || undefined,
    password: "", // Always empty for security
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? `Edit User: ${user.username}` : `User Profile: ${user.username}`}
        </h1>
        <div className="space-x-4">
          {!isEditMode ? (
            <Button onClick={() => setIsEditMode(true)} disabled={isSubmitting}>
              Edit Profile
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={isSubmitting}>
              Cancel Edit
            </Button>
          )}
          <Button variant="danger" onClick={handleDeleteUser} disabled={isSubmitting}>
            Delete User
          </Button>
        </div>
      </div>

      {isEditMode ? (
        <UserForm
          initialData={userForForm}
          onSubmit={handleUpdateUser}
          isLoading={isSubmitting}
          isEditMode={true}
        />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            {user.profileImageUrl && (
              <img
                src={user.profileImageUrl}
                alt={`${user.username} Profile`}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-lg font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-gray-600">@{user.username}</p>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <p><span className="font-medium">Roles:</span> {user.roles.map(role => role.replace(/_/g, ' ')).join(', ')}</p>
          <p><span className="font-medium">Status:</span> {user.isActive ? 'Active' : 'Inactive'} / {user.isVerified ? 'Verified' : 'Unverified'}</p>
          {user.phone && <p><span className="font-medium">Phone:</span> {user.phone}</p>}
          {user.dateOfBirth && <p><span className="font-medium">Date of Birth:</span> {new Date(user.dateOfBirth).toLocaleDateString()}</p>}
          {user.nationality && <p><span className="font-medium">Nationality:</span> {user.nationality}</p>}
          {user.gender && <p><span className="font-medium">Gender:</span> {user.gender}</p>}
          {user.preferredLanguage && <p><span className="font-medium">Preferred Language:</span> {user.preferredLanguage}</p>}
          {user.timezone && <p><span className="font-medium">Timezone:</span> {user.timezone}</p>}
          {user.bio && (
            <div>
              <span className="font-medium">Bio:</span>
              <p className="whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}
          {user.tenantId && <p><span className="font-medium">Tenant ID:</span> {user.tenantId}</p>}
          {user.managingLeagueId && <p><span className="font-medium">Managing League ID:</span> {user.managingLeagueId}</p>}
          {user.managingTeamId && <p><span className="font-medium">Managing Team ID:</span> {user.managingTeamId}</p>}

          <div className="mt-6 border-t pt-4">
            <h3 className="text-xl font-semibold mb-2">Audit Information</h3>
            <p className="text-sm text-gray-500">Created At: {new Date(user.createdAt).toLocaleString()}</p>
            <p className="text-sm text-gray-500">Last Updated At: {new Date(user.updatedAt).toLocaleString()}</p>
            {user.lastLoginAt && <p className="text-sm text-gray-500">Last Login At: {new Date(user.lastLoginAt).toLocaleString()}</p>}
            {user.deletedAt && <p className="text-sm text-red-500">Deleted At: {new Date(user.deletedAt).toLocaleString()}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
