// app/(dashboard)/league/create/page.tsx
"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LeagueForm } from '@/components/forms/league-form'; // Adjust path as needed
import { AccessGate } from '@/app/(auth)/AccessGate';
import { Role } from '@/schemas'; // Adjust path to your Role enum
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function CreateleaguePage() {
  const router = useRouter();
  const { user: userAuth } = useAuthStore();

  const handleSuccess = (leagueId: string) => {
    toast.success(`League ${leagueId} created successfully!`);
    // Redirect to the leagues listing page, or the newly created league's detail page
    ///Redirect to league listing based on user role
    const currentUserRoles = userAuth?.roles || [];
    
    const isSystemAdmin = currentUserRoles.includes(Role.SYSTEM_ADMIN);
    const isTenantAdmin = currentUserRoles.includes(Role.TENANT_ADMIN);
    
    const redirectPath = isSystemAdmin ? "/admin/leagues":
                         isTenantAdmin ? "/tenant/leagues" :
                         "/leagues"; // Default fallback path  
    router.push(redirectPath); // Example: redirect to admin leagues list
  };

  const handleCancel = () => {
    router.back(); // Go back to the previous page
  };

  return (
    <div className="mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New league</h1>
      <div>
        {/* AccessGate to restrict who can access this creation form */}
        <AccessGate allowedRoles={[Role.SYSTEM_ADMIN, Role.TENANT_ADMIN]}>
          <LeagueForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </AccessGate>
      </div>
    </div>
  );
}
