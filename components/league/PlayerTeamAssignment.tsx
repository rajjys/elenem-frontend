// components/league/PlayerTeamAssignment.tsx
"use client";
import { useState } from 'react';
import { api } from '@/services/api';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlayerDetailsDto } from '@/prisma';
import { TeamDetailsFrontendDto } from '@/prisma';

interface PlayerTeamAssignmentProps {
  playerId: string;
  currentTeamId?: string | null;
  teamsInLeague: TeamDetailsFrontendDto[];
  onAssignmentChange: (updatedPlayerData: PlayerDetailsDto) => void;
}

export function PlayerTeamAssignment({ playerId, currentTeamId, teamsInLeague, onAssignmentChange }: PlayerTeamAssignmentProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeamId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const teamOptions = teamsInLeague.map(team => ({ value: team.id, label: team.name }));

  const handleAssignment = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.put<PlayerDetailsDto>(`/players/league-admin/${playerId}/assign-team`, {
        teamId: selectedTeamId || null, // Send null if un-assigning
      });
      setSuccess(`Player successfully ${selectedTeamId ? 'assigned to a team' : 'unassigned'}.`);
      onAssignmentChange(response.data); // Update parent state
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update team assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm">{error}</p>}
      {success && <p className="text-green-600 bg-green-100 p-2 rounded text-sm">{success}</p>}
      
      <Select
        label="Assign to Team"
        options={teamOptions}
        value={selectedTeamId}
        onChange={(e) => setSelectedTeamId(e.target.value)}
      />
      <p className="text-xs text-gray-500">Select an option to assign the player to a team, or select the blank option to make them a free agent.</p>
      <Button
        onClick={handleAssignment}
        isLoading={isLoading}
        disabled={isLoading || selectedTeamId === (currentTeamId || "")}
      >
        Update Assignment
      </Button>
    </div>
  );
}
