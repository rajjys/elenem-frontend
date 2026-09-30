/**
 * Structured data for search engines (PHASE5B_LEAGUE_SITES §9). `<` is escaped: club and league
 * names come from organisers, and one containing « </script> » must not be able to end the tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
