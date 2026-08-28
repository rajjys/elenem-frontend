import React from 'react';
import { Card, CardContent, CardHeader, getStatusBadge } from '@/components/ui';
import { GameDetails, GameStatus } from '@/schemas';
import { formatDateFr } from '@/utils';
import Image from 'next/image';

interface GamePublicCardProps {
  game: GameDetails;
}

const GamePublicCard: React.FC<GamePublicCardProps> = ({ game }) => {
  const gameDate = formatDateFr(game.dateTime);
  // Team row
  const renderTeam = (
  logo: string | null | undefined,
  name: string,
  score: number | null | undefined,
  highlight: boolean
) => (
  <div className="flex items-center justify-between w-full py-1">
    <div className="flex items-center gap-2">
      {logo ? 
        <Image
          src={logo}
          alt={`${name} Logo`}
          width={28}
          height={28}
          className="rounded-full border border-line "/>
          :
          <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-gray-400 to-blue-700" />
        }
      <span
        className={`text-sm font-medium ${
          highlight
            ? 'text-ink font-semibold'
            : 'text-ink-muted '
        }`}>{name}</span>
    </div>
    {score !== null && (
      <span
        className={`text-sm font-bold ${
          highlight
            ? 'text-ink '
            : 'text-ink-muted '
        }`}
      >
        {highlight && (
          <span
            className="inline-block w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-red-500 pr-0.5"
            title="Winner"
          />
        )}
        {score}
      </span>
    )}
  </div>
);

  const homeScore = game.homeScore ?? null;
  const awayScore = game.awayScore ?? null;

  // Decide highlights if completed
  const homeWin = game.status === GameStatus.COMPLETED && homeScore !== null && homeScore > (awayScore ?? 0);
  const awayWin = game.status === GameStatus.COMPLETED && awayScore !== null && awayScore > (homeScore ?? 0);

  return (
    <Card className="rounded-xl border border-line shadow-sm hover:shadow-md transition bg-surface hover:bg-surface-sunk transition-colors duration-300 ease-in-out">
      <CardHeader className="flex flex-col items-start gap-1 px-4 py-1 border-b border-line space-y-1">
        <div className="flex items-center justify-between py-1 w-full text-xs text-ink-muted ">
          <span>{game.round || game.league.name}</span>
          <span className="hidden md:inline text-xs text-ink font-medium">
            {gameDate}
          </span>
          {getStatusBadge(game.status)}
        </div>
        {/* <div className="md:hidden text-sm text-ink font-medium flex justify-start gap-4">
          <span>{gameDate}</span>
          {game.homeVenue?.name && <span>•</span>}
          {game.homeVenue?.name && (
            <div className="text-xs text-ink-muted mt-2">
              {game.homeVenue.name}
            </div>
          )}
        </div> */}
      </CardHeader>

      <CardContent className="px-4 py-1">
        {renderTeam(
          game.homeTeam.businessProfile.logoAsset?.url,
          game.homeTeam.shortCode,
          homeScore,
          homeWin
        )}
        {renderTeam(
          game.awayTeam.businessProfile.logoAsset?.url,
          game.awayTeam.shortCode,
          awayScore,
          awayWin
        )}
      </CardContent>
    </Card>
  );
};

export default GamePublicCard;
