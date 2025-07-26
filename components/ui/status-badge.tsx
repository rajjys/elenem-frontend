import { GameStatus } from "@/schemas";
import { Badge } from "./badge";

export const getStatusBadge = (status: GameStatus, score?: { home: number; away: number }) => {
        switch (status) {
            case GameStatus.IN_PROGRESS:
                return <Badge variant="destructive" className="animate-pulse">Live</Badge>;
            case GameStatus.COMPLETED:
                return <Badge variant="success">Final</Badge>;
            case GameStatus.SCHEDULED:
                return <Badge variant="outline">Upcoming</Badge>;
            case GameStatus.CANCELLED:
                return <Badge variant="destructive">Cancelled</Badge>;
            case GameStatus.POSTPONED:
                return <Badge variant="secondary">Postponed</Badge>;
            default:
                return null;
        }
    };