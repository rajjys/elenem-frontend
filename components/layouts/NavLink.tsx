import Link from 'next/link';
import { cn } from '@/utils/cn';
import { Tooltip } from '@/components/ui/tooltip';

interface NavLinkProps {
  item: { label: string; basePath: string; icon: React.ElementType };
  currentPath: string;
  isSidebarOpen: boolean;
  isFlyout?: boolean;
  onClick?: () => void;
  buildLink: (basePath: string) => string;
}

/**
 * A single sidebar link.
 *
 * Colours come from tokens only. The previous version set `backgroundColor` and `color` as inline
 * styles from `var(--color-blue-100)` / `var(--color-blue-600)` — Tailwind's built-in palette,
 * which has no dark variant. Inline styles also beat every class, so the active link rendered as
 * pale blue on pale blue in dark mode and was effectively unreadable.
 */
export const NavLink: React.FC<NavLinkProps> = ({
  item,
  currentPath,
  isSidebarOpen,
  isFlyout,
  onClick,
  buildLink,
}) => {
  const finalHref = buildLink(item.basePath);
  // Match nested routes too, so /league/settings/general keeps /league/settings lit.
  const isActive = currentPath === item.basePath || currentPath.startsWith(`${item.basePath}/`);
  const Icon = item.icon;
  const showLabel = isSidebarOpen || isFlyout;

  const link = (
    <Link
      href={finalHref}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
        // The tinted fill alone carries "current" — a left border on top of it was one signal too
        // many, and it broke the alignment of the icon column.
        isActive
          ? 'bg-accent-soft font-medium text-accent-text'
          : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
        !showLabel && 'justify-center',
        isFlyout && 'w-full',
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {showLabel && <span className="truncate">{item.label}</span>}
    </Link>
  );

  // Collapsed, the label is the only thing distinguishing one icon from the next, so the native
  // `title` delay (roughly a second) made the rail unusable. Tooltip shows in 150ms.
  return (
    <Tooltip label={item.label} disabled={showLabel}>
      {link}
    </Tooltip>
  );
};
