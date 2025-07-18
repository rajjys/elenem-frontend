// app/admin/layout.tsx or components/layouts/SystemAdminLayout.tsx
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, ReactNode, useEffect, useRef, RefObject } from 'react';
import {
    FiHome, FiGrid, FiUsers, FiDollarSign, FiSettings, FiServer, FiShield,
    FiGlobe, FiHelpCircle, FiFileText, FiSearch, FiSmartphone, FiUser, FiLogOut,
    FiChevronDown, FiChevronRight, FiMenu, FiX, FiBarChart2, FiSliders, FiBell,
    FiShoppingBag, FiFilm, FiSpeaker, FiBriefcase, FiZap, FiDatabase, FiMessageSquare, FiAward, FiEdit3, FiBox,
    FiVolume2,
    FiPackage,
    FiList,
    FiTrendingUp,
    FiCreditCard,
    FiActivity,
    FiAlertTriangle,
    FiCode,
    FiLock,
    FiLayout,
    FiMail,
    FiBookOpen,
    FiTv,
    FiTerminal
} from 'react-icons/fi';
import { useAuthStore } from '@/store/auth.store';
import AppLayout from '@/components/layouts/AppLayout';

interface SystemAdminLayoutProps {
    children: ReactNode;
}

const systemNavItems = [
  {
    label: "Dashboard",
    icon: FiGrid,
    subItems: [
      { label: "Overview", basePath: "/admin/dashboard", icon: FiGrid },
      { label: "Platform Analytics", basePath: "/admin/analytics", icon: FiBarChart2 },
    ],
  },
  {
    label: "Platform Core",
    icon: FiBox,
    subItems: [
      { label: "Manage Tenants", basePath: "/admin/tenants", icon: FiUsers },
      { label: "Manage Leagues", basePath: "/admin/leagues", icon: FiTv},
      { label: "Manage Teams", basePath: "/admin/teams", icon: FiUsers},
      { label: "Manage All Users", basePath: "/admin/users", icon: FiUsers },
      { label: "Roles & Permissions", basePath: "/admin/roles", icon: FiShield },
      { label: "Global Announcements", basePath: "/admin/announcements", icon: FiVolume2 },
      { label: "Data Management", basePath: "/admin/data", icon: FiDatabase },
    ],
  },
  {
    label: "Financials & Billing",
    icon: FiDollarSign,
    subItems: [
      { label: "Subscription Plans", basePath: "/admin/financials/plans", icon: FiPackage },
      { label: "Tenant Subscriptions", basePath: "/admin/financials/subscriptions", icon: FiList },
      { label: "Platform Revenue", basePath: "/admin/financials/revenue", icon: FiTrendingUp },
      { label: "Payment Gateways", basePath: "/admin/financials/gateways", icon: FiCreditCard },
    ],
  },
  {
    label: "System & Infrastructure",
    icon: FiServer,
    subItems: [
      { label: "System Status", basePath: "/admin/system/status", icon: FiActivity },
      { label: "Error Logs", basePath: "/admin/system/logs", icon: FiAlertTriangle },
      { label: "API & Integrations", basePath: "/admin/system/api", icon: FiCode },
      { label: "Security Settings", basePath: "/admin/system/security", icon: FiLock },
    ],
  },
  {
    label: "Customization",
    icon: FiEdit3,
    subItems: [
      { label: "Platform Appearance", basePath: "/admin/customization/theme", icon: FiLayout },
      { label: "Email Templates", basePath: "/admin/customization/emails", icon: FiMail },
    ],
  },
  {
    label: "Support",
    icon: FiHelpCircle,
    subItems: [
      { label: "Helpdesk", basePath: "/admin/support/helpdesk", icon: FiHelpCircle },
      { label: "Documentation", basePath: "/admin/support/docs", icon: FiBookOpen },
    ],
  },
];
export default function SystemAdminLayout({ children }: SystemAdminLayoutProps) {

    return (
        <AppLayout
          navItems={systemNavItems}
          themeColor="indigo" // Or 'blue', 'emerald', etc., as defined in tailwind.config.js
          headerTitle="System Admin"
          logoIcon={FiAward}
        >
      {children}
    </AppLayout>
    );
}