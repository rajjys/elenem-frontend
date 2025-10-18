// Define the Standing type based on the backend response

import Link from "next/link";
import { Avatar, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui";
import { StandingsBasic } from "@/schemas";

// --- StandingsTable Component ---
interface StandingsTableProps {
    standings: StandingsBasic[];
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

    const trimmedStandings = standings.slice(0, rowsToShow);

    return (
    <div className="overflow-x-auto no-scrollbar">
      <Table>
        <TableHeader className="border-blue-200">
          <TableRow>
            <TableHead className="text-center"></TableHead>
            <TableHead className="min-w-[100px]">Equipes</TableHead>
            <TableHead className="font-semibold text-center">Pts</TableHead>
            <TableHead className="text-center">J</TableHead>
            <TableHead className="text-center">G</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">N</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trimmedStandings.map((item) => {
            return (
                  <TableRow key={item.team.id} className="cursor-pointer hover:bg-gray-100">
                    <TableCell className="font-medium text-center px-0">{item.rank}</TableCell>
                    <TableCell className="px-0">
                      <Link href={`/teams/${item.team.league.slug}/${item.team.slug}`} className="flex items-center gap-3 w-full">
                        <Avatar src={item.team.businessProfile?.logoAsset?.url} name={item.team.name} size={25} />
                        <span className="hidden md:inline font-bold">
                            {item.team.name}
                            <span className="text-slate-400 font-normal text-xs"> ({item.team.shortCode})</span>
                        </span>
                        <span className="font-bold md:hidden">{item.team.shortCode}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-center">{item.points}</TableCell>
                    <TableCell className="text-center">{item.gamesPlayed}</TableCell>
                    <TableCell className="text-center">{item.wins}</TableCell>
                    <TableCell className="text-center">{item.losses}</TableCell>
                    <TableCell className="text-center">{item.draws}</TableCell>
                  </TableRow>
            )})
          }
        </TableBody>
      </Table>
    </div>
    );
};

export default StandingsTable;