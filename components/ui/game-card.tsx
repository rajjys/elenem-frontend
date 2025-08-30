import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { Avatar, Button, Badge, Card, CardContent } from ".";
import { GameDetails, GameStatus } from "@/schemas";

interface GameCardProps {
  game: GameDetails;
  buildLink: (path: string) => string;
  getStatusBadge: (status: GameStatus, score?: { home: number; away: number }) => React.ReactNode;
}

export const GameCard: React.FC<GameCardProps> = ({ game, buildLink, getStatusBadge }) => {
  const formatDate = new Date(game.dateTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formatTime = "12:00AM";
  return (
    <Card key={game.id} className="hover:shadow-md transition-shadow border border-gray-200 rounded-lg m-2">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row sm:items-center justify-between gap-6">
          {/* Left Section */}
          <div className="flex-1">
            {/* Top Meta */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Badge className="text-xs border border-gray-300 text-gray-800 hidden">{game.league.name}</Badge>
                <span className="text-sm text-gray-500 hidden md:inline">{game.week}</span>
                {getStatusBadge(game.status)}
              </div>
              {/* Date & Time */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400 hidden sm:inline" />
                  {formatDate}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400 hidden sm:inline" />
                  {formatTime}
                </div>
                {(
                  <div className="flex items-center gap-1 hidden md:flex">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {game.homeVenue?.name || game.location || "Stadium 1"}
                  </div>
                )}
              </div>
            </div>

            {/* Teams Section */}
            <div className="flex items-center justify-around gap-4 mb-4">
              {/* Home Team */}
              <div className="flex items-center lg:justify-center gap-3 w-full xs:w-auto">
                <Avatar name={game.homeTeam.name} src={game.homeTeam.businessProfile.logoUrl || null} size={40} />
                <div>
                  <h3 className="font-semibold text-gray-900 block md:hidden">{game.homeTeam.shortCode}</h3>
                  <h3 className="font-semibold text-gray-900 hidden md:block">{game.homeTeam.name}</h3>
                  {game.homeTeam.record ? 
                      <p className="text-sm text-gray-500 hidden sm:block">{game.homeTeam.record}</p> :
                      <p className="text-sm text-gray-500 hidden sm:block">0-0</p>}
                </div>
              </div>

              {/* Score or VS */}
              <div className="text-center min-w-[80px] text-gray-700">
                {game.status === GameStatus.IN_PROGRESS || game.status === GameStatus.COMPLETED ? (
                  <div className="text-xl font-bold">{game.homeScore} - {game.awayScore}</div>
                ) : (
                  <div className="text-lg font-medium">VS</div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center lg:justify-center gap-3 w-full xs:w-auto justify-end">
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900 block md:hidden">{game.awayTeam.shortCode}</h3>
                  <h3 className="font-semibold text-gray-900 hidden md:block">{game.awayTeam.name}</h3>
                  { game.awayTeam.record ? 
                    <p className="text-sm text-gray-500 hidden sm:block">{game.awayTeam.record}</p> :
                    <p className="text-sm text-gray-500 hidden sm:block">0-0</p>
                  }
                </div>
                <Avatar name={game.awayTeam.name} src={game.awayTeam.businessProfile.logoUrl || null} size={40} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 min-w-[130px]">
            <Link href={buildLink("/game/dashboard")}>
              <Button className="w-full text-sm">View Details</Button>
            </Link>
            {game.status === GameStatus.SCHEDULED && (
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 text-sm">
                <Users className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
