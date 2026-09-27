// The spinner's own file, not the `@/components/ui` barrel: a loading boundary is fetched with
// every page of the product site, and the barrel brought the whole UI kit with it — the rich-text
// editor, the command palette, every select — about 120 KB compressed on pages that use none of it.
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner />
    </div>
  );
}
