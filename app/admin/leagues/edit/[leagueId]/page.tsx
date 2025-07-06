// app/admin/leagues/edit/[id]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LeagueForm } from '@/components/forms/league-form';
import { api } from '@/services/api';
import { LeagueDetails, Role } from '@/prisma/'; // Adjust import path
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function EditLeaguePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [league, setLeague] = useState<LeagueDetails | null>(null);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [currentUserRoles, setCurrentUserRoles] = useState<Role[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | undefined>(undefined);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isEditMode = true; //This is an edit page

  useEffect(() => {
    if (user) {
      setCurrentUserRoles(user.roles || []);

      const canEdit = user.roles.includes(Role.SYSTEM_ADMIN) || user.roles.includes(Role.TENANT_ADMIN);
      setIsAuthorized(canEdit);

      if (!canEdit) {
        toast.error("Unauthorized", { description: "You do not have permission to edit leagues." });
        router.push('/dashboard');
        return;
      }

      // Fetch league details if authorized
      if (leagueId) {
        const fetchLeague = async () => {
          try {
            const response = await api.get<LeagueDetails>(`/leagues/${leagueId}`);
            // Security check: If Tenant Admin, ensure the league belongs to their tenant
            if (user.roles.includes(Role.TENANT_ADMIN) && response.data.tenantId !== user.tenantId) {
              toast.error("Unauthorized", { description: "You can only edit leagues within your tenant." });
              router.push('/dashboard');
              return;
            }
            setLeague(response.data);
            setCurrentTenantId(response.data.tenantId || undefined);
          } catch (error) {
            console.error('Failed to fetch league details:', error);
            toast.error("Failed to load league details.", { description: "League not found or access denied." });
            router.push('/admin/leagues'); // Redirect to leagues list
          } finally {
            setLoadingLeague(false);
          }
        };
        fetchLeague();
      } else {
        setLoadingLeague(false);
        router.push('/admin/leagues'); // Redirect if no ID
      }
    } else if (!user) {
      ///this is handled by the middleware but you can uncomment this if you want to redirect to login
      toast.error("Authentication required", { description: "Please log in to edit a league." });
      //router.push('/login');
    }
  }, [leagueId, user, router]);


  const handleSuccess = (leagueId: string) => {
    toast.success('League updated successfully!');
    router.push(`/admin/leagues/${leagueId}`); // Navigate to the updated league's profile page
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingLeague || !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>{!isAuthorized ? 'Checking permissions...' : 'Loading league details...'}</p>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>League not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <LeagueForm
        initialData={league}
        isEditMode={isEditMode}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}