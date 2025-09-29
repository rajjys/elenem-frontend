import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import {
  MoreVertical,
  Eye,
  UserPlus,
  Settings,
  Building2,
  Crown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { capitalize } from '@/utils';
import { useContextualLink } from '@/hooks';

interface LeagueCardProps {
  league: {
    id: string;
    name: string;
    logoUrl?: string;
    businessProfile?: {
      logoAsset?: {
        url?: string;
      };
    };
    isActive?: boolean;
    teams?: { id: string }[];
    managingUsers?: { id: string }[];
  };
  tenant?: {
    sportType?: string;
  };
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, tenant }) => {
    const { buildLink } = useContextualLink();
    const logoUrl = league.businessProfile?.logoAsset?.url;

  return (
    <Link href={buildLink('/league/dashboard', { ctxLeagueId: league.id })} key={league.id}>
      <div className="p-2 border border-gray-200 rounded-lg hover:bg-gray-200/30 transition-colors my-1">
        <div className="flex sm:items-center flex-wrap justify-between gap-2 sm:gap-4 mb-2">
          {/* Identity */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Avatar src={logoUrl} name={league.name} size={40} className="shrink-0" />
            ) : (
              <Avatar name={league.name} size={40} className="shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                {league.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{capitalize(tenant?.sportType || '')}</span>
                <span>•</span>
                <span>Saison 2025</span>
              </div>
            </div>
          </div>
          {/* Status & Actions */}
          <div className="flex items-center gap-2">
            <Badge variant={league.isActive ? 'success' : 'secondary'} className="text-xs">
              {league.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled>
                <span className='p-1.5 bg-slate-100 hover:bg-slate-200 transition-colors duration-200 rounded-full shadow-sm cursor-pointer'>
                  <MoreVertical className="h-4 w-4" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Détails
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ajouter Manager
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats – Hidden on XS */}
        <div className="hidden sm:grid grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span>{league.teams?.length || 0} Équipes</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            <span>{league.managingUsers?.length || 0} Managers</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 font-semibold">
            <TrendingUp className="h-3 w-3" />
            <span>$0</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
