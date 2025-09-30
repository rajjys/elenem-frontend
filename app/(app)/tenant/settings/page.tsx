// src/app/tenant/settings/page.tsx
'use client';
import TenantGeneralSettings from "@/components/forms/tenant/settings/general-settings";
//import { TenantBusinessProfile } from './profile/page';
//import { TenantOwnership } from './ownership/page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/services/api";
import { LoadingSpinner } from '@/components/ui';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Roles, TenantDetails, TenantDetailsSchema } from '@/schemas';
import { useAuthStore } from '@/store/auth.store';
import axios from 'axios';
import { toast } from 'sonner';

export default function TenantSettingsPage() {
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]= useState<string | null>(null);
  
  const userAuth = useAuthStore((state) => state.user);
  const currentUserRoles = userAuth?.roles || [];
  const ctxTenantId = useSearchParams().get('ctxTenantId'); // Use search params if needed
      
      // Determine current tenant ID based on user roles
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
      
  const currentTenantId = isSystemAdmin
      ? ctxTenantId
      : isTenantAdmin
      ? userAuth?.tenantId
      : null;
  // 1. Fetch the full, existing Tenant data when the page loads
  const fetchTenantDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(`/tenants/${currentTenantId}`);
          const validatedTenant = TenantDetailsSchema.parse(response.data);
          setTenant(validatedTenant);
        } catch (error) {
            let errorMessage = "Failed to fetch tenant details.";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
          setLoading(false);
        }
      }, [currentTenantId]);
  
    useEffect(() => {
        // Fetch tenant-specific data if needed, e.g., tenant name, logo, etc.
        if (currentTenantId) {
            fetchTenantDetails();
        }
    }, [currentTenantId, fetchTenantDetails]);
  // The Tenant object now contains the full data for all three sections

  if(!tenant) return loading ? <LoadingSpinner message="Loading tenant settings..." /> : <div className="text-red-600 font-semibold">Error: {error || "Tenant not found or access denied."}</div>;
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Tenant Settings: {tenant?.name}</h1>
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {/* Pass the full initial data to the child component */}
          <TenantGeneralSettings tenant={tenant} /> 
        </TabsContent>
        
        {/**<TabsContent value="profile">
          <TenantBusinessProfile tenant={tenant} />
        </TabsContent>
        
        <TabsContent value="ownership">
          <TenantOwnership tenant={tenant} />
        </TabsContent>*/}
      </Tabs>
    </div>
  );
}