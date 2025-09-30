import { TeamDetails } from '@/schemas';
import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';

interface TeamCardProps {
  team: TeamDetails;
  leagueId?: string;
}

export function TeamCard({ team, leagueId }: TeamCardProps) {
  const teamLink = leagueId
    ? `/public/leagues/${leagueId}/teams/${team.id}`
    : `/public/teams/${team.id}`;

  // Banner fallback state
  const [bannerError, setBannerError] = useState(false);
  // Logo fallback state
  const [logoError, setLogoError] = useState(false);

  return (
    <Link href={teamLink} className="block group">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {team.businessProfile.bannerAsset?.url && !bannerError ? (
          <Image
            src={team.businessProfile.bannerAsset?.url}
            alt={`${team.name} banner`}
            width={600}
            height={128}
            className="w-full h-32 object-cover"
            onError={() => setBannerError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500">
            No Banner
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-2">
            {team.businessProfile.logoAsset?.url && !logoError ? (
              <Image
                src={team.businessProfile.logoAsset?.url}
                alt={`${team.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                onError={() => setLogoError(true)}
                unoptimized
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-semibold">
                {team.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h3
              className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 truncate"
              title={team.name}
            >
              {team.name}
            </h3>
          </div>
          {team.businessProfile.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {team.businessProfile.description}
            </p>
          )}
          {team.homeVenue && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Venue:</span> {team.homeVenue.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}