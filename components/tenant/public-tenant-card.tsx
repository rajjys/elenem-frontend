import Image from "next/image";
import Link from "next/link";
import { Card } from "../ui";
import { PublicTenantBasic } from "@/schemas";
import { ExternalLink, Shield, Users } from "lucide-react";
import { countryNameToCode } from "@/utils";

// --- Main Components ---
function PublicTenantCard({ tenant }: { tenant: PublicTenantBasic }) {

    const ROOT_DOMAIN = process.env.NODE_ENV === 'development' ? 
                        process.env.NEXT_PUBLIC_HOME_URL_LOCAL : process.env.NEXT_PUBLIC_HOME_URL;
    const protocol = process.env.NODE_ENV === 'development' ? 'http://' : 'https://';
    const tenantUrl = `${protocol}${tenant.slug}.${ROOT_DOMAIN}`;
    
    return (
        <Link href={tenantUrl} target="_blank" rel="noopener noreferrer">
            <Card className="overflow-hidden transition-shadow hover:shadow-xl duration-300 ease-in-out group mb-4 w-full cursor-pointer">
              <div className="md:flex">
                {/* Left: Banner + Logo */}
                <div className="md:w-1/3 md:flex-shrink-0">
                    <div className="relative h-48 w-full md:h-full bg-slate-200 dark:bg-slate-700">
                        {/* Banner Image */}
                        <Image
                        src={
                            tenant.businessProfile?.bannerAsset?.url ||
                            `https://placehold.co/600x400/aaa/666?text=${tenant.tenantCode}`
                        }
                        alt={`${tenant.name} banner`}
                        fill
                        className="object-cover"
                        />

                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/30 dark:bg-black/40 z-10" />

                        {/* Logo */}
                        <div className="absolute bottom-2 left-2 h-18 w-18 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-white dark:border-black shadow-md z-20">
                            {tenant.businessProfile?.logoAsset?.url ? (
                                <Image
                                src={tenant.businessProfile.logoAsset.url}
                                alt={`${tenant.name} logo`}
                                fill
                                className="object-cover"
                                />
                            ) : (
                                <span className="text-xs text-gray-600 dark:text-gray-300">Logo</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Right: Content */}
                <div className="md:w-2/3 p-4 flex flex-col bg-white dark:bg-gray-900">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors duration-300 ease-in-out">
                        {tenant.name}
                    </h2>
                    <p className="text-xs md:text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
                        {tenant.tenantCode} • {tenant.sportType} • {countryNameToCode[tenant.country]}
                    </p>
                    {/* Website */}
                    <div className="mt-1 inline-flex items-center text-xs md:text-sm text-blue-600 dark:text-blue-400">
                        {(tenant.businessProfile?.website || tenantUrl).replace(/^https?:\/\//, "")}
                        <ExternalLink className="ml-1 w-3.5 h-3.5" />
                    </div>
                    {/* Footer info */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-6 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>{tenant._count?.leagues ?? 0} Leagues</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>{tenant._count?.teams ?? 0} Teams</span>
                        </div>
                    </div>
                </div>
              </div>
            </Card>
        </Link>
        );

}

export default PublicTenantCard;