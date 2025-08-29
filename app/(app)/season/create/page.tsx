// app/(dashboard)/season/create/page.tsx
"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SeasonForm } from '@/components/forms/season-form'; // Adjust path as needed
import { AccessGate } from '@/app/(auth)/AccessGate';
import { Roles, SeasonDetails } from '@/schemas'; // Adjust path to your Role enum
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function CreateSeasonPage() {
  const router = useRouter();
  const { user: userAuth } = useAuthStore();
  const currentUserRoles = userAuth?.roles || [];
    
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);
  const dashboardLink = isSystemAdmin ? "/admin/dashboard":
                         isTenantAdmin ? "/tenant/dashboard" :
                         isLeagueAdmin ? "/league/dashboard" :
                         "/account/dashboard"; // Default fallback path 
  const seasonsPageLink = isSystemAdmin ? "/admin/seasons":
                          isTenantAdmin ? "/tenant/seasons" :
                          isLeagueAdmin ? "/league/seasons" :
                          "/seasons"; // Default fallback path   
  const handleSuccess = useCallback((season: SeasonDetails) => {
    toast.success(`Season ${season.name} created successfully!`);
    router.push(seasonsPageLink); // Example: redirect to admin seasons list
  }, [seasonsPageLink, router]);

  const handleCancel = useCallback(() => {
    router.back(); // Go back to the previous page
  }, [router]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* AccessGate to restrict who can access this creation form */}
      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN]}>
        <SeasonForm onSuccess={handleSuccess} onCancel={handleCancel} dashboardLink={dashboardLink} seasonsPageLink={seasonsPageLink} />
      </AccessGate>
    </div>
  );
}
