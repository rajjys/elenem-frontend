// app/post/layout.tsx
"use client";
import React, { ReactNode } from 'react';
import {
    FiBarChart2,
    FiGrid,
} from 'react-icons/fi'; 
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';
import { useParams } from 'next/navigation';

interface PostAdminLayoutProps {
    children: ReactNode;
}

export default function PostAdminLayout({ children }: PostAdminLayoutProps) {
    const params = useParams();
    const postId = params?.postId;
      // Define navigation structure for Team Admin
    const teamNavItems = [
      {
        label: "Dashboard",
        icon: FiGrid,
        subItems: [
              { label: "Overview", basePath:`/post/${postId}`, icon: FiBarChart2 },
            ]
      },
    ];

    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <AppLayout navItems={teamNavItems} themeColor="blue">
          {children}
        </AppLayout>
      </React.Suspense>
    );
}