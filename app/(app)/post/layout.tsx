"use client";

import React, { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { FileText } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { LoadingSpinner } from '@/components/ui';

export default function PostLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const postId = params?.postId;
  const navItems = [{ items: [{ label: 'Article', basePath: `/post/${postId}`, icon: FileText }] }];

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <AppLayout navItems={navItems}>{children}</AppLayout>
    </React.Suspense>
  );
}
