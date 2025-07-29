// app/(dashboard)/season/create/page.tsx
"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SeasonForm } from '@/components/forms/season-form'; // Adjust path as needed
import { AccessGate } from '@/app/(auth)/AccessGate';
import { Role } from '@/schemas'; // Adjust path to your Role enum
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function CreateSeasonPage() {
  const router = useRouter();
  const { user: userAuth } = useAuthStore();
  const handleSuccess = useCallback((seasonId: string) => {
    toast.success(`Season ${seasonId} created successfully!`);
    // Redirect to the seasons listing page, or the newly created season's detail page
    ///Redirect to season listing based on user role
    const currentUserRoles = userAuth?.roles || [];
    
    const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
    const isLeagueAdmin = currentUserRoles.includes(Role.LEAGUE_ADMIN);
    
    const redirectPath = isSystemAdmin ? "/admin/seasons":
                         isTenantAdmin ? "/tenant/seasons" :
                         isLeagueAdmin ? "/league/seasons" :
                         "/seasons"; // Default fallback path  
    router.push(redirectPath); // Example: redirect to admin seasons list
  }, [router]);

  const handleCancel = useCallback(() => {
    router.back(); // Go back to the previous page
  }, [router]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Season</h1>

      {/* AccessGate to restrict who can access this creation form */}
      <AccessGate allowedRoles={[Role.SYSTEM_ADMIN, Role.TENANT_ADMIN, Role.LEAGUE_ADMIN]}>
        <SeasonForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  );
}
