import { SportType } from "@/schemas";
import {
  BaseballIcon,
  BasketballIcon,
  CricketIcon,
  FootballIcon,
  GolfIcon,
  HockeyIcon,
  SoccerBallIcon,
  TennisBallIcon,
} from "@phosphor-icons/react";
import {
  Volleyball,
  Trophy,
} from "lucide-react"; // Add icons as needed

const sportIconMap: Record<SportType, React.ElementType> = {
  [SportType.FOOTBALL]: SoccerBallIcon,
  [SportType.BASKETBALL]: BasketballIcon,
  [SportType.VOLLEYBALL]: Volleyball,
  [SportType.TENNIS]: TennisBallIcon,
  [SportType.RUGBY]: FootballIcon,
  [SportType.AMERICAN_FOOTBALL]: FootballIcon,
  [SportType.BASEBALL]: BaseballIcon,
  [SportType.HOCKEY]: HockeyIcon,
  [SportType.GOLF]: GolfIcon,
  [SportType.CRICKET]: CricketIcon,
  [SportType.OTHER]: Trophy,
};

export const getSportIcon = (sportType?: SportType): React.ElementType => {
  return sportIconMap[sportType ?? SportType.OTHER] || Trophy;
};
