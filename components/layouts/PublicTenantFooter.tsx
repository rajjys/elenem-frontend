// components/layouts/TenantFooter.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TenantDetails } from "@/schemas";
import { api } from "@/services/api";
import { resolveTenantSlugFromHostname } from "@/utils";
import {
    Home,
    Trophy,
    Users,
    Calendar,
    Mail,
    MapPin,
    Calendar as CalendarIcon,
    Code,
    Phone,
    ExternalLink,
    Shield,
    Eye,
    Globe
} from "lucide-react";

export const PublicTenantFooter = () => {
    const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [currentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const hostname = window.location.hostname;
        const slug = resolveTenantSlugFromHostname(hostname);
        if (!slug) {
            return;
        }
        const fetchTenant = async () => {
            try {
                const tenantResponse = await api.get<TenantDetails>(`/public-tenants/${slug}`);
                setTenant(tenantResponse.data);
            } catch (err) {
                console.error("Failed to fetch tenant:", err);
            };
        }
        fetchTenant();
    }, []);

    if (!tenant) return null;  

    const { businessProfile, leagues = [], teams = [] } = tenant;
    // const teams = [];
    // const leagues = [];
    const creationYear = new Date(tenant.createdAt).getFullYear();
    const hasLeagues = leagues && leagues.length > 0;
    const hasTeams = teams && teams.length > 0;

    const stats = [
        { label: "Ligues", value: leagues?.length || 0, icon: Trophy },
        { label: "Équipes", value: teams?.length || 0, icon: Users },
        { label: "Année", value: creationYear, icon: CalendarIcon },
    ];
    const navItems = [
        { href: "/", label: "Accueil", icon: Home },
        { href: "/games", label: "Matchs", icon: Calendar },
        { href: "/standings", label: "Classement", icon: Trophy },
        { href: "/teams", label: "Équipes", icon: Users },
    ];
    return (
        <footer className="mb-14 md:mb-0 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border-t border-gray-300">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center space-x-4">
                                {businessProfile?.logoAsset?.url ? (
                                    <div className="relative w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        <Image
                                            src={businessProfile.logoAsset.url}
                                            alt={`${businessProfile.legalName || tenant.name} Logo`}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm flex items-center justify-center">
                                        <Shield className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-2xl text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        {tenant.name}
                                    </h3>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {businessProfile?.description ||
                                    "Organisation sportive engagée dans la promotion du sport, du fair-play et du développement personnel à travers la pratique sportive."
                                }
                            </p>
                            <div className="flex space-x-6 md:pt-2">
                                {stats.map((stat, index) => (
                                    <div key={index} className="text-center">
                                        <div className="flex items-center space-x-1 text-gray-700">
                                            <stat.icon className="w-4 h-4" />
                                            <span className="font-bold text-lg">{stat.value}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                            {/* <TrendingUp className="w-5 h-5 mr-2 text-orange-500" /> */}
                            Navigation
                        </h4>
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center text-sm text-gray-700 hover:text-orange-500 transition-all duration-200 group"
                                    >
                                        <item.icon className="w-4 h-4 mr-3 text-gray-500 group-hover:text-orange-500 transition-colors" />
                                        {item.label}
                                        <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
                            {/* <Mail className="w-5 h-5 mr-2 text-orange-500" /> */}
                            Contact
                        </h4>
                        <div className="space-y-2 text-sm">
                            {businessProfile?.contactEmail && (
                                <div className="flex items-center group">
                                    <Mail className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                    <a
                                        href={`mailto:${businessProfile.contactEmail}`}
                                        className="text-gray-700 hover:text-orange-500 transition-colors truncate"
                                    >
                                        {businessProfile.contactEmail}
                                    </a>
                                </div>
                            )}
                            {businessProfile?.phone && (
                                <div className="flex items-center group">
                                    <Phone className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                    <a
                                        href={`tel:${businessProfile.phone}`}
                                        className="text-gray-700 hover:text-orange-500 transition-colors"
                                    >
                                        {businessProfile.phone}
                                    </a>
                                </div>
                            )}
                            {(businessProfile?.city || businessProfile?.state || businessProfile?.region) && (
                                <div className="flex items-start group">
                                    <MapPin className="w-4 h-4 mr-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">
                                        {[businessProfile?.city, businessProfile?.state, businessProfile?.region]
                                            .filter(Boolean)
                                            .join(", ")}
                                        {tenant.country && `, ${tenant.country}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
                            {/* <Code className="w-5 h-5 mr-2 text-orange-500" /> */}
                            Information
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-700">
                                <CalendarIcon className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span>Créé en {creationYear}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Code className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span>
                                    Code: <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono border">{tenant.tenantCode}</code>
                                </span>
                            </div>
                            {tenant.visibility && (
                                <div className="flex items-center text-gray-700">
                                    <Eye className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                    <span className="capitalize">{tenant.visibility.toLowerCase()}</span>
                                </div>
                            )}
                            <div className="flex items-center text-gray-700">
                                <Globe className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                                <span className="hover:text-orange-500 transition-colors truncate cursor-pointer">
                                    {businessProfile.website ? `${businessProfile.website}` : `${tenant.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {(hasLeagues || hasTeams) && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {hasLeagues && (
                                <div>
                                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <Trophy className="w-4 h-4 mr-2" />
                                        Ligues Actives ({leagues.length})
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {leagues.slice(0, 6).map((league) => (
                                            <span
                                                key={league.id}
                                                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                {league.name}
                                            </span>
                                        ))}
                                        {leagues.length > 6 && (
                                            <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-500">
                                                +{leagues.length - 6} autres
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {hasTeams && (
                                <div>
                                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <Users className="w-4 h-4 mr-2" />
                                        Équipes ({teams.length})
                                    </h5>
                                    <div className="flex flex-wrap gap-1 md:gap-2">
                                        {teams.slice(0, 6).map((team) => (
                                            <span
                                                key={team.id}
                                                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                {team.shortCode || team.name}
                                            </span>
                                        ))}
                                        {teams.length > 6 && (
                                            <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-500">
                                                +{teams.length - 6} autres
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-300 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 space-y-2 md:space-y-0">
                        <div>
                            © {creationYear === currentYear ? currentYear : `${creationYear} - ${currentYear}`} {tenant.name}.
                            Tous droits réservés.
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                Statut: Actif
                            </span>
                            <span>•</span>
                            <span className="opacity-80 hover:opacity-100 transition-opacity">
                                Powered by <strong><a href="https://www.elenem.site" target="blank">Elenem</a></strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};