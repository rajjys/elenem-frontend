// app/(app)/league/players/create/page.tsx (LA: Create Player)
"use client";
import { PlayerFormByLA } from '@/components/forms/PlayerFormByLA';

export default function CreatePlayerPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Register New Player</h1>
                <p className="text-sm text-gray-600 mb-4">
                    Register a new player in the league. You can assign them to a team now or later.
                </p>
                <PlayerFormByLA />
            </div>
        </div>
    );
}