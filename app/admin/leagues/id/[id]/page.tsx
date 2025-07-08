// app/(admin)/leagues/[id]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SportType } from '@/schemas';
// import { SportType, User as PrismaUser } from "@prisma/client"; // Import User for owner type


interface LeagueDetails {
  id: string;
  name: string;
  leagueCode: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  sportType: SportType; // Adjust based on your enum
  status: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId?: string | null;
  owner?: { id: string; username: string; email: string } | null; // Include owner details
  pointsSystem?: any; // JSON object
  tiebreakerRules?: any; // JSON object or array
  // Add other fields as needed from your Prisma schema
}

export default function ViewLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [league, setLeague] = useState<LeagueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  useEffect(() => {
    if (id) {
      const fetchLeague = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/system-admin/leagues/${id}`);
          setLeague(response.data);
          setError(null);
        } catch (err: any) {
          setError(err.response?.data?.message || "Failed to fetch league details.");
          setLeague(null);
        } finally {
          setLoading(false);
        }
      };
      fetchLeague();
    }
  }, [id]);

  const handleDeleteLeague = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/system-admin/leagues/${id}`);
      setShowDeleteModal(false);
      // Add success toast/notification
      router.push('/admin/leagues');
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete league.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading league details...</div>;
  if (error && !league) return <div className="text-center py-10 text-red-500 bg-red-50 p-4 rounded-md">Error: {error}</div>;
  if (!league) return <div className="text-center py-10">League not found.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{league.name}</h1>
          <p className="text-sm text-gray-500">League Code: {league.leagueCode}</p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/admin/leagues/id/${id}/edit`}>
            <Button variant="secondary">Edit League</Button>
          </Link>
           <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete League</Button>
        </div>
      </div>

      {error && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded">{error}</p>}

      {league.bannerImageUrl && (
        <img src={league.bannerImageUrl} alt={`${league.name} banner`} className="w-full h-48 object-cover rounded-md mb-6" 
             onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {league.logoUrl && (
            <img src={league.logoUrl} alt={`${league.name} logo`} className="w-32 h-32 object-contain rounded-md mb-4 border"
                 onError={(e) => (e.currentTarget.style.display = 'none')} />
          )}
          <p className="text-gray-700"><strong className="font-semibold">Sport Type:</strong> {league.sportType}</p>
          <p className="text-gray-700"><strong className="font-semibold">Status:</strong>
            <span className={`ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${league.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {league.status ? 'Active' : 'Inactive'}
            </span>
          </p>
          {league.owner && (
            <p className="text-gray-700"><strong className="font-semibold">Owner:</strong> {league.owner.username} ({league.owner.email})</p>
          )}
          <p className="text-gray-700"><strong className="font-semibold">Created:</strong> {new Date(league.createdAt).toLocaleDateString()}</p>
          <p className="text-gray-700"><strong className="font-semibold">Last Updated:</strong> {new Date(league.updatedAt).toLocaleDateString()}</p>
        </div>
        <div>
          {league.description && (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">Description</h2>
              <p className="text-gray-600 prose max-w-none">{league.description}</p>
            </>
          )}
        </div>
      </div>

      {league.pointsSystem && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Points System</h2>
          <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(league.pointsSystem, null, 2)}
          </pre>
        </div>
      )}

      {league.tiebreakerRules && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Tiebreaker Rules</h2>
          <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(league.tiebreakerRules, null, 2)}
          </pre>
        </div>
      )}
       {/* Delete Confirmation Modal */}
      {/* <Modal // Basic Modal component from components/ui/modal.tsx
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        onConfirm={handleDeleteLeague}
        confirmText="Delete"
        isConfirming={isDeleting}
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete the league "{league.name}"? This action cannot be undone.
        </p>
      </Modal> */}
    </div>
  );
}
