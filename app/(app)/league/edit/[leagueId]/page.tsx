"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LeagueForm } from "@/components/forms/league/league-form";
import { api } from "@/services/api";
import { LeagueDetails, Roles } from "@/schemas";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { LoadingSpinner } from "@/components/ui";
import { AccessGate } from "@/app/(auth)/AccessGate";

export default function EditLeaguePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const router = useRouter();
  const { user: userAuth } = useAuthStore();

  const [league, setLeague] = useState<LeagueDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) {
      toast.error("No league ID provided.");
      //router.push("/leagues");
      return;
    }
    const fetchLeague = async () => {
      try {
        const response = await api.get<LeagueDetails>(`/leagues/${leagueId}`);
        setLeague(response.data);
      } catch (error) {
        toast.error("Failed to load league.", { description: "League not found or access denied." });
        console.error("Error fetching league:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeague();
  }, [leagueId, router]);

  const handleSuccess = (leagueId: string) => {
      toast.success(`League ${leagueId} updated successfully!`);
      // Redirect to the leagues listing page, or the newly created league's detail page
      ///Redirect to league listing based on user role
      const currentUserRoles = userAuth?.roles || [];
      const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
      const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
      const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN)
      const redirectPath = isSystemAdmin ? "/admin/leagues":
                           isTenantAdmin ? "/tenant/leagues" :
                           isLeagueAdmin ? "/league/dashboard":
                           "/leagues"; // Default fallback path 
      router.push(redirectPath); // Example: redirect to admin leagues list
    };

  const handleCancel = () => {
      router.back(); // Go back to the previous page
    };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner message="Please Wait"/>\
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
    <div className="mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Edit League: {league.name}
      </h1>
      <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN]}>
        <LeagueForm
            initialData={league}
            isEditMode={true}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
      </AccessGate>
    </div>
  );
}