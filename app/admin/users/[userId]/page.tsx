// app/(admin)/users/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { Role, UserDetail } from '@/schemas';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const userAuth = useAuthStore((state) => state.user); // Get user from auth store

  const [profileUser, setProfileUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  const currentUserRoles = userAuth?.roles || [];
  const currentUsersTenantId = userAuth?.tenantId;
  const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Role.LEAGUE_ADMIN);

  useEffect(() => {
    if (userAuth === undefined) {
      return; // Still loading auth state
    }

    if (userAuth === null) {
      toast.error("Authentication required", { description: "Please log in to view user profiles." });
      //router.push('/login');
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get<UserDetail>(`/users/${userId}`); // Use /users endpoint
        console.log(response.data);
        const fetchedUser = response.data;
        setProfileUser(fetchedUser);

        // Determine if current user can edit this profile based on roles and tenant context
        let userCanEdit = false;
        if (isSystemAdmin) {
          userCanEdit = true;
        } else if (isTenantAdmin && fetchedUser.tenantId === currentUsersTenantId) {
          userCanEdit = true;
        } else if (isLeagueAdmin && fetchedUser.managingLeagueId === userAuth.managingLeagueId) {
          // This logic assumes League Admin can edit users specifically managed by their league.
          // Adjust if League Admin can only edit users within their tenant, etc.
          userCanEdit = true;
        } else if (fetchedUser.id === userAuth.id) { // User can always edit their own profile
          userCanEdit = true;
        }
        setCanEdit(userCanEdit);

      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error("Failed to load user profile.", { description: "User not found or access denied." });
        //router.push('/admin/users'); // Redirect to user list
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      setLoading(false);
      router.push('/admin/users'); // Redirect if no ID
    }
  }, [userId, userAuth, router, isSystemAdmin, isTenantAdmin, isLeagueAdmin, currentUsersTenantId]);

  if (loading || userAuth === undefined) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (userAuth === null || !profileUser) {
    return null; // Redirect already handled or user not found
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">{profileUser.username}</CardTitle>
              <CardDescription className="text-gray-600 mt-1">{profileUser.email}</CardDescription>
            </div>
            {canEdit && (
              <Button onClick={() => router.push(`/admin/users/edit/${profileUser.id}`)} variant="default">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profileUser.avatarUrl && (
            <img src={profileUser.avatarUrl} alt={`${profileUser.username}'s avatar`} className="w-24 h-24 object-cover rounded-full border-2 border-gray-200 mb-4" />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-lg font-semibold">{profileUser.firstName} {profileUser.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={profileUser.isActive ? "success" : "destructive"}>
                {profileUser.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Verified</p>
              <Badge variant={profileUser.isVerified ? "success" : "destructive"}>
                {profileUser.isVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            {profileUser.tenantId && (
              <div>
                <p className="text-sm font-medium text-gray-500">Tenant</p>
                <p className="text-lg font-semibold">
                  {/* If UserDetail doesn't include tenant name, you might need to fetch it */}
                  {profileUser.tenant?.name} {/* Display ID, or fetch name if needed */}
                </p>
              </div>
            )}
            {profileUser.phone && (
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-lg font-semibold">{profileUser.phone}</p>
              </div>
            )}
            {profileUser.dateOfBirth && (
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="text-lg font-semibold">{new Date(profileUser.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}
            {profileUser.nationality && (
              <div>
                <p className="text-sm font-medium text-gray-500">Nationality</p>
                <p className="text-lg font-semibold">{profileUser.nationality}</p>
              </div>
            )}
            {profileUser.gender && (
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-lg font-semibold">{profileUser.gender}</p>
              </div>
            )}
            {profileUser.preferredLanguage && (
              <div>
                <p className="text-sm font-medium text-gray-500">Preferred Language</p>
                <p className="text-lg font-semibold">{profileUser.preferredLanguage}</p>
              </div>
            )}
            {profileUser.timezone && (
              <div>
                <p className="text-sm font-medium text-gray-500">Timezone</p>
                <p className="text-lg font-semibold">{profileUser.timezone}</p>
              </div>
            )}
          </div>

          {profileUser.bio && (
            <div>
              <p className="text-sm font-medium text-gray-500">Bio</p>
              <p className="text-base text-gray-800">{profileUser.bio}</p>
            </div>
          )}

          <div className="text-sm text-gray-500 mt-6 border-t pt-4">
            <p>Created At: {new Date(profileUser.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(profileUser.updatedAt).toLocaleString()}</p>
            {profileUser.lastLoginAt && <p>Last Login: {new Date(profileUser.lastLoginAt).toLocaleString()}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
