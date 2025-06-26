// app/admin/leagues/create/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeagueForm } from '@/components/forms/league-form';
import { toast } from 'sonner';
import { Role } from '@/prisma/'; // Assuming Role enum is exported from prisma
import { useAuthStore } from '@/store/auth.store';
//import { useAuth } from '@/hooks/useAuth'; // Assuming you have an authentication hook to get user roles and tenantId

export default function CreateLeaguePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [currentUserRoles, setCurrentUserRoles] = useState<Role[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      setCurrentUserRoles(user.roles || []);
      setCurrentTenantId(user.tenantId || undefined);

      // Check for authorization: System Admin or Tenant Admin can create leagues
      const isAuthorized = user.roles.includes(Role.SYSTEM_ADMIN) || user.roles.includes(Role.TENANT_ADMIN);
      if (!isAuthorized) {
        toast.error("Unauthorized", { description: "You do not have permission to create leagues." });
        router.push('/dashboard'); // Redirect to a suitable page
      } else {
        setIsReady(true);
      }
    } else if (!user) {
      // User is not logged in or session expired
      toast.error("Authentication required", { description: "Please log in to create a league." });
      router.push('/login'); // Redirect to login page
    }
  }, [user, router]);


  const handleSuccess = (leagueId: string) => {
    toast.success('League created successfully!');
    router.push(`/admin/leagues/${leagueId}`); // Navigate to the new league's profile page
  };

  const handleCancel = () => {
    router.back(); // Go back to the previous page
  };

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user permissions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <LeagueForm
        currentUserRoles={currentUserRoles}
        currentTenantId={currentTenantId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}