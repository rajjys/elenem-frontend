"use client";
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/schemas';
import { InviteLeagueAdminForm } from '@/components/forms/InviteLeagueAdminForm';
import { LeagueAdminsTable } from '@/components/league/LeagueAdminsTable';
import Link from "next/link";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

const TABS = [
  { label: "Admins", key: "admins" },
  { label: "Team Managers", key: "teamManagers" },
  { label: "General Users", key: "generalUsers" },
];

export default function ManageLeagueUsersPage() {
  const { user, tokens } = useAuthStore();
  const [activeTab, setActiveTab] = useState("admins");

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [teamManagers, setTeamManagers] = useState<AdminUser[]>([]);
  const [generalUsers, setGeneralUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch functions for each tab
  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<AdminUser[]>('/leagues/my-league/admins');
      setAdmins(response.data);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch league administrators.");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamManagers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<AdminUser[]>('/leagues/my-league/team-admins');
      setTeamManagers(response.data);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch team managers.");
      setTeamManagers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGeneralUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<AdminUser[]>('/leagues/my-league/general-users');
      setGeneralUsers(response.data);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch general users.");
      setGeneralUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (!user || !tokens?.accessToken) return;
    setError(null);
    if (activeTab === "admins") fetchAdmins();
    else if (activeTab === "teamManagers") fetchTeamManagers();
    else if (activeTab === "generalUsers") fetchGeneralUsers();
  }, [activeTab, user, tokens, fetchAdmins, fetchTeamManagers, fetchGeneralUsers]);

  const handleInviteSuccess = (newAdmin: AdminUser) => {
    fetchAdmins();
    setActionError(null);
  };

  const handleAdminRemoved = (removedAdminId: string) => {
    fetchAdmins();
    setActionError(null);
  };

  const handleActionError = (errorMessage: string) => {
    setActionError(errorMessage);
    setTimeout(() => setActionError(null), 5000);
  };

  if (loading && (
    (activeTab === "admins" && admins.length === 0) ||
    (activeTab === "teamManagers" && teamManagers.length === 0) ||
    (activeTab === "generalUsers" && generalUsers.length === 0)
  )) return <div className="p-6 text-center">Loading...</div>;
  //if (error) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-md">{error}</div>;
  if (!user || user.role !== Role.LEAGUE_ADMIN) return <div className="p-6 text-center">Access Denied.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage League Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Invite new administrators or manage existing users for your league.
          </p>
        </div>
        <Link
          href="/league/users/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
          Create User
        </Link>
      </div>

      {actionError && <p className="text-red-500 bg-red-100 p-3 rounded text-sm mb-4">{actionError}</p>}

      <div className="border-b mb-4 flex space-x-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 border-b-2 ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500"
            } focus:outline-none`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "admins" && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Administrators</h2>
            <LeagueAdminsTable
              admins={admins}
              currentUserId={user.id}
              onAdminRemoved={handleAdminRemoved}
              onRemoveError={handleActionError}
            />
            <div className="mt-8">
              <InviteLeagueAdminForm onInviteSuccess={handleInviteSuccess} />
            </div>
          </>
        )}
        {activeTab === "teamManagers" && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Managers</h2>
            <UserTable users={teamManagers} label="Team Managers" />
          </>
        )}
        {activeTab === "generalUsers" && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">General Users</h2>
            <UserTable users={generalUsers} label="General Users" />
          </>
        )}
      </div>
    </div>
  );
}

// Simple user table for team managers and general users
function UserTable({ users, label }: { users: AdminUser[]; label: string }) {
  if (users.length === 0) {
    return <div className="text-gray-500 text-center">No {label} found.</div>;
  }
  return (
    <table className="min-w-full bg-white border rounded shadow">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b">Username</th>
          <th className="py-2 px-4 border-b">Email</th>
          <th className="py-2 px-4 border-b">First Name</th>
          <th className="py-2 px-4 border-b">Last Name</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="py-2 px-4 border-b">{u.username}</td>
            <td className="py-2 px-4 border-b">{u.email}</td>
            <td className="py-2 px-4 border-b">{u.firstName}</td>
            <td className="py-2 px-4 border-b">{u.lastName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}