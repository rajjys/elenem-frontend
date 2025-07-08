// app/tenant/leagues/create/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeagueForm } from '@/components/forms/league-form'; // Adjust path if needed
import { toast } from 'sonner';
import { Role } from '@/schemas'; // Assuming Role enum is exported from prisma
import { useAuthStore } from '@/store/auth.store';

export default function TenantCreateLeaguePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user); // Get user from auth store

  const [isReady, setIsReady] = useState(false);
  ///const [tenantIdForForm, setTenantIdForForm] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (user) {
      // In the tenant context, only TENANT_ADMIN can create leagues for their tenant
      const isAuthorized = user.roles.includes(Role.TENANT_ADMIN) && user.tenantId;

      if (!isAuthorized) {
        toast.error("Unauthorized", { description: "You do not have permission to create leagues for this tenant." });
        router.push('/dashboard'); // Redirect to a suitable page
      } else {
        //setTenantIdForForm(user.tenantId); // Set the tenantId to be passed to the form
        setIsReady(true);
      }
    } else {
      toast.error("Authentication required", { description: "Please log in to create a league." });
      router.push('/login'); // Redirect to login page
    }
  }, [user, router]);

  const handleSuccess = (leagueId: string) => {
    toast.success('League created successfully!');
    // Navigate to the new league's profile page within the tenant context
    router.push(`/league/${leagueId}`); // As per previous instruction, league details are /league/[leagueId]
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New League</h1>
      <LeagueForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        //fixedTenantId={tenantIdForForm} // Pass the tenant ID directly to LeagueForm
      />
    </div>
  );
}