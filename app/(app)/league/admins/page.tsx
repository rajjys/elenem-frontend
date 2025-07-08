
// app/(app)/league/admins/page.tsx
"use client";
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/schemas';
import { InviteLeagueAdminForm } from '@/components/forms/InviteLeagueAdminForm';
import { LeagueAdminsTable } from '@/components/league/LeagueAdminsTable';

interface AdminUser { // Define this type, perhaps in a shared types file
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export default function ManageLeagueAdminsPage() {
  const { user, tokens } = useAuthStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null); // For errors from actions like remove/invite

  const fetchAdmins = useCallback(async () => {
    if (user?.role === Role.LEAGUE_ADMIN && user.leagueId && tokens?.accessToken) {
      setLoading(true);
      try {
        const response = await api.get<AdminUser[]>('/leagues/my-league/admins');
        setAdmins(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch league administrators.");
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    }
  }, [user, tokens]);

  useEffect(() => {
    if (user?.role === Role.LEAGUE_ADMIN && user.leagueId) {
        fetchAdmins();
    } else if (tokens?.accessToken && user && user.role !== Role.LEAGUE_ADMIN) {
        setError("Access Denied: You are not a League Administrator.");
        setLoading(false);
    } else if (!tokens?.accessToken) {
        setError("Authentication required.");
        setLoading(false);
    }
  }, [user, tokens, fetchAdmins]);

  const handleInviteSuccess = (newAdmin: AdminUser) => {
    // Add new admin to the list or re-fetch
    // setAdmins(prevAdmins => [...prevAdmins, newAdmin]);
    fetchAdmins(); // Re-fetch to get the most up-to-date list
    setActionError(null);
  };

  const handleAdminRemoved = (removedAdminId: string) => {
    // setAdmins(prevAdmins => prevAdmins.filter(admin => admin.id !== removedAdminId));
    fetchAdmins(); // Re-fetch
    setActionError(null);
  };
  
  const handleActionError = (errorMessage: string) => {
    setActionError(errorMessage);
    setTimeout(() => setActionError(null), 5000); // Clear error after some time
  }

  if (loading && admins.length === 0) return <div className="p-6 text-center">Loading league administrators...</div>;
  if (error) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-md">{error}</div>;
  if (!user || user.role !== Role.LEAGUE_ADMIN) return <div className="p-6 text-center">Access Denied.</div>;


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage League Administrators</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invite new administrators or manage existing ones for your league.
        </p>
      </div>

      {actionError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm mb-4">{actionError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Administrators</h2>
          {loading && admins.length > 0 && <p>Refreshing admin list...</p>}
          <LeagueAdminsTable 
            admins={admins} 
            currentUserId={user.id} 
            onAdminRemoved={handleAdminRemoved}
            onRemoveError={handleActionError}
          />
        </div>
        <div>
          <InviteLeagueAdminForm onInviteSuccess={handleInviteSuccess} />
        </div>
      </div>
    </div>
  );
}
