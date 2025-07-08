// app/(app)/league/teams/[teamId]/edit/page.tsx (Edit Team for LA)
"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { TeamFormByLA } from '@/components/forms/TeamFormByLA';
import { TeamDetailsFrontendDto, UserForAssignmentDto } from '@/schemas';
import { TeamAdminsManager } from '@/components/league/TeamAdminsManager'; // We'll create this
import { Button } from '@/components/ui/button';
// import { Modal } from '@/components/ui/modal';

export default function EditTeamPageLA() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<TeamDetailsFrontendDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersInLeague, setUsersInLeague] = useState<UserForAssignmentDto[]>([]);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchTeamDetails = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      // LA endpoint to get specific team details
      const response = await api.get<TeamDetailsFrontendDto>(`/teams/league-admin/${teamId}`);
      setTeam(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch team details.");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);
  
  const fetchUsersInLeague = useCallback(async (leagueId: string) => {
    try {
        // This endpoint might need to be created or use an existing one from SystemAdmin/Users module if accessible to LA
        // For now, assuming an endpoint that LAs can use to list users in their league for assignment.
        // Or, it could be a general user list filtered by leagueId on the frontend if small.
        // Let's assume /users/profile can't be used for listing.
        // A new endpoint like /leagues/my-league/users-for-assignment might be needed.
        // For demo, we'll mock or assume it. If using SystemAdmin user list, LA needs access.
        // const response = await api.get(`/system-admin/users?leagueId=${leagueId}&role=GENERAL_USER&role=TEAM_ADMIN`); // Example
        //const response = await api.get(`/users/league-admin/list-assignable?leagueId=${leagueId}`); // Hypothetical endpoint
        const response = await api.get(`/leagues/my-league/general-users`)
        setUsersInLeague(response.data || []);
    } catch (err) {
        console.error("Failed to fetch users for assignment:", err);
        setUsersInLeague([]);
    }
  }, []);


  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  useEffect(() => {
    if (team?.leagueId) {
        fetchUsersInLeague(team.leagueId);
    }
  }, [team, fetchUsersInLeague]);
  
  const handleTeamUpdated = (updatedTeamData: TeamDetailsFrontendDto) => {
    setTeam(updatedTeamData); // Update local state after form success
  };

  const handleTeamAdminChange = () => {
    fetchTeamDetails(); // Re-fetch team details to update managers list
    fetchUsersInLeague(team!.leagueId); // Re-fetch users as their roles/assignments might change
  };
  
  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    setError(null);
    try {
        await api.delete(`/teams/league-admin/${teamId}`);
        setShowDeleteModal(false);
        router.push('/league/teams'); // Redirect to teams list
    } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete team.");
        setIsDeleting(false);
    }
  };


  if (loading) return <div className="p-6 text-center">Loading team details...</div>;
  if (error && !team) return <div className="p-6 text-center text-red-500 bg-red-50 rounded-md">{error}</div>;
  if (!team) return <div className="p-6 text-center">Team not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Edit Team: {team.name}</h1>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)} isLoading={isDeleting}>
            Delete Team
        </Button>
      </div>
       {error && <p className="text-red-500 bg-red-100 p-3 rounded text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Information</h2>
          <TeamFormByLA
            teamId={teamId}
            initialData={{
              name: team.name,
              logoUrl: team.logoUrl || '',
              bannerImageUrl: team.bannerImageUrl || '',
              description: team.description || '',
              homeVenue: team.homeVenue || '',
            }}
            onSuccess={handleTeamUpdated}
          />
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Team Admins</h2>
          <TeamAdminsManager 
            teamId={teamId} 
            currentAdmins={team.managers || []} 
            assignableUsers={usersInLeague}
            onAdminAssigned={handleTeamAdminChange}
            onAdminUnassigned={handleTeamAdminChange}
          />
        </div>
      </div>
      
      {/* Basic Delete Confirmation Modal */}
      {/* <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={`Delete Team: ${team.name}`}
        onConfirm={handleDeleteTeam}
        confirmText="Yes, Delete Team"
        isConfirming={isDeleting}
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete this team? This action will soft-delete the team and cannot be undone easily.
          Players and game associations might be affected.
        </p>
      </Modal> */}
    </div>
  );
}
