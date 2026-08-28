import { Card, Skeleton } from "../ui";

// --- Skeleton Components ---
function PublicTenantCardSkeleton() {
    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-lg bg-surface border border-line ">
            <div className="md:flex">
                <div className="md:w-1/3">
                <Skeleton className="h-48 w-full md:h-full bg-line " />
                </div>
                <div className="md:w-2/3 p-6 flex flex-col">
                <Skeleton className="h-7 w-3/4 mb-2 bg-line " />
                <Skeleton className="h-4 w-1/4 mb-4 bg-line " />
                <Skeleton className="h-4 w-full mb-2 bg-line " />
                <Skeleton className="h-4 w-5/6 mb-4 bg-line " />
                <div className="mt-auto flex items-center space-x-6">
                    <Skeleton className="h-6 w-20 bg-line " />
                    <Skeleton className="h-6 w-20 bg-line " />
                </div>
                </div>
            </div>
        </Card>

    );
}

export default PublicTenantCardSkeleton;