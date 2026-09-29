import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';
import { site } from '@/content/site';
import { pageMeta } from '@/content/seo';

export const metadata: Metadata = pageMeta({
  title: 'Mentions légales',
  description: 'Qui édite DXScores, qui l’héberge, et comment nous joindre.',
  path: '/legal',
});

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updated="27 septembre 2026">
      <h2>Éditeur</h2>
      <p>
        DXScores est édité par <strong>{site.founder.name}</strong>, à titre personnel, à Goma
        (République démocratique du Congo). Il n’y a pas de société derrière DXScores à ce jour.
      </p>
      <p>
        Contact&nbsp;: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> · WhatsApp{' '}
        <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
          {site.contact.whatsappDisplay}
        </a>
      </p>
      <p>Directeur de la publication&nbsp;: {site.founder.name}.</p>

      <h2>Hébergement</h2>
      <ul>
        <li>Site web&nbsp;: Vercel Inc. — vercel.com</li>
        <li>Serveur de l’application&nbsp;: Railway Corporation — railway.com</li>
        <li>Base de données&nbsp;: Neon — neon.tech</li>
        <li>Envoi des e-mails&nbsp;: Resend — resend.com</li>
      </ul>

      <h2>Contenus</h2>
      <p>
        Les sites des ligues (<strong>nom-de-la-ligue.dxscores.app</strong>) publient ce que chaque
        organisation saisit&nbsp;: ses compétitions, son calendrier, ses résultats, ses classements et ses
        équipes. Chaque organisation est responsable de ce qu’elle publie et en reste propriétaire.
      </p>
      <p>
        Pour signaler un contenu, écrivez à{' '}
        <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
      </p>
    </LegalPage>
  );
}
