// app/(app)/team/manage/page.tsx (TA Manages Their Own Team)
"use client";
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { MyTeamProfileFormByTA } from '@/components/forms/MyTeamProfileFormByTA';
import { TeamDetailsFrontendDto } from '@/prisma';
import { Role } from '@/prisma';

export default function ManageMyTeamPage() {
  const { user, tokens } = useAuthStore();
  const [teamDetails, setTeamDetails] = useState<TeamDetailsFrontendDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyTeamDetails = useCallback(async () => {
    if (user?.role === Role.TEAM_ADMIN && user.teamManagingId && tokens?.accessToken) {
      setLoading(true);
      try {
        const response = await api.get<TeamDetailsFrontendDto>('/teams/my-team');
        setTeamDetails(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch your team details.");
        setTeamDetails(null);
      } finally {
        setLoading(false);
      }
    } else {
        setError("Access Denied: You are not a Team Administrator or not assigned to a team.");
        setLoading(false);
    }
  }, [user, tokens]);

  useEffect(() => {
    fetchMyTeamDetails();
  }, [fetchMyTeamDetails]);

  const handleProfileUpdated = (updatedTeamData: TeamDetailsFrontendDto) => {
    setTeamDetails(updatedTeamData);
  };

  if (loading) return <div className="p-6 text-center">Loading your team management console...</div>;
  if (error) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-md">{error}</div>;
  if (!teamDetails) return <div className="p-6 text-center">No team information available or you are not assigned to manage a team.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage My Team: {teamDetails.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your team's public profile information.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Profile</h2>
        <MyTeamProfileFormByTA
          initialData={{
            logoUrl: teamDetails.logoUrl || '',
            bannerImageUrl: teamDetails.bannerImageUrl || '',
            description: teamDetails.description || '',
            homeVenue: teamDetails.homeVenue || '',
          }}
          onSuccess={handleProfileUpdated}
        />
      </div>
      
      {/* Placeholder for other TA management sections */}
      {/* <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Roster Management</h2>
        <p className="text-gray-600">Coming soon: Manage your team's players.</p>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Schedule</h2>
        <p className="text-gray-600">Coming soon: View your team's upcoming games.</p>
      </div> */}
    </div>
  );
}
