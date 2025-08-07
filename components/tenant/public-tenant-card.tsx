import Image from "next/image";
import Link from "next/link";
import { Card } from "../ui";
import { SportType } from "@/schemas";
import { Shield, Users } from "lucide-react";

// --- Helper Types ---
interface Tenant {
  id: string;
  name: string;
  slug: string;
  tenantCode: string;
  description?: string | null;
  bannerImageUrl?: string | null;
  logoUrl?: string | null;
  sportType: SportType;
  country?: string | null;
  _count: {
    leagues: number;
    teams: number;
  };
}
// --- Main Components ---
function PublicTenantCard({ tenant }: { tenant: Tenant }) {

    const ROOT_DOMAIN = process.env.NODE_ENV === 'development' ? 
                        process.env.NEXT_PUBLIC_HOME_URL_LOCAL : process.env.NEXT_PUBLIC_HOME_URL;
    const protocol = process.env.NODE_ENV === 'development' ? 'http://' : 'https://';
    const tenantUrl = `${protocol}${tenant.slug}.${ROOT_DOMAIN}`;
    
    return (
        <Link href={tenantUrl} target="_blank" rel="noopener noreferrer">
            <Card className="overflow-hidden transition-shadow hover:shadow-xl duration-300 group mb-2">
                <div className="md:flex">
                    <div className="md:w-1/3 md:flex-shrink-0">
                        <div className="relative h-48 w-full md:h-full">
                            <Image
                                src={tenant.bannerImageUrl || `https://placehold.co/600x400/eee/ccc?text=${tenant.name}`}
                                alt={`${tenant.name} banner`}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    </div>
                    <div className="md:w-2/3 p-6 flex flex-col bg-card">
                        <h2 className="text-2xl font-bold tracking-tight text-card-foreground group-hover:text-primary">
                            {tenant.name}
                        </h2>
                        <p className="text-sm font-mono text-muted-foreground mb-3">{tenant.tenantCode}</p>
                        <p className="text-muted-foreground text-sm line-clamp-2 flex-grow">
                            {tenant.description || 'A leading organization in the world of sports.'}
                        </p>
                        <div className="mt-4 pt-4 border-t flex items-center space-x-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>{tenant._count.leagues} Leagues</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <span>{tenant._count.teams} Teams</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

export default PublicTenantCard;