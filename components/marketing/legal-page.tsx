import type { ReactNode } from 'react';

/**
 * The frame the three legal pages share (PHASE5A_PRODUCT_SITE §7): a title, the date it was last
 * changed, and plain prose. Sign-up asks every new organisation to accept these, so they have to
 * exist and read like something a person wrote, in the language of the product.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-title font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-subtle">Dernière mise à jour&nbsp;: {updated}</p>
      <div className="mt-10 space-y-4 leading-relaxed text-ink-muted [&_a]:font-medium [&_a]:text-accent-text [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
