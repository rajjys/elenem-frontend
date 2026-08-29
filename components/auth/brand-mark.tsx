/**
 * The Elenem mark, as a mark.
 *
 * The signed-out pages were rendering the full 180px lockup where the page heading belongs, so
 * the logo — not the sentence telling you what to do — was the biggest thing on screen. Resend
 * and GitHub both put a small square glyph above a large title, and they are right: at sign-up
 * the brand needs to be present, not loud.
 *
 * Drawn rather than loaded so it inherits the token palette in both themes and costs no request.
 * The form is the interlocking loop from the logotype: two linked strokes, one continuous path.
 */
export function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[0.4rem] bg-accent text-accent-ink ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M14.5 5.2a4.6 4.6 0 0 1 0 6.5l-2.8 2.8a4.6 4.6 0 0 1-6.5-6.5l1.9-1.9"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M9.5 18.8a4.6 4.6 0 0 1 0-6.5l2.8-2.8a4.6 4.6 0 0 1 6.5 6.5l-1.9 1.9"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
