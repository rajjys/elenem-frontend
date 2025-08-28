import Image from "next/image";
import { TeamDetails } from "@/schemas";

interface TeamPublicProfileProps {
  team: TeamDetails;
}

export function TeamPublicProfile({ team }: TeamPublicProfileProps) {
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      {team.businessProfile.bannerImageUrl ? (
        <div className="relative w-full h-48 md:h-64">
          <Image
            src={team.businessProfile.bannerImageUrl}
            alt={`${team.name} banner`}
            fill
            className="object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            unoptimized
            priority
          />
        </div>
      ) : (
        <div className="w-full h-48 md:h-64 bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
          <span className="text-2xl font-semibold text-gray-600">{team.name}</span>
        </div>
      )}

      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 mb-6">
          {team.businessProfile.logoUrl ? (
            <div className="relative w-32 h-32">
              <Image
                src={team.businessProfile.logoUrl}
                alt={`${team.name} logo`}
                fill
                className="rounded-full object-cover border-4 border-white shadow-lg bg-white"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                unoptimized
                priority
              />
            </div>
          ) : (
            <div className={`w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-4xl font-semibold border-4 border-white shadow-lg`}>
              {team.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{team.name}</h1>
            {team.homeVenue && <p className="text-md text-gray-600 mt-1">Home Venue: {team.homeVenue.name}</p>}
          </div>
        </div>

        {team.businessProfile.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">About the Team</h2>
            <p className="text-gray-700 leading-relaxed prose max-w-none">{team.businessProfile.description}</p>
          </div>
        )}

        {/* Roster/Players and Schedule/Results placeholders remain unchanged */}
      </div>
    </div>
  );
}