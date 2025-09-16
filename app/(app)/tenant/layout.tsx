// components/layouts/TenantAdminLayout.tsx
"use client";

import React, { ReactNode } from 'react';
import { FiAward } from 'react-icons/fi';

// Import reusable components and the new hook
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { Building2, Calendar, Home, Image, ListChecks, PieChart, Settings,  Trophy, Users, Volleyball } from 'lucide-react';
import { ArticleIcon } from '@phosphor-icons/react';

// --- Main Layout ---
const tenantNavItems = [
  {
    label: "Dashboard",
    icon: Home,
    subItems: [
      { label: "Overview", basePath: "/tenant/dashboard", icon: Home },
      //{ label: "Analytics", basePath: "/tenant/analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Competitions",
    icon: Trophy,
    subItems: [
      { label: "Leagues", basePath: "/tenant/leagues", icon: Trophy },
      { label: "Teams", basePath: "/tenant/teams", icon: Building2 },
      { label: "Seasons", basePath: "/tenant/seasons", icon: Calendar },
      { label: "Games", basePath: "/tenant/games", icon: Volleyball },
      { label: "Standings", basePath: "/tenant/standings", icon: ListChecks },
      { label: "Statistics", basePath: "/tenant/statistics", icon: PieChart },
    ],
  },
  {
    label: "Media",
    icon: Image,
    subItems: [
      { label: "Posts", basePath: "/tenant/posts", icon: ArticleIcon}
    ]
  },
  /*{
    label: "Shared Resources",
    icon: Layers,
    subItems: [
      //{ label: "Venues", basePath: "/tenant/venues", icon: MapPin },
      //{ label: "Players", basePath: "/tenant/players", icon: Users },
      //{ label: "Officials", basePath: "/tenant/officials", icon: UserCheck },
      //{ label: "Sponsors", basePath: "/tenant/sponsors", icon: Gift },
      //{ label: "Media & Content", basePath: "/tenant/media", icon: MonitorPlay },
    ],
  },
  {
    label: "Operations",
    icon: Megaphone,
    subItems: [
      //{ label: "Transfers", basePath: "/tenant/operations/transfers", icon: RefreshCcw },
      //{ label: "Announcements", basePath: "/tenant/operations/announcements", icon: Megaphone },
      //{ label: "Reports", basePath: "/tenant/operations/reports", icon: FileText },
      //{ label: "Billing", basePath: "/tenant/billing", icon: CreditCard },
    ],
  },
  {
    label: "Accounting",
    icon: CreditCard,
    subItems: [
      //{ label: "Tickets", basePath: "/tenant/accounting/tickets", icon: Ticket },
      //{ label: "Invoices", basePath: "/tenant/accounting/invoices", icon: FileText },
      //{ label: "Payments", basePath: "/tenant/accounting/payments", icon: CreditCard },
      //{ label: "Subscriptions", basePath: "/tenant/accounting/subscriptions", icon: CreditCard },
    ],
  },*/
  {
    label: "Platform",
    icon: Settings,
    subItems: [
      { label: "Account Settings", basePath: "/account/settings", icon: Settings },
      { label: "User Management", basePath: "/tenant/users", icon: Users },
      //{ label: "Roles & Permissions", basePath: "/tenant/roles", icon: ShieldCheck },
      //{ label: "Audit Logs", basePath: "/tenant/audit-logs", icon: FileClock },
      //{ label: "Integrations", basePath: "/tenant/integrations", icon: Network },
    ],
  },
  /*{
    label: "Support",
    icon: HelpCircle,
    subItems: [
      //{ label: "FAQs", basePath: "/tenant/support/faq", icon: HelpCircle },
      //{ label: "Issues", basePath: "/tenant/support/issues", icon: MessageSquareWarning },
    ],
  },*/
];
interface TenantAdminLayoutProps {
    children: ReactNode;
}
export default function TenantAdminLayout({ children }: TenantAdminLayoutProps) {
    
    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <AppLayout
            navItems={tenantNavItems}
            themeColor="blue" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
            headerTitle="Tenant Admin"
            logoIcon={FiAward}
          >
          {children}
        </AppLayout>
      </React.Suspense>
    );
}

