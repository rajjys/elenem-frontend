import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/** « Page 2 sur 4 », with links either side — for any list served in pages. */
export function Pager({ page, pages, hrefOf }: { page: number; pages: number; hrefOf: (page: number) => string }) {
  if (pages <= 1) return null;
  const btn = 'inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium';
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefOf(page - 1)} className={cn(btn, 'text-ink hover:border-line-strong')}>
          <ChevronLeft className="h-4 w-4" aria-hidden /> Précédent
        </Link>
      ) : (
        <span aria-hidden className={cn(btn, 'text-line-strong')}>
          <ChevronLeft className="h-4 w-4" /> Précédent
        </span>
      )}
      <span className="text-sm text-ink-muted">
        Page <span className="font-semibold text-ink">{page}</span> sur {pages}
      </span>
      {page < pages ? (
        <Link href={hrefOf(page + 1)} className={cn(btn, 'text-ink hover:border-line-strong')}>
          Suivant <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(btn, 'text-line-strong')}>
          Suivant <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
