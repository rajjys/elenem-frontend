import { Globe, Mail, Phone } from 'lucide-react';
import type { PublicSite } from '@/lib/public-site/api';
import { buildAppUrl } from '@/utils/tenant-url';
import { SiteMark } from './site-mark';

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
};

/**
 * A league site's footer (PHASE5B_LEAGUE_SITES §6, §4.7): the league's public contact — only the
 * fields it chose to fill — a quiet way in for its organisers, and the one line that tells a
 * reader where a site like this comes from.
 */
export function SiteFooter({ site, slug }: { site: PublicSite; slug: string }) {
  const social = Object.entries(site.socialLinks);
  const contact = [
    site.contact.email && { href: `mailto:${site.contact.email}`, label: site.contact.email, Icon: Mail },
    site.contact.phone && { href: `tel:${site.contact.phone.replace(/\s/g, '')}`, label: site.contact.phone, Icon: Phone },
    site.contact.website && { href: site.contact.website, label: site.contact.website.replace(/^https?:\/\//, ''), Icon: Globe },
  ].filter((c): c is { href: string; label: string; Icon: typeof Mail } => !!c);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <SiteMark name={site.name} logoUrl={site.logoUrl} />
            <div>
              <p className="font-semibold text-ink">{site.name}</p>
              {site.city && <p className="text-sm text-ink-muted">{site.city}</p>}
            </div>
          </div>
          {site.description && <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">{site.description}</p>}
          {contact.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {contact.map(({ href, label, Icon }) => (
                <li key={href}>
                  <a href={href} className="inline-flex items-center gap-2 text-ink-muted hover:text-[var(--site-accent)]">
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {social.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {social.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-[var(--site-accent)]">
                    {SOCIAL_LABELS[key.toLowerCase()] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="md:text-right">
          <a href={buildAppUrl('/login')} className="text-sm font-medium text-ink-muted hover:text-ink">
            Espace organisateur
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-ink-subtle sm:px-6">
          <a
            href={`${buildAppUrl('/')}?utm_source=league&utm_campaign=${encodeURIComponent(slug)}`}
            className="hover:text-ink"
          >
            Propulsé par <span className="font-semibold text-ink-muted">DXScores</span> — créez le site de votre ligue
          </a>
        </p>
      </div>
    </footer>
  );
}
