// components/standings/standings-table-skeleton.tsx
import { Skeleton } from "@/components/ui/";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";

export function StandingsTableSkeleton() {
  return (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"><Skeleton className="h-5 w-10" /></TableHead>
                    <TableHead className="min-w-[200px]"><Skeleton className="h-5 w-32" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-8" /></TableHead>
                    <TableHead className="font-bold"><Skeleton className="h-5 w-10" /></TableHead>
                    <TableHead className="w-[120px]"><Skeleton className="h-5 w-24" /></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
