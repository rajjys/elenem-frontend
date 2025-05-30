// app/(app)/account/profile/page.tsx
"use client";
import { UserProfileForm } from '@/components/forms/UserProfileForm';
import { useAuthStore } from '@/store/auth.store';

export default function MyProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Profile</h1>
      
      {user?.profileImageUrl && (
        <div className="mb-6 flex justify-center">
          <img 
            src={user.profileImageUrl} 
            alt="Profile" 
            className="w-32 h-32 rounded-full object-cover border-2 border-indigo-200"
            onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
          />
        </div>
      )}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Account Information</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email} {user?.emailVerified ? <span className="text-green-600">(Verified)</span> : <span className="text-yellow-600">(Not Verified)</span>}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          {user?.league && <p><strong>League:</strong> {user.league.name} ({user.league.leagueCode})</p>}
          <p><strong>Joined:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
      <UserProfileForm />
    </div>
  );
}
