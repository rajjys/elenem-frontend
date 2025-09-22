import { GameStatus } from "@/schemas";
import { Badge } from "./badge";

export const getStatusBadge = (status: GameStatus) => {
        switch (status) {
            case GameStatus.IN_PROGRESS:
                return <Badge variant="destructive" className="animate-pulse">En cours</Badge>;
            case GameStatus.COMPLETED:
                return <Badge variant="success">Terminé</Badge>;
            case GameStatus.SCHEDULED:
                return <Badge variant="outline">Programmé</Badge>;
            case GameStatus.CANCELLED:
                return <Badge variant="destructive">Annulé</Badge>;
            case GameStatus.POSTPONED:
                return <Badge variant="secondary">Reporté</Badge>;
            default:
                return null;
        }
    };