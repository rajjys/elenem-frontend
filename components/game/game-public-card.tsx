import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { GameDetails, GameStatus } from '@/schemas';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface GamePublicCardProps {
    game: GameDetails;
}
const GamePublicCard: React.FC<GamePublicCardProps> = ({game}) => {
    
    const gameProgress = game.status === GameStatus.COMPLETED ? <span className=''>TERMINE</span> :
                      game.status === GameStatus.IN_PROGRESS ? <span className='bg-red-400 py-1 px-2 text-white font-bold rounded-full'>EN COURS</span> : 
                      <span></span>
                
    
    let homeTeamStyle = '';
    let awayTeamStyle = '';
    if(game.status === GameStatus.COMPLETED && game.homeScore && game.awayScore){
        const winStyle = 'font-bold text-yellow-100';
        const lossStyle = 'text-gray-300';
        const drawStyle = 'text-white';
        homeTeamStyle = game.homeScore > game.awayScore ? winStyle : (game.homeScore < game.awayScore) ? lossStyle : drawStyle;
        awayTeamStyle = game.homeScore < game.awayScore ? winStyle : (game.homeScore > game.awayScore) ? lossStyle : drawStyle;
    }

    const timeOnly = format(new Date(game.dateTime), 'HH:mm');

  return (
    <Card className="m-2 pb-2 rounded-md bg-gray-600 text-gray-100">
        <CardHeader className='text-xs pb-2 px-4'>
            <CardTitle className='flex items-center justify-between'>
                <span>{game.round || game.league.name}</span>
                {gameProgress}
                </CardTitle>
        </CardHeader>
        <CardContent className='flex items-ceter justify-between space-x-4'>
          {/* Game Section */}
          <div className='flex justify-between grow'>
            {/*Game Info */}
            <div className='w-full'>
                {/*TEAM 1 */}
                <div className={`flex items-center justify-between w-full pb-2 ${homeTeamStyle}`}>
                    <div className='flex items-center justify-start'>
                        <Image
                           className='h-8 w-8 rounded-full object-cover border border-gray-400'
                           src={game.homeTeam.logoUrl || "https://placehold.co/40x40/cccccc/333333?text=${team.name.charAt(0)}"}
                           height={60}
                           width={60}
                           placeholder="blur"
                           blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
                           alt={`${game.homeTeam.shortCode} Logo`}
                           // onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/cccccc/333333?text=${team.name.charAt(0)}`; }}
                         />
                        <span className={`px-2 text-sm md:text-base`} >{game.homeTeam.shortCode}</span>
                    </div>
                    <span className={`text-sm md:text-base`}>{GameStatus.COMPLETED && game.homeScore}</span>
                </div>
                {/**TEAM 2 */}
                <div className={`flex items-center justify-between space-x-2 ${awayTeamStyle}`}>
                    <div className='flex items-center justify-start'>
                        <Image
                          className='h-8 w-8 rounded-full object-cover border border-gray-400'
                          src={game.awayTeam.logoUrl || "https://placehold.co/40x40/cccccc/333333?text=${team.name.charAt(0)}"}
                          height={60}
                          width={60}
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII="
                          alt={`${game.awayTeam.shortCode} Logo`}
                          // onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/cccccc/333333?text=${team.name.charAt(0)}`; }}
                        />
                        <span className={`px-2 text-sm md:text-base`}>{game.awayTeam.shortCode}</span>
                    </div>
                    <span className={`text-sm md:text-base`}>{GameStatus.COMPLETED && game.awayScore}</span>
                </div>
            </div>
            {/*Game Location Info */}
            <div className='text-xs flex items-center justify-center'>
                {game.homeVenue?.name}
            </div>
          </div>
          {/*Actions Section */}
          <div className='text-xs flex items-center justify-center border-l border-gray-500 px-2 md:px-4'>
            { game.status === GameStatus.SCHEDULED ? (
                <span className='bg-gray-900 text-white py-2 px-4 rounded-sm'>{timeOnly}</span>) : 
                ( game.status === GameStatus.IN_PROGRESS ? 
                    <span className='bg-red-400 text-white p-2 rounded-sm'>En cours</span> : 
                    <div className='flex bg-gray-400 text-yellow-100 py-2 px-2 md:px-4 rounded-sm'>
                        <Plus className='h-4 w-4'/>
                        <span >Details</span>
                    </div>
                    
                )
            }
          </div>
        </CardContent>
    </Card>
  )
}

export default GamePublicCard
