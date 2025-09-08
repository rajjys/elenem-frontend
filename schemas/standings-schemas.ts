export interface Standing {
    team: {
        id: string;
        name: string;
        shortCode: string;
        slug: string;
        businessProfile: {
            logoUrl: string | null;
            bannerImageUrl: string | null;
        }
    };
    rank: number;
    points: number;
    form?: string | null;
    gamesPlayed: number;
    league: {
        id: string;
        name: string;
        slug: string;
    }
}