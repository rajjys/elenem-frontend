// app/(app)/league/manage/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { MyLeagueDetailsDto } from '@/prisma'; // Create this shared DTO type
import { MyLeagueDetailsForm } from '@/components/forms/MyLeagueDetailsForm';
import { MyLeagueSettingsForm } from '@/components/forms/MyLeagueSettingsForm';
import { Role } from '@/prisma';

// Define MyLeagueDetailsDto in a shared types directory if not already, e.g., shared-types/league.dto.ts
// For now, defining a simplified version here:
/*
interface MyLeagueDetailsDto {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  leagueProfile?: any;
  pointsSystem?: any;
  tiebreakerRules?: any;
  // Add other fields returned by /leagues/my-league
}
*/


export default function ManageMyLeaguePage() {
  const { user, tokens } = useAuthStore();
  const [leagueDetails, setLeagueDetails] = useState<MyLeagueDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === Role.LEAGUE_ADMIN && user.leagueId && tokens?.accessToken) {
      const fetchLeagueDetails = async () => {
        setLoading(true);
        try {
          const response = await api.get<MyLeagueDetailsDto>('/leagues/my-league');
          setLeagueDetails(response.data);
          setError(null);
        } catch (err: any) {
          setError(err.response?.data?.message || "Failed to fetch league details.");
          setLeagueDetails(null);
        } finally {
          setLoading(false);
        }
      };
      fetchLeagueDetails();
    } else if (tokens?.accessToken && user && user.role !== Role.LEAGUE_ADMIN) {
        setError("Access Denied: You are not a League Administrator.");
        setLoading(false);
        ///* Optionally, you could redirect to a different page or show a more user-friendly message */
    } else if (!tokens?.accessToken) {
        // Middleware should handle this, but as a fallback:
        setError("Authentication required.");
        setLoading(false);
    }
  }, [user, tokens]);

  const handleDetailsUpdated = (updatedDetails: MyLeagueDetailsDto) => {
    setLeagueDetails(prev => ({ ...prev, ...updatedDetails } as MyLeagueDetailsDto));
  };

  const handleSettingsUpdated = (updatedSettings: Pick<MyLeagueDetailsDto, 'pointsSystem' | 'tiebreakerRules'>) => {
    setLeagueDetails(prev => ({ ...prev, ...updatedSettings } as MyLeagueDetailsDto));
  };

  if (loading) return <div className="p-6 text-center">Loading league management console...</div>;
  if (error) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-md">{error}</div>;
  if (!leagueDetails) return <div className="p-6 text-center">No league information available.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">General Settings: {leagueDetails.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your league's public information and operational settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* League Details Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">League Details</h2>
          <MyLeagueDetailsForm
            initialData={{
              name: leagueDetails.name,
              description: leagueDetails.description || '',
              logoUrl: leagueDetails.logoUrl || '',
              bannerImageUrl: leagueDetails.bannerImageUrl || '',
              leagueProfile: leagueDetails.leagueProfile || {},
            }}
            onSuccess={handleDetailsUpdated}
          />
        </div>
      </div>
    </div>
  );
}
