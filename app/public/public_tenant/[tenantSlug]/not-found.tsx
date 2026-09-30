import Link from 'next/link';

/** A page that does not exist inside a league's site: said inside its frame, with a way back. */
export default function PageNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">Cette page n’existe pas</h1>
      <p className="mt-3 text-ink-muted">Le lien est peut-être ancien, ou la page a été déplacée.</p>
      <Link href="/" className="mt-6 font-medium text-[var(--site-accent)] hover:underline">
        Retour à l’accueil
      </Link>
    </section>
  );
}
