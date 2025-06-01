// components/league/LeagueAdminsTable.tsx
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useState } from 'react';
// import { Modal } from '@/components/ui/modal'; // If you have a modal for confirmation

interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  // Add other relevant fields like 'createdAt', 'lastLogin' if available
}

interface LeagueAdminsTableProps {
  admins: AdminUser[];
  currentUserId: string; // To prevent self-removal from table action
  onAdminRemoved: (adminId: string) => void; // Callback to update parent state
  onRemoveError: (errorMessage: string) => void;
}

export function LeagueAdminsTable({ admins, currentUserId, onAdminRemoved, onRemoveError }: LeagueAdminsTableProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null); // Store ID of admin being removed
  // const [showConfirmModal, setShowConfirmModal] = useState<AdminUser | null>(null);


  const handleRemoveAdmin = async (adminId: string) => {
    // setShowConfirmModal(null); // Close modal if open
    if (adminId === currentUserId) {
      onRemoveError("You cannot remove yourself using this action.");
      return;
    }
    setIsRemoving(adminId);
    try {
      await api.delete(`/leagues/my-league/admins/${adminId}`);
      onAdminRemoved(adminId); // Notify parent to refresh or update list
    } catch (error: any) {
      onRemoveError(error.response?.data?.message || "Failed to remove admin.");
    } finally {
      setIsRemoving(null);
    }
  };

  if (!admins || admins.length === 0) {
    return <p className="text-gray-600">No other administrators found for this league.</p>;
  }

  return (
    <div className="overflow-x-auto">
      {/* {showConfirmModal && (
        <Modal
          isOpen={!!showConfirmModal}
          onClose={() => setShowConfirmModal(null)}
          title={`Confirm Remove Admin`}
          onConfirm={() => handleRemoveAdmin(showConfirmModal.id)}
          confirmText="Yes, Remove"
          isConfirming={isRemoving === showConfirmModal.id}
        >
          <p>Are you sure you want to remove {showConfirmModal.firstName} {showConfirmModal.lastName} ({showConfirmModal.email}) as a League Administrator? They will be demoted to a General User.</p>
        </Modal>
      )} */}
      <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {admin.firstName} {admin.lastName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.username}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {admin.id !== currentUserId ? (
                  <Button
                    variant="danger"
                    //size="sm" // Assuming Button component accepts size prop
                    onClick={() => handleRemoveAdmin(admin.id) /*setShowConfirmModal(admin)*/}
                    isLoading={isRemoving === admin.id}
                    disabled={isRemoving === admin.id}
                  >
                    Remove Admin Role
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400 italic">Current User</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
