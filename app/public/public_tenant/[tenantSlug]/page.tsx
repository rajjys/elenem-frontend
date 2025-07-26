// app/public/public_tenant/[tenantSlug]/page.tsx
// This is a Server Component by default (no 'use client' directive)

import { notFound } from 'next/navigation'; // For handling cases where the tenant slug is invalid
import React from 'react';

// Mock data for league details (in a real app, this would come from an API/DB based on tenantSlug)
const mockLeagueDetails: { [key: string]: { name: string; motto: string; currentSeason: string; } } = {
  ligue1: {
    name: 'Ligue 1 Uber Eats',
    motto: 'Le championnat des étoiles!',
    currentSeason: '2024-2025',
  },
  premierleague: {
    name: 'Premier League',
    motto: 'The best league in the world!',
    currentSeason: '2024-2025',
  },
  laliga: {
    name: 'La Liga EA Sports',
    motto: 'Donde empieza la historia!',
    currentSeason: '2024-2025',
  },
};

// Define the props type for a Server Component
interface TenantSlugPageProps {
  params: {
    tenantSlug: string; // The dynamic segment from the URL
  };
  // searchParams?: { [key: string]: string | string[] | undefined }; // If you need query parameters
}

// Your component receives 'params' directly as a prop
// Make the component function 'async' to resolve the Next.js warning/error
const TenantSlugPage = async ({ params }: TenantSlugPageProps) => {
  const { tenantSlug } = params; // Access tenantSlug directly from props

  // In a real application, you would fetch data for this tenantSlug
  // from your database or API.
  const league = mockLeagueDetails[tenantSlug];
  console.log(league);
  if (!league) {
    // If the tenantSlug doesn't correspond to a valid league, show a 404
    notFound(); // This will render Next.js's default not-found page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-4 font-inter text-white">
      <div className="bg-white bg-opacity-90 p-10 rounded-xl shadow-2xl w-full max-w-4xl text-center text-gray-900">
        <h1 className="text-5xl font-extrabold mb-4 text-blue-800">Welcome to {league.name}</h1>
        <p className="text-2xl font-semibold mb-6 text-purple-700">"{league.motto}"</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Current Season</h2>
            <p className="text-xl text-gray-700">{league.currentSeason}</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Quick Links</h2>
            <ul className="list-disc list-inside text-xl text-gray-700">
              {/* These links use relative paths, which will correctly resolve under the subdomain */}
              <li className="mb-2"><a href={`/standings`} className="text-blue-600 hover:underline">View Standings</a></li>
              <li className="mb-2"><a href={`/teams`} className="text-blue-600 hover:underline">Explore Teams</a></li>
              {/* Add more links as needed */}
            </ul>
          </div>
        </div>

        <p className="mt-10 text-gray-600 text-base">
          This is the dedicated public page for {league.name}.
          All content here is specific to this league.
        </p>
      </div>
    </div>
  );
};

export default TenantSlugPage;
