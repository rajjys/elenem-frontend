// components/layouts/navigation/ContextSwitcher.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiChevronDown } from 'react-icons/fi';
import { useAuthStore } from '@/store/auth.store'; // To get the current user's tenantId
import { api } from '@/services/api';

interface League {
    id: string;
    name: string;
}

export const ContextSwitcher = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore(); // Get the logged-in user

    const [isOpen, setIsOpen] = useState(false);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // This captures the context passed down from a SYSTEM_ADMIN viewing a specific tenant.
    const contextTenantId = searchParams.get('tenantId');
    const currentLeagueId = searchParams.get('leagueId');

    useEffect(() => {
        const fetchLeagues = async () => {
            setIsLoading(true);
            // The API needs to know which tenant's leagues to fetch.
            // For a TENANT_ADMIN, this is their own tenantId.
            // For a SYSTEM_ADMIN, this is the contextTenantId from the URL.
            const tenantIdForApi = contextTenantId || user?.tenantId;

            if (!tenantIdForApi) {
                setIsLoading(false);
                return; // Can't fetch leagues without a tenant context
            }
            
            try {
                // The backend API at GET /api/leagues should be smart enough
                // to return all leagues for the given tenantId if the user is authorized.
                // NOTE: The endpoint needs to handle this logic. The frontend just makes the call.
                const response = await api.get<{ leagues: League[], total: number }>('/leagues');
                setLeagues(response?.data?.leagues);
            } catch (error) {
                console.error("Error fetching leagues for context switcher:", error);
                setLeagues([]); // Set to empty on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeagues();
    }, [contextTenantId, user?.tenantId]);

    // Close on click away
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSwitch = (leagueId: string | null) => {
        setIsOpen(false);
        const params = new URLSearchParams();
        // Always preserve the tenant context if it exists (for SYSTEM_ADMIN view)
        if (contextTenantId) {
            params.set('contextTenantId', contextTenantId);
        }

        if (leagueId) {
            params.set('contextLeagueId', leagueId);
            router.push(`/league/dashboard?${params.toString()}`);
        } else {
            // Go back to the tenant dashboard, preserving tenant context if needed
            router.push(`/tenant/dashboard?${params.toString()}`);
        }
    };

    const selectedLeague = leagues.find(l => l.id === currentLeagueId);
    const buttonText = isLoading ? 'Loading...' : (selectedLeague ? selectedLeague.name : 'Overall Tenant View');

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
                <span className="truncate max-w-[200px]">{buttonText}</span>
                <FiChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
                    <div className="py-1">
                        <a href="#" onClick={() => handleSwitch(null)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                            Overall Tenant View
                        </a>
                        {leagues.map((league) => (
                            <a key={league.id} href="#" onClick={() => handleSwitch(league.id)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                                {league.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
