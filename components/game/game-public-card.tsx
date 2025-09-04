import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { GameDetails, GameStatus } from '@/schemas';
import { formatDateFr } from '@/utils';
import Image from 'next/image';

interface GamePublicCardProps {
  game: GameDetails;
}

const GamePublicCard: React.FC<GamePublicCardProps> = ({ game }) => {
  const gameDate = formatDateFr(game.dateTime);

  // Status badge
  const statusBadge =
    game.status === GameStatus.COMPLETED ? (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">Terminé</span>
    ) : game.status === GameStatus.IN_PROGRESS ? (
      <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">En cours</span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white">Programmé</span>
    );

  // Team row
  const renderTeam = (
    logo: string | null | undefined,
    name: string,
    score: number | null | undefined,
    highlight: boolean
  ) => (
    <div className="flex items-center justify-between w-full py-1">
      <div className="flex items-center gap-2">
        <Image
          src={logo || `https://placehold.co/40x40?text=${name.charAt(0)}`}
          alt={`${name} Logo`}
          width={28}
          height={28}
          className="rounded-full border border-gray-300"
        />
        <span className={`text-sm font-medium ${highlight ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
          {name}
        </span>
      </div>
      {score !== null && <span className={`text-sm font-bold ${highlight ? 'text-gray-900' : 'text-gray-500'}`}>{score}</span>}
    </div>
  );

  const homeScore = game.homeScore ?? null;
  const awayScore = game.awayScore ?? null;

  // Decide highlights if completed
  const homeWin = game.status === GameStatus.COMPLETED && homeScore !== null && homeScore > (awayScore ?? 0);
  const awayWin = game.status === GameStatus.COMPLETED && awayScore !== null && awayScore > (homeScore ?? 0);

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition bg-white hover:bg-gray-100 transition-colors duration-300 ease-in-out">
      <CardHeader className="flex flex-col items-start gap-1 px-4 border-b border-gray-100 space-y-1">
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <span>{game.round || game.league.name}</span>
          {statusBadge}
        </div>
        <div className="text-sm text-gray-700 font-medium flex justify-start gap-4">
            <span>{gameDate}</span>
            {game.homeVenue?.name && <span>•</span>}
            {game.homeVenue?.name && (
          <div className="text-xs text-gray-500 mt-2">{game.homeVenue.name}</div>
        )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {renderTeam(game.homeTeam.businessProfile.logoUrl, game.homeTeam.shortCode, homeScore, homeWin)}
        {renderTeam(game.awayTeam.businessProfile.logoUrl, game.awayTeam.shortCode, awayScore, awayWin)}
      </CardContent>
    </Card>
  );
};

export default GamePublicCard;
