// app/(app)/league/teams/create/page.tsx (Create Team for LA)
"use client";
import { TeamFormByLA } from '@/components/forms/TeamFormByLA'; // We'll create this form component

export default function CreateTeamPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Team</h1>
        <TeamFormByLA />
      </div>
    </div>
  );
}