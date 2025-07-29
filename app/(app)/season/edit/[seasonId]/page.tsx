// app/(dashboard)/season/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SeasonForm } from '@/components/forms/season-form'; // Adjust path as needed
import { AccessGate } from '@/app/(auth)/AccessGate';
import { Role } from '@/schemas'; // Adjust path to your Role enum
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Assuming this path
import { toast } from 'sonner';
import { api } from '@/services/api'; // Your actual API instance
import { SeasonResponseDto } from '@/schemas/season-schemas'; // Your SeasonBasic type

export default function EditSeasonPage() {
  const router = useRouter();
  //const params = useParams();
  //const seasonId = params.seasonId; // Get the season ID from the URL
  const { seasonId } = useParams<{ seasonId: string }>();

  const [initialData, setInitialData] = useState<SeasonResponseDto | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch season data when the component mounts or seasonId changes
  useEffect(() => {
    const fetchSeasonData = async () => {
      if (!seasonId) {
        setError("Season ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/seasons/${seasonId}`); // Assuming API endpoint for fetching a single season
        // Assuming the API returns a SeasonBasic object directly
        setInitialData({
          ...response.data,
          // Ensure dates are Date objects if your SeasonForm expects them as such
          // Or format them to string if your form uses string dates for input type="date"
          
        });
      } catch (error) {
        const errorMessage = 'Failed to fetch season data.';
        setError(errorMessage);
        toast.error('Error loading season', { description: errorMessage });
        console.error('Fetch season error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonData();
  }, [seasonId]);

  const handleSuccess = useCallback((updatedSeasonId: string) => {
    toast.success(`Season ${updatedSeasonId} updated successfully!`);
    router.push('/admin/seasons'); // Redirect to seasons listing page
  }, [router]);

  const handleCancel = useCallback(() => {
    router.back(); // Go back to the previous page
  }, [router]);

  if (loading) {
    return <LoadingSpinner message="Loading season data..." />;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">Error: {error}</p>;
  }

  if (!initialData) {
    return <p className="text-center text-gray-500 mt-8">Season not found or no data available.</p>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Edit Season</h1>

      {/* AccessGate to restrict who can access this edit form */}
      <AccessGate allowedRoles={[Role.SYSTEM_ADMIN, Role.TENANT_ADMIN, Role.LEAGUE_ADMIN]}>
        <SeasonForm initialData={initialData} onSuccess={handleSuccess} onCancel={handleCancel} />
      </AccessGate>
    </div>
  );
}
