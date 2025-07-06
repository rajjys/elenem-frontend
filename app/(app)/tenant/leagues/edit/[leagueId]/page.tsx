// app/tenant/leagues/edit/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LeagueForm } from '@/components/forms/league-form'; // Adjust path if needed
import { api } from '@/services/api';
import { LeagueDetails, Role } from '@/prisma/'; // Adjust import path for LeagueDetails, Role
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function TenantEditLeaguePage() {
  const { leagueId: leagueId } = useParams<{ leagueId: string }>(); // Renamed from leagueId to id for Next.js dynamic routes
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [league, setLeague] = useState<LeagueDetails | null>(null);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isEditMode = true;

  useEffect(() => {
    if (!user) {
      toast.error("Authentication required", { description: "Please log in to edit a league." });
      //router.push('/login');
      return;
    }

    if (!leagueId) {
      setLoadingLeague(false);
      router.push('/tenant/leagues'); // Redirect if no ID
      return;
    }

    const fetchLeague = async () => {
      try {
        const response = await api.get<LeagueDetails>(`/leagues/${leagueId}`);
        const fetchedLeague = response.data;

        // Authorization check: Only TENANT_ADMIN can edit leagues within their tenant
        const canEdit = user.roles.includes(Role.TENANT_ADMIN) && user.tenantId === fetchedLeague.tenantId;

        if (!canEdit) {
          toast.error("Unauthorized", { description: "You do not have permission to edit this league or it does not belong to your tenant." });
          router.push('/dashboard');
          return;
        }

        setIsAuthorized(true); // User is authorized
        setLeague(fetchedLeague);
      } catch (error) {
        console.error('Failed to fetch league details:', error);
        toast.error("Failed to load league details.", { description: "League not found or access denied." });
        router.push('/tenant/leagues'); // Redirect to leagues list for the tenant
      } finally {
        setLoadingLeague(false);
      }
    };
    fetchLeague();
  }, [leagueId, user, router]);


  const handleSuccess = (updatedLeagueId: string) => {
    toast.success('League updated successfully!');
    router.push(`/league/${updatedLeagueId}`); // Navigate to the updated league's profile page
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingLeague || !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>{loadingLeague ? 'Loading league details...' : 'Checking permissions...'}</p>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>League not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit League: {league.name}</h1>
      <LeagueForm
        initialData={league}
        isEditMode={isEditMode}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        //fixedTenantId={user?.tenantId} // Pass the tenant ID to LeagueForm to disable selection
      />
    </div>
  );
}