'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * The top of the sidebar: brand, then the dock control.
 *
 * The logo lives here rather than in the navbar because the sidebar is the permanent frame — the
 * navbar is a strip of optional tools (search, notifications, help) that could be removed without
 * the app losing its identity. So the sidebar starts at the top of the viewport and the brand
 * starts with it.
 *
 * Docked (narrow) the brand disappears entirely and only the control remains, centred on the same
 * axis as the nav icons below it, so the rail reads as one column instead of a column with a
 * stray header.
 */
export function SidebarBrand({
  isOpen,
  onToggle,
  logoUrl = '/logos/elenem-sport.png',
  href = '/',
}: {
  isOpen: boolean;
  onToggle: () => void;
  logoUrl?: string;
  href?: string;
}) {
  const Icon = isOpen ? PanelLeftClose : PanelLeft;

  return (
    <div
      className={cn(
        'flex h-16 shrink-0 items-center border-b border-line px-3',
        isOpen ? 'justify-between gap-2' : 'justify-center',
      )}
    >
      {isOpen && (
        <Link href={href} className="flex min-w-0 items-center" aria-label="Elenem">
          <Image
            src={logoUrl}
            alt="Elenem"
            width={112}
            height={36}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? 'Réduire le menu' : 'Déployer le menu'}
        aria-expanded={isOpen}
        title={isOpen ? 'Réduire le menu' : 'Déployer le menu'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
