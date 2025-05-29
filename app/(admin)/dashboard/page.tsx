// app/(admin)/dashboard/page.tsx
"use client";
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

  // These would ideally come from API calls
  const stats = [
    { name: 'Total Leagues', stat: '12', href: '/leagues' },
    { name: 'Total Users', stat: '150', href: '/users' },
    { name: 'Active Seasons', stat: '3', href: '#' }, // Placeholder
    { name: 'Platform Settings', stat: 'Manage', href: '/settings' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName || user?.username}!</h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your league management platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* Placeholder Icon - replace with actual icons */}
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{item.stat}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href={item.href} className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions or Recent Activity (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/leagues/create" className="block text-indigo-600 hover:text-indigo-800">
              + Create New League
            </Link>
            <Link href="/users/create" className="block text-indigo-600 hover:text-indigo-800">
              + Add New User
            </Link>
            {/* More actions */}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ul className="divide-y divide-gray-200">
            <li className="py-3">User 'john.doe' logged in.</li>
            <li className="py-3">League 'Summer Championship' updated.</li>
            {/* More activity items */}
          </ul>
        </div>
      </div>

    </div>
  );
}
