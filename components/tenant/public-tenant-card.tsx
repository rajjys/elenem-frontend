import Image from "next/image";
import Link from "next/link";
import { Card } from "../ui";
import { PublicTenantBasic } from "@/schemas";
import { ExternalLink, Shield, Users } from "lucide-react";
import { countryNameToCode, buildTenantUrl } from "@/utils";

// --- Main Components ---
function PublicTenantCard({ tenant }: { tenant: PublicTenantBasic }) {

    const tenantUrl = buildTenantUrl(tenant.slug);
    
    return (
        <Link href={tenantUrl} target="_blank" rel="noopener noreferrer">
            <Card className="overflow-hidden transition-shadow hover:shadow-xl duration-300 ease-in-out group mb-4 w-full cursor-pointer">
              <div className="md:flex">
                {/* Left: Banner + Logo */}
                <div className="md:w-1/3 md:flex-shrink-0">
                    <div className="relative h-48 w-full md:h-full bg-line ">
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
                        <div className="absolute inset-0 bg-black/30 z-10" />

                        {/* Logo */}
                        <div className="absolute bottom-2 left-2 h-18 w-18 rounded-full bg-line flex items-center justify-center overflow-hidden border-2 border-white shadow-md z-20">
                            {tenant.businessProfile?.logoAsset?.url ? (
                                <Image
                                src={tenant.businessProfile.logoAsset.url}
                                alt={`${tenant.name} logo`}
                                fill
                                className="object-cover"
                                />
                            ) : (
                                <span className="text-xs text-ink-muted ">Logo</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Right: Content */}
                <div className="md:w-2/3 p-4 flex flex-col bg-surface ">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-ink group-hover:text-blue-900 transition-colors duration-300 ease-in-out">
                        {tenant.name}
                    </h2>
                    <p className="text-xs md:text-sm font-mono text-ink-muted mb-2">
                        {tenant.tenantCode} • {tenant.sportType} • {countryNameToCode[tenant.country]}
                    </p>
                    {/* Website */}
                    <div className="mt-1 inline-flex items-center text-xs md:text-sm text-ink-muted ">
                        { tenant.businessProfile?.website || tenantUrl }
                        <ExternalLink className="ml-1 w-3.5 h-3.5" />
                    </div>
                    {/* Footer info */}
                    <div className="mt-4 pt-4 border-t border-line flex items-center space-x-6 text-xs sm:text-sm text-ink ">
                        <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-accent-text " />
                        <span>{tenant._count?.leagues ?? 0} Leagues</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-accent-text " />
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