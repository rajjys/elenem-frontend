import { GameStatus } from "@/schemas";
import { Badge } from "./badge";

export const getStatusBadge = (status: GameStatus, className = "") => {
    const baseClass = `text-xs ${className}`.trim();
    switch (status) {
        case GameStatus.IN_PROGRESS:
            return <Badge variant="destructive" className={`animate-pulse ${baseClass}`}>En cours</Badge>;
        case GameStatus.COMPLETED:
            return <Badge variant="success" className={baseClass}>Terminé</Badge>;
        case GameStatus.SCHEDULED:
            return <Badge variant="outline" className={baseClass}>Programmé</Badge>;
        case GameStatus.CANCELLED:
            return <Badge variant="destructive" className={baseClass}>Annulé</Badge>;
        case GameStatus.POSTPONED:
            return <Badge variant="secondary" className={baseClass}>Reporté</Badge>;
        default:
            return null;
    }
};