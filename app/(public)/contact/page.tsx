import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';
import { site } from '@/content/site';
import { pageMeta } from '@/content/seo';

/**
 * Contact (PHASE5A_PRODUCT_SITE §3.5).
 *
 * WhatsApp and a real mailbox, no form. The old page was an English form that sent nothing — no
 * submit handler, no backend — promised a "24h Response Commitment" and "Enterprise Security", and
 * crashed on an unknown ?intent=. The audience lives on WhatsApp, so that comes first.
 */
export const metadata: Metadata = pageMeta({
  title: 'Contact',
  description: 'Une question sur DXScores ? Écrivez-nous sur WhatsApp ou par e-mail.',
  path: '/contact',
});

export default function ContactPage() {
  const cards = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      detail: site.contact.whatsappDisplay,
      href: site.contact.whatsappUrl,
      action: 'Écrire sur WhatsApp',
      external: true,
    },
    {
      icon: Mail,
      title: 'E-mail',
      detail: site.contact.email,
      href: `mailto:${site.contact.email}`,
      action: 'Envoyer un e-mail',
      external: false,
    },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-title font-bold text-ink">Parlons de votre ligue</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">
        Une question avant de commencer, un format de compétition particulier, un souci en cours de
        saison&nbsp;: écrivez-nous. C’est le fondateur qui répond.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {cards.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target={c.external ? '_blank' : undefined}
            rel={c.external ? 'noopener noreferrer' : undefined}
            className="group rounded-xl border border-line bg-surface p-6 transition-colors hover:border-line-strong motion-safe:transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-e2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
              <c.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-4 font-semibold text-ink">{c.title}</p>
            <p className="mt-1 text-ink-muted">{c.detail}</p>
            <p className="mt-4 text-sm font-medium text-accent-text">{c.action} →</p>
          </a>
        ))}
      </div>

      <p className="mt-10 text-ink-muted">
        Vous préférez essayer directement&nbsp;?{' '}
        <Link href="/register" className="link-grow font-medium text-accent-text">
          Créez votre ligue
        </Link>{' '}
        — c’est gratuit, et votre site est en ligne dès l’inscription.
      </p>
    </section>
  );
}
