// components/public/TeamCard.tsx
import Link from 'next/link';
import { TeamPublicFrontendDto } from '@/prisma';
interface TeamCardProps {
  team: TeamPublicFrontendDto;
  leagueId?: string; // Optional, if you want to construct link relative to league
}

export function TeamCard({ team, leagueId }: TeamCardProps) {
  const teamLink = leagueId ? `/public/leagues/${leagueId}/teams/${team.id}` : `/public/teams/${team.id}`;
  // Fallback for team link if leagueId is not provided, assuming a direct team public route
  // const teamLink = `/public/teams/${team.id}`;


  return (
    <Link href={teamLink} className="block group">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {team.bannerImageUrl ? (
          <img 
            src={team.bannerImageUrl} 
            alt={`${team.name} banner`} 
            className="w-full h-32 object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden'); }}
          />
        ) : (
          <div className={`w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 ${team.bannerImageUrl ? 'hidden' : ''}`}>
            No Banner
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-2">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={`${team.name} logo`} className="h-12 w-12 rounded-full object-cover border-2 border-gray-200" 
                   onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden');}}/>
            ) : (
               <div className={`h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-semibold ${team.logoUrl ? 'hidden' : ''}`}>
                {team.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 truncate" title={team.name}>
              {team.name}
            </h3>
          </div>
          {team.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {team.description}
            </p>
          )}
          {team.homeVenue && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Venue:</span> {team.homeVenue}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
