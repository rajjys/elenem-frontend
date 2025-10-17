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
    isHome: boolean,
    highlight: boolean
  ) => (
    <div className={`flex items-center justify-between w-full py-2 ${!isHome ? 'border-t border-slate-600' : ''}`}>
      <div className="flex items-center gap-2">
        {logo ?
          <Image
            src={logo}
            alt={`${name} Logo`}
            width={32}
            height={32}
            className="rounded-full border border-slate-300 dark:border-slate-600" />
          :
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-400 to-blue-700" />
        }
        <div>
          <span
            className={`text-md font-medium ${highlight
              ? 'text-slate-900 dark:text-slate-100 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
              }`}>{name}</span>
          <span className="block text-xs text-slate-500">{isHome ? 'Home' : 'Away'}</span>
        </div>
      </div>
        {score !== null && (
          <span
            className={`text-xl font-bold ${highlight
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-500 dark:text-slate-400'
            }`}
        >
          {highlight && (
            <span
              className="inline-block w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[7px] border-l-red-500 pr-0.5"
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
    <Card className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-2 pb-0 space-y-0">
        <div className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400">
          <span>{game.round || game.league.name}</span>
          <span className="hidden md:inline text-xs text-slate-700 dark:text-slate-200 font-medium">
            {gameDate}
          </span>
          {getStatusBadge(game.status)}
        </div>
        {/* <div className="md:hidden text-xs px-2 text-slate-700 dark:text-slate-200 font-medium flex justify-start gap-4">
          <span>{gameDate}</span>
          {game.homeVenue?.name && <span>•</span>}
          {game.homeVenue?.name && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {game.homeVenue.name}
            </div>
          )}
        </div> */}
      </CardHeader>

      <CardContent className="px-4 pb-2">
        {renderTeam(
          game.homeTeam.businessProfile.logoAsset?.url,
          game.homeTeam.shortCode,
          homeScore,
          true,
          homeWin
        )}
        {renderTeam(
          game.awayTeam.businessProfile.logoAsset?.url,
          game.awayTeam.shortCode,
          awayScore,
          false,
          awayWin
        )}
      </CardContent>
    </Card>
  );
};

export default GamePublicCard;
