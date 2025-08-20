// app/(dashboard)/season/create/page.tsx
"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AccessGate } from '@/app/(auth)/AccessGate';
import { Roles } from '@/schemas'; // Adjust path to your Role enum
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { GameForm } from '@/components/forms';

export default function CreateGamePage() {
  const router = useRouter();
  ///Redirect to season listing based on user role
    const { user: userAuth } = useAuthStore();
      const currentUserRoles = userAuth?.roles || [];
    
      const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
      const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
      const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);
    
    const redirectPath = isSystemAdmin ? "/admin/games":
                         isTenantAdmin ? "/tenant/games" :
                         isLeagueAdmin ? "/league/games" :
                         "/games"; // Default fallback path  

  const handleSuccess = useCallback((seasonId: string) => {
    toast.success(`Game ${seasonId} created successfully!`);
    router.push(redirectPath); // Example: redirect to admin seasons list
  }, [router, redirectPath]);

  const handleCancel = useCallback(() => {
    router.back(); // Go back to the previous page
  }, [router]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create New Game</h1>

      {/* AccessGate to restrict who can access this creation form */}
      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN]}>
        <GameForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  );
}
