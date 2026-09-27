import { cn } from '@/utils/cn';

/**
 * The DXScores identity, until there is a drawn logo (PHASE5A_PRODUCT_SITE §8.2).
 *
 * Set in type rather than loaded as an image, for the reasons the old Elenem PNG kept proving:
 * a PNG is one colour, so the dark-blue logo sat unreadable on the dark theme; it is a request on
 * every page; and it cannot follow the tokens. These are text on tokens, so they are right in both
 * themes, cost nothing, and change in one place when the real logo arrives.
 *
 * `dx` carries the name's idea — *d/dx*, the table derived from the scores — which is why it is
 * the part set in the accent.
 */

/** The square mark: app icon, favicon, avatar, the corner of the sign-in page. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-accent font-bold leading-none tracking-tight text-accent-ink',
        className,
      )}
    >
      <span className="text-[0.95em]">dx</span>
    </span>
  );
}

/** The name, set in type. Size it with a text utility on the parent or via `className`. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('select-none font-bold tracking-tight text-ink', className)}>
      <span className="text-accent-text">DX</span>Scores
    </span>
  );
}

/** Mark and name together — the header, the footer, the sidebar. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-lg', className)}>
      <BrandMark className={cn('h-7 w-7 text-sm', markClassName)} />
      <Wordmark />
    </span>
  );
}
