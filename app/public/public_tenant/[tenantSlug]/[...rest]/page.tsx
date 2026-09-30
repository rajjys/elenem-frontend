import { notFound } from 'next/navigation';

/**
 * Any address inside a league that matches no page. Without this, Next.js would answer with the
 * product's own 404, outside the league's frame; this keeps the reader on the league's site.
 */
export default function UnknownPage() {
  notFound();
}
