// app/(admin)/layout.tsx
"use client";
import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@/prisma';

// Basic Sidebar and Navbar components would be defined here or imported
function Sidebar() {
    const logout = useAuthStore(state => state.logout);
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    }
  return (
    <aside className="w-64 bg-gray-800 text-white p-4 space-y-2">
      <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
      <Link href="/admin/dashboard" className="block hover:bg-gray-700 p-2 rounded">Dashboard</Link>
      <Link href="/admin/leagues" className="block hover:bg-gray-700 p-2 rounded">Leagues</Link>
      <Link href="/admin/users" className="block hover:bg-gray-700 p-2 rounded">Users</Link>
      <Link href="/admin/settings" className="block hover:bg-gray-700 p-2 rounded">Settings</Link>
      <button onClick={handleLogout} className="w-full text-left hover:bg-gray-700 p-2 rounded mt-auto">Logout</button>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, tokens, fetchUser } = useAuthStore();
  const router = useRouter();

  // The primary auth check is now in middleware.
  // This useEffect primarily ensures user data is loaded into the store
  // for client-side display, if not already present.
  useEffect(() => {
    // If tokens exist but user data is not in store, fetch it.
    // The middleware would have already redirected if tokens were missing.
    if (tokens?.accessToken && !user) {
      fetchUser();
    }
    // No explicit router.push('/login') here, as middleware handles initial access.
    // If user role *changes* dynamically while on the page, you might need a check
    // but for initial load, middleware is key.
  }, [tokens, user, fetchUser]);

  // Optionally, you can still show a loading state if user data is being fetched
  // or if the store hasn't rehydrated yet, but don't redirect here.
  // The middleware will handle hard redirects on initial load.
  if (!user && tokens?.accessToken) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading user data...</p></div>;
  }

  // If user is null AFTER fetch attempt (meaning no token or invalid) or role is wrong,
  // it implies middleware might have failed or there's a client-side race condition.
  // This block is a fallback, but ideally, middleware prevents reaching here.
  if (!user || user.role !== Role.SYSTEM_ADMIN) {
     // If user is null and no tokens, it means they are not logged in (middleware should have caught this)
     // If user exists but role is wrong, it means they are logged in but unauthorized for this specific layout.
     // In a robust app, you might redirect to a specific error/denied page.
     // For now, redirecting to login is a safe fallback.
     console.warn("Client-side Layout check: User not authorized or not found. Redirecting to login.");
     // This push might cause a temporary flash before middleware takes over.
     // Ideally, the middleware catches this on initial load.
     ///router.push('/login');
     return <div className="min-h-screen flex items-center justify-center"><p>Access Denied. Redirecting...</p></div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}