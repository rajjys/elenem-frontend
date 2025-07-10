// components/public/TeamPublicProfile.tsx
//import { TeamPublicFrontendDto } from "@/schemas";
// import PlayerCard from './PlayerCard'; // If you have player data

import { TeamDetails } from "@/schemas";

interface TeamPublicProfileProps {
  team: TeamDetails;
  // players?: PlayerPublicDto[]; // Example
}

export function TeamPublicProfile({ team /*, players */ }: TeamPublicProfileProps) {
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      {team.bannerImageUrl ? (
        <img src={team.bannerImageUrl} alt={`${team.name} banner`} className="w-full h-48 md:h-64 object-cover" 
             onError={(e) => { e.currentTarget.style.display = 'none'; }}/>
      ) : (
        <div className="w-full h-48 md:h-64 bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-2xl font-semibold text-gray-600">{team.name}</span>
        </div>
      )}

      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 mb-6">
          {team.logoUrl ? (
            <img 
                src={team.logoUrl} 
                alt={`${team.name} logo`} 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white"
                onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden');}}
            />
          ) : (
            <div className={`w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-4xl font-semibold border-4 border-white shadow-lg ${team.logoUrl ? 'hidden' : ''}`}>
                {team.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{team.name}</h1>
            {team.homeVenue && <p className="text-md text-gray-600 mt-1">Home Venue: {team.homeVenue.name}</p>}
          </div>
        </div>

        {team.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">About the Team</h2>
            <p className="text-gray-700 leading-relaxed prose max-w-none">{team.description}</p>
          </div>
        )}
        
        {/* Placeholder for Roster/Players list */}
        {/* {players && players.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Roster</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {players.map(player => <PlayerCard key={player.id} player={player} />)}
            </div>
          </div>
        )} */}
        
        {/* Placeholder for Schedule/Results */}
        {/* <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Recent Games</h2>
            <p className="text-gray-600">Game results and upcoming fixtures will be shown here.</p>
        </div> */}

      </div>
    </div>
  );
}