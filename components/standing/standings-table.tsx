// components/standings/standings-table.tsx
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from '../ui';
import { useRouter } from 'next/navigation';

interface TeamStanding {
  team: {
    id: string;
    name: string;
    businessProfile: {
      logoUrl: string | null;
      bannerImageUrl: string | null;
    }
  };
  rank: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string | null; // Form can be a string like "WWLDW"
}

interface StandingsTableProps {
  standings: TeamStanding[];
  managingTeamId?: string | null;
}
export function StandingsTable({ standings, managingTeamId }: StandingsTableProps) {
    const router = useRouter();
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center">#</TableHead>
            <TableHead className="min-w-[200px]">Team</TableHead>
            <TableHead className="font-bold text-center">Pts</TableHead>
            <TableHead className="text-center">GP</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="w-[120px] text-center">Form</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((item) => {
            const isMyTeam = managingTeamId === item.team.id;
            return (
              <TableRow key={item.team.id} onClick={() => router.push(`/team/dashboard?ctxTeamId=${item.team.id}`)}
                className={`cursor-pointer hover:bg-gray-100 ${isMyTeam ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                <TableCell className="font-medium text-center">{item.rank}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.team.businessProfile.logoUrl ? (
                      <Avatar src={item.team.businessProfile.logoUrl} name={item.team.name} size={40} />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                        {item.team.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{item.team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-center">{item.points}</TableCell>
                <TableCell className="text-center">{item.gamesPlayed}</TableCell>
                <TableCell className="text-center">{item.wins}</TableCell>
                <TableCell className="text-center">{item.draws}</TableCell>
                <TableCell className="text-center">{item.losses}</TableCell>
                <TableCell className="text-center">{item.goalsFor}</TableCell>
                <TableCell className="text-center">{item.goalsAgainst}</TableCell>
                <TableCell className="text-center">{item.goalDifference}</TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-center">
                    {item.form?.split('').slice(-5).map((result, i) => (
                      <Badge
                        key={i}
                        className={`h-5 w-5 flex items-center justify-center text-xs font-semibold
                          ${result === 'W' ? 'bg-green-500 hover:bg-green-500' : ''}
                          ${result === 'D' ? 'bg-gray-400 hover:bg-gray-400' : ''}
                          ${result === 'L' ? 'bg-red-500 hover:bg-red-500' : ''}
                        `}
                      >
                        {result}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
