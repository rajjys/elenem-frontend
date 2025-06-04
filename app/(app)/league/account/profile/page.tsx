// app/(app)/account/profile/page.tsx
"use client";
import { UserProfileForm } from '@/components/forms/UserProfileForm';
import { useAuthStore } from '@/store/auth.store';
import Image from 'next/image';
import { FiUser, FiMail, FiShield, FiAward, FiCalendar, FiPhone, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function MyProfilePage() {
  const user = useAuthStore((state) => state.user);

  // Format date to readable format
  const formatDate = (dateString?: Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Panel - Profile Overview */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-20"></div>
            
            <div className="px-6 pb-6 -mt-12">
              <div className="flex justify-center">
                {user?.profileImageUrl ? (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                    <Image
                      src={user.profileImageUrl}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {user?.firstName?.charAt(0) || user?.username?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-600">@{user?.username}</p>
                
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user?.role === 'SYSTEM_ADMIN' ? 'bg-red-100 text-red-800' :
                    user?.role === 'LEAGUE_ADMIN' ? 'bg-blue-100 text-blue-800' :
                    user?.role === 'TEAM_ADMIN' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {user?.role?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <FiMail className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Email</p>
                    <div className="flex items-center">
                      <p className="font-medium text-gray-800">{user?.email}</p>
                      {user?.emailVerified ? (
                        <FiCheckCircle className="ml-2 text-green-500" />
                      ) : (
                        <FiAlertCircle className="ml-2 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                {user?.phone && (
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <FiPhone className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{user.phone}</p>
                    </div>
                  </div>
                )}
                
                {user?.league && (
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <FiAward className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">League</p>
                      <p className="font-medium text-gray-800">
                        {user.league.name} ({user.league.leagueCode})
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <FiCalendar className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(user?.createdAt)}
                    </p>
                  </div>
                </div>
                
                {user?.lastLogin && (
                  <div className="flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <FiShield className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(user.lastLogin)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {user?.accountLocked && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Account Locked</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Your account has been locked due to multiple failed login attempts. 
                      {user.accountLockedUntil && (
                        <>
                          {' '}It will be unlocked on {formatDate(user.accountLockedUntil)}.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Profile Form */}
        <div className="md:w-2/3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Edit Profile</h2>
              <p className="mt-1 text-sm text-gray-600">
                Update your personal information and preferences
              </p>
            </div>
            <div className="p-6">
              <UserProfileForm />
            </div>
          </div>
          
          {/* Security Status */}
          <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Security Status</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                    user?.emailVerified ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {user?.emailVerified ? (
                      <FiCheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <FiAlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Email Verification</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {user?.emailVerified 
                        ? 'Your email address has been verified' 
                        : 'Please verify your email address to secure your account'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                    user?.isActive ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {user?.isActive ? (
                      <FiCheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <FiAlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Account Status</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {user?.isActive 
                        ? 'Your account is active' 
                        : 'Your account is inactive. Please contact support'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                    user?.accountLocked ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {user?.accountLocked ? (
                      <FiAlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <FiCheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Login Security</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {user?.accountLocked 
                        ? 'Account is currently locked' 
                        : 'No recent suspicious login activity detected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}