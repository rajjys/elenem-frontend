import { Construction } from 'lucide-react';

/**
 * A page that is deliberately not built yet, saying so once.
 *
 * The nine public-site routes it stands in for each rendered their own English string — "Standings
 * Page Not Implemented Yet", "Page en revue. Revenez plus tard", "PlayoffPage" — written at
 * different times by different hands, none of them in the product's language and none of them
 * saying when.
 *
 * This is **not** a licence to add placeholder pages. `nav-items.ts` holds the standing rule: a
 * navigation entry may only exist if its destination renders real content today, and none of these
 * routes is in a sidebar. They exist because the public footer links to them and because the public
 * site is item 19 — so the honest thing is one component that says the same true sentence
 * everywhere, until Phase 5 replaces each of them with a page.
 */
export function ComingWithLaunch({
  title,
  what,
}: {
  title: string;
  /** What will be here, in French, as a noun phrase: « le classement public ». */
  what: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <Construction className="mx-auto mb-4 h-8 w-8 text-ink-subtle" aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        {what} arrive avec l&apos;ouverture du site public.
      </p>
    </div>
  );
}
