// components/league/TeamAdminsManager.tsx
"use client";
import { useState } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TeamManagerFrontendDto, UserForAssignmentDto } from '@/prisma'
// import { Modal } from '@/components/ui/modal';

interface TeamAdminsManagerProps {
  teamId: string;
  currentAdmins: TeamManagerFrontendDto[];
  assignableUsers: UserForAssignmentDto[]; // Users in the league who can be assigned
  onAdminAssigned: (admin: any) => void;
  onAdminUnassigned: (adminId: string) => void;
}

export function TeamAdminsManager({ teamId, currentAdmins, assignableUsers, onAdminAssigned, onAdminUnassigned }: TeamAdminsManagerProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isLoadingAssign, setIsLoadingAssign] = useState(false);
  const [isLoadingUnassign, setIsLoadingUnassign] = useState<string | null>(null); // Store ID of user being unassigned
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // const [userToUnassign, setUserToUnassign] = useState<TeamManagerFrontendDto | null>(null);


  const handleAssignAdmin = async () => {
    if (!selectedUserId) {
      setError("Please select a user to assign as admin.");
      return;
    }
    setIsLoadingAssign(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post(`/teams/league-admin/${teamId}/assign-admin`, { userId: selectedUserId });
      onAdminAssigned(response.data);
      setSuccess(`${response.data.username} assigned as Team Admin.`);
      setSelectedUserId(''); // Reset select
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign admin.");
    } finally {
      setIsLoadingAssign(false);
    }
  };

  const handleUnassignAdmin = async (userIdToUnassign: string) => {
    // setUserToUnassign(null);
    setIsLoadingUnassign(userIdToUnassign);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/teams/league-admin/${teamId}/unassign-admin/${userIdToUnassign}`);
      onAdminUnassigned(userIdToUnassign);
      setSuccess(`Admin role removed successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to unassign admin.");
    } finally {
      setIsLoadingUnassign(null);
    }
  };
  
  // Filter out users who are already admins of THIS team or not suitable (e.g. already admin of another team if rule applies)
  const availableUsersForAssignment = assignableUsers.filter(
    u => !currentAdmins.some(admin => admin.id === u.id) && 
         (u.role !== 'TEAM_ADMIN' || !u.teamManagingId || u.teamManagingId === teamId) && // Can re-assign if they were TA of this team but got demoted
         u.role !== 'SYSTEM_ADMIN' // Cannot assign System Admin as Team Admin
  );


  const userOptions = availableUsersForAssignment.map(user => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName} (@${user.username}) - ${user.role}`,
  }));

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm">{error}</p>}
      {success && <p className="text-green-600 bg-green-100 p-2 rounded text-sm">{success}</p>}

      {/* Assign New Admin */}
      <div className="space-y-2">
        <Select
          label="Assign New Team Admin"
          options={userOptions}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={isLoadingAssign || userOptions.length === 0}
        />
         {userOptions.length === 0 && <p className="text-xs text-gray-500">No eligible users available for assignment.</p>}
        <Button onClick={handleAssignAdmin} isLoading={isLoadingAssign} disabled={isLoadingAssign || !selectedUserId}>
          Assign Admin
        </Button>
      </div>

      {/* Current Admins List */}
      <div>
        <h3 className="text-md font-medium text-gray-700 mb-2">Current Team Admins:</h3>
        {currentAdmins.length === 0 ? (
          <p className="text-sm text-gray-500">No administrators currently assigned to this team.</p>
        ) : (
          <ul className="divide-y divide-gray-200 border rounded-md">
            {currentAdmins.map(admin => (
              <li key={admin.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{admin.firstName} {admin.lastName}</p>
                  <p className="text-xs text-gray-500">@{admin.username}</p>
                </div>
                <Button
                  variant="danger"
                  //size="sm"
                  onClick={() => handleUnassignAdmin(admin.id) /*setUserToUnassign(admin)*/}
                  isLoading={isLoadingUnassign === admin.id}
                  disabled={!!isLoadingUnassign}
                >
                  Unassign
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* {userToUnassign && (
        <Modal
            isOpen={!!userToUnassign}
            onClose={() => setUserToUnassign(null)}
            title={`Confirm Unassign Admin`}
            onConfirm={() => handleUnassignAdmin(userToUnassign.id)}
            confirmText="Yes, Unassign"
            isConfirming={isLoadingUnassign === userToUnassign.id}
        >
            <p>Are you sure you want to remove {userToUnassign.firstName} {userToUnassign.lastName} as an admin for this team? Their role will be changed to General User.</p>
        </Modal>
      )} */}
    </div>
  );
}
