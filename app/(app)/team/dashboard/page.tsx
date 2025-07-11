'use client';

import { StatsCard } from "@/components/ui/";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/";
import {
  Users,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  UserPlus,
  Settings,
  FileText,
  Award,
  Clock,
  MapPin,
  Phone,
  Mail,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContextualLink } from "@/hooks";

const TeamDashboard = () => {

  const { buildLink } = useContextualLink();

  const teamStats = [
    {
      title: "Total Players",
      value: "23",
      icon: Users,
      bgColorClass: "bg-blue-400",
      textColorClass: "text-white",
      description: "+2 this month",
      href: buildLink("/team/roster"),
      trend: { value: 8.7, isPositive: true, timespan: "season" }
    },
    {
      title: "Wins This Season",
      value: "12",
      icon: Trophy,
      bgColorClass: "bg-green-400",
      textColorClass: "text-white",
      description: "75% win rate",
      href: buildLink("/team/stats"),
      trend: { value: 15.2, isPositive: true, timespan: "season" }
    },
    {
      title: "Goals Scored",
      value: "34",
      icon: Target,
      bgColorClass: "bg-orange-400",
      textColorClass: "text-white",
      description: "+8 this month",
      href: buildLink("/team/stats"),
      trend: { value: 23.5, isPositive: true, timespan: "season" }
    },
    {
      title: "League Position",
      value: "2nd",
      icon: Award,
      bgColorClass: "bg-red-400",
      textColorClass: "text-white",
      description: "↑1 from last week",
      href: buildLink("/team/standings"),
      trend: { value: 12.0, isPositive: true, timespan: "season" }
    }
  ];

  const recentGames = [
    {
      id: 1,
      opponent: "Thunder Bolts",
      opponentLogo: "⚡",
      result: "W",
      score: "3-1",
      date: "2024-01-08",
      venue: "Home"
    },
    {
      id: 2,
      opponent: "Fire Dragons",
      opponentLogo: "🔥",
      result: "W", 
      score: "2-0",
      date: "2024-01-05",
      venue: "Away"
    },
    {
      id: 3,
      opponent: "Ice Warriors",
      opponentLogo: "❄️",
      result: "L",
      score: "1-2",
      date: "2024-01-02",
      venue: "Home"
    }
  ];

  const upcomingGames = [
    {
      id: 1,
      opponent: "Storm Riders",
      opponentLogo: "🌪️",
      date: "2024-01-15",
      time: "15:00",
      venue: "Central Stadium"
    },
    {
      id: 2,
      opponent: "Golden Eagles",
      opponentLogo: "🦅",
      date: "2024-01-18",
      time: "18:30",
      venue: "Away"
    }
  ];

  const topPlayers = [
    {
      id: 1,
      name: "Marcus Johnson",
      position: "Forward",
      goals: 12,
      assists: 8,
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Alex Rivera",
      position: "Midfielder",
      goals: 6,
      assists: 15,
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "David Chen",
      position: "Defender",
      goals: 2,
      assists: 4,
      avatar: "/placeholder.svg"
    },
    {
      id: 4,
      name: "Sarah Williams",
      position: "Goalkeeper",
      goals: 0,
      assists: 1,
      avatar: "/placeholder.svg"
    }
  ];

  const teamAnnouncements = [
    {
      id: 1,
      title: "Training Schedule Update",
      content: "Training moved to Tuesday 7PM due to field maintenance",
      time: "2 hours ago",
      type: "schedule"
    },
    {
      id: 2,
      title: "New Player Welcome",
      content: "Welcome Jake Morrison to the team! First practice tomorrow.",
      time: "1 day ago",
      type: "roster"
    },
    {
      id: 3,
      title: "Match Report Available",
      content: "Detailed analysis of yesterday's game against Thunder Bolts",
      time: "2 days ago",
      type: "report"
    }
  ];

  return (
      <div className="space-y-8">
        {/* Team Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white">
              🏆
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lightning Strikers</h1>
              <p className="text-muted-foreground">Premier League Division A • Founded 2018</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Team Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Games */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Recent Games
              </CardTitle>
              <CardDescription>Last 3 matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{game.opponentLogo}</div>
                    <div>
                      <p className="font-medium text-sm">{game.opponent}</p>
                      <p className="text-xs text-muted-foreground">{game.date} • {game.venue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={game.result === 'W' ? 'default' : game.result === 'L' ? 'destructive' : 'secondary'}>
                      {game.result}
                    </Badge>
                    <p className="text-sm font-medium mt-1">{game.score}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Games */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Games
              </CardTitle>
              <CardDescription>Next 2 matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{game.opponentLogo}</div>
                    <div>
                      <p className="font-medium text-sm">{game.opponent}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{game.date} {game.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{game.venue}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Team Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Team News
              </CardTitle>
              <CardDescription>Latest announcements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{announcement.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {announcement.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Player Roster */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Player Roster
                </CardTitle>
                <CardDescription>Top performing players this season</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All Players
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topPlayers.map((player) => (
                <div key={player.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Avatar className="w-12 h-12" name={player.name.split(' ').map(n => n[0]).join('')}>
                    </Avatar>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="w-4 h-4 mr-2" />
                          Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h4 className="font-medium text-sm">{player.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{player.position}</p>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      {player.goals} goals
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {player.assists} assists
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default TeamDashboard;