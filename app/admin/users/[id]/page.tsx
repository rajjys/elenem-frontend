// app/(admin)/users/[id]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// Make sure to import the correct User type from your Prisma client
import type { User } from '@/prisma';

interface UserDetails  {
  league?: { id: string; name: string; leagueCode: string } | null;
  createdBy?: Pick<User, 'id' | 'username'> | null;
  updatedBy?: Pick<User, 'id' | 'username'> | null;
  deletedBy?: Pick<User, 'id' | 'username'> | null;
}

export default function ViewUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          // Assuming your backend /system-admin/users/:id includes related data like league
          const response = await api.get(`/system-admin/users/${id}`);
          setUser(response.data);
          setError(null);
        } catch (err: any) {
          setError(err.response?.data?.message || "Failed to fetch user details.");
          setUser(null);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [id]);

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/system-admin/users/${id}`);
      setShowDeleteModal(false);
      router.push('admin/users');
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };


  if (loading) return <div className="text-center py-10">Loading user details...</div>;
  if (error && !user) return <div className="text-center py-10 text-red-500 bg-red-50 p-4 rounded-md">Error: {error}</div>;
  if (!user) return <div className="text-center py-10">User not found.</div>;

  const accountStatus = user.accountLocked ? 'Locked' : (user.deletedAt ? 'Deleted' : 'Active');
  const statusColor = user.accountLocked ? 'bg-red-100 text-red-800' : (user.deletedAt ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800');


  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-gray-500">@{user.username} - {user.email}</p>
        </div>
        <div className="flex space-x-2">
          <Link href={`admin/users/${id}/edit`}>
            <Button variant="secondary">Edit User</Button>
          </Link>
          {!user.deletedAt && (
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete User</Button>
          )}
        </div>
      </div>
      
      {error && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded">{error}</p>}

      {user.profileImageUrl && (
        <img src={user.profileImageUrl} alt={`${user.username} profile`} className="w-32 h-32 rounded-full object-cover mb-6 border-2 border-indigo-300"
             onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailItem label="Role" value={user.role} />
        <DetailItem label="Status">
            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                {accountStatus}
            </span>
        </DetailItem>
        <DetailItem label="Phone" value={user.phone || 'N/A'} />
        <DetailItem label="League" value={user.league ? `${user.league.name} (${user.league.leagueCode})` : 'N/A'} />
        
        <DetailItem label="Email Verified" value={user.emailVerified ? 'Yes' : 'No'} />
        <DetailItem label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'} />
        
        <DetailItem label="Failed Login Attempts" value={user.failedLoginAttempts?.toString()} />
        {user.accountLockedUntil && <DetailItem label="Account Locked Until" value={new Date(user.accountLockedUntil).toLocaleString()} />}

        <DetailItem label="Created At" value={(user.createdAt)?.toLocaleString()} />
        {user.createdBy && <DetailItem label="Created By" value={user.createdBy?.username} />}
        <DetailItem label="Last Updated At" value={(user.updatedAt)?.toLocaleString()} />
        {user.updatedBy && <DetailItem label="Updated By" value={user.updatedBy?.username} />}
        {user.deletedAt && <DetailItem label="Deleted At" value={new Date(user.deletedAt).toLocaleString()} />}
        {user.deletedBy && <DetailItem label="Deleted By" value={user.deletedBy?.username} />}
      </div>

      {/* Delete Confirmation Modal - using the basic one for now */}
      {/* <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        onConfirm={handleDeleteUser}
        confirmText="Delete User"
        isConfirming={isDeleting}
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete the user "{user.username}"? This action will soft-delete the user.
        </p>
      </Modal> */}
    </div>
  );
}

function DetailItem({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children || value || 'N/A'}</dd>
    </div>
  );
}
