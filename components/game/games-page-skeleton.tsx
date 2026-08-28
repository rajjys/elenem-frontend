import { Card, CardContent, CardHeader, Skeleton } from "../ui";

// --- Skeleton Component ---
function GamesPageSkeleton() {
    return (
        <div className="space-y-8">
            {/* Date Carousel Skeleton */}
            <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-10 rounded-full bg-line " />
                <div className="flex-1 overflow-hidden">
                <div className="flex space-x-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-20 w-24 rounded-lg flex-shrink-0 bg-line "
                    />
                    ))}
                </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full bg-line " />
            </div>

            {/* Game List Skeleton */}
            {Array.from({ length: 2 }).map((_, i) => (
                <Card
                key={i}
                className="overflow-hidden pb-2 bg-surface border border-line "
                >
                <CardHeader>
                    <Skeleton className="h-7 w-1/3 bg-line " />
                </CardHeader>
                <CardContent className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full rounded-lg bg-line " />
                    <Skeleton className="h-48 w-full rounded-lg bg-line " />
                    <Skeleton className="h-48 w-full rounded-lg bg-line " />
                </CardContent>
                </Card>
            ))}
        </div>

    );
}
export default GamesPageSkeleton