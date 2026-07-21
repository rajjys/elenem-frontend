import { GameStatus } from "@/schemas";
import { Badge } from "./badge";

export const getStatusBadge = (status: GameStatus, className = "") => {
    const baseClass = `text-xs ${className}`.trim();
    switch (status) {
        case GameStatus.LIVE:
            return <Badge variant="destructive" className={`animate-pulse ${baseClass}`}>En cours</Badge>;
        case GameStatus.PAUSED:
            return <Badge variant="secondary" className={baseClass}>En pause</Badge>;
        case GameStatus.COMPLETED:
            return <Badge variant="success" className={baseClass}>Terminé</Badge>;
        case GameStatus.DRAFT:
            return <Badge variant="outline" className={baseClass}>Brouillon</Badge>;
        case GameStatus.SCHEDULED:
            return <Badge variant="outline" className={baseClass}>Programmé</Badge>;
        case GameStatus.CONFIRMED:
            return <Badge variant="outline" className={baseClass}>Confirmé</Badge>;
        case GameStatus.CANCELLED:
            return <Badge variant="destructive" className={baseClass}>Annulé</Badge>;
        case GameStatus.POSTPONED:
            return <Badge variant="secondary" className={baseClass}>Reporté</Badge>;
        case GameStatus.RESCHEDULED:
            return <Badge variant="secondary" className={baseClass}>Reprogrammé</Badge>;
        default:
            return null;
    }
};