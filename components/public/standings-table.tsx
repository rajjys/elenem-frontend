// Define the Standing type based on the backend response

import Image from "next/image";
import { Skeleton } from "../ui";
import Link from "next/link";

// This is a simplified version for the landing page
interface Standing {
    team: {
        id: string;
        name: string;
        shortCode: string;
        slug: string;
        businessProfile: {
            logoUrl: string | null;
            bannerImageUrl: string | null;
        }
    };
    rank: number;
    points: number;
    form?: string | null;
    gamesPlayed: number;
}

// --- StandingsTable Component ---
interface StandingsTableProps {
    standings: Standing[];
    rowsToShow?: number;
    isLoading: boolean;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, rowsToShow = standings.length, isLoading }) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: rowsToShow }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-grow">
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (!standings || standings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Aucun classement disponible pour cette ligue.
            </div>
        );
    }

    const standingsToDisplay = standings.slice(0, rowsToShow);

    return (
        <div className="overflow-x-auto no-scrollbar px-2 md:px-4">
            <table className="min-w-full divide-y divide-gray-200 font-normal">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="py-2 text-left text-xs text-gray-500 uppercase tracking-wider">
                            #
                        </th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">
                            Équipe
                        </th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">
                            Matchs
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                            Points
                        </th>
                        {/* You can add more columns here if needed */}
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase tracking-wider">
                            Forme
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {standingsToDisplay.map((standing) => (
                        <tr key={standing.team.id}>
                            <td className="py-2 whitespace-nowrap text-sm text-gray-900">
                                {standing.rank}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                <Link href={`/teams/${standing.team.slug}`} className="flex items-center justify-start space-x-2 group">
                                    <Image
                                      className='h-8 w-8 rounded-full object-cover border border-gray-400 mr-2'
                                      src={standing.team.businessProfile.logoUrl || "https://placehold.co/40x40/cccccc/333333?text=${team.name.charAt(0)}"}
                                      height={60}
                                      width={60}
                                      placeholder="blur"
                                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
                                      alt={`${standing.team.shortCode} Logo`}
                                      // onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/cccccc/333333?text=${team.name.charAt(0)}`; }}
                                    />
                                    <span className="group-hover:text-orange-900 transition-colors duration-300 ease-in-out">{standing.team.name}</span>
                                </Link>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="pl-4">{standing.gamesPlayed}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                <span className="pl-4">{standing.points}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {standing.form}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StandingsTable;