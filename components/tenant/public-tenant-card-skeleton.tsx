import { Card, Skeleton } from "../ui";

// --- Skeleton Components ---
function PublicTenantCardSkeleton() {
    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="md:flex">
                <div className="md:w-1/3">
                <Skeleton className="h-48 w-full md:h-full bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="md:w-2/3 p-6 flex flex-col">
                <Skeleton className="h-7 w-3/4 mb-2 bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-4 w-1/4 mb-4 bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-4 w-full mb-2 bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-4 w-5/6 mb-4 bg-slate-200 dark:bg-slate-700" />
                <div className="mt-auto flex items-center space-x-6">
                    <Skeleton className="h-6 w-20 bg-slate-200 dark:bg-slate-700" />
                    <Skeleton className="h-6 w-20 bg-slate-200 dark:bg-slate-700" />
                </div>
                </div>
            </div>
        </Card>

    );
}

export default PublicTenantCardSkeleton;