import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';
import { site } from '@/content/site';
import { pageMeta } from '@/content/seo';

export const metadata: Metadata = pageMeta({
  title: 'Confidentialité',
  description: 'Les données que DXScores conserve, pourquoi, et ce qui est publié.',
  path: '/privacy',
});

export default function Confidentialite() {
  return (
    <LegalPage title="Confidentialité" updated="27 septembre 2026">
      <p>
        Cette page dit simplement quelles données DXScores conserve, pourquoi, ce qui est rendu public
        et ce qui ne l’est jamais.
      </p>

      <h2>Ce que nous conservons</h2>
      <ul>
        <li>
          <strong>Les comptes</strong>&nbsp;: nom, prénom, adresse e-mail, nom d’utilisateur. Le mot de
          passe n’est jamais stocké en clair&nbsp;: seule une empreinte chiffrée l’est.
        </li>
        <li>
          <strong>Les données sportives saisies par l’organisation</strong>&nbsp;: compétitions, calendrier,
          résultats, équipes, et pour les joueurs leur nom, leur numéro, leur poste et leurs
          statistiques de match.
        </li>
        <li>
          <strong>Le profil de l’organisation</strong>&nbsp;: les informations qu’elle choisit de
          renseigner dans ses paramètres.
        </li>
        <li>
          <strong>L’historique des modifications</strong>&nbsp;: qui a créé, déplacé ou corrigé un match,
          et quand. C’est ce qui permet à chacun de vérifier d’où vient un résultat.
        </li>
      </ul>

      <h2>Ce qui est public</h2>
      <p>
        Le site de chaque ligue affiche ses compétitions, son calendrier, ses résultats, ses
        classements et ses équipes. Les coordonnées bancaires, les numéros fiscaux ou d’identité et
        les adresses e-mail ne sont <strong>jamais</strong> publiés.
      </p>
      <p>
        Les noms des joueurs sont publiés par l’organisation qui les saisit. Elle peut à tout moment
        retirer un joueur de son effectif. Pour les compétitions de jeunes, elle doit disposer des
        autorisations nécessaires avant de publier le nom d’un mineur.
      </p>

      <h2>Ce que nous n’en faisons pas</h2>
      <p>
        Nous ne vendons pas vos données, nous ne les louons pas et il n’y a pas de publicité sur
        DXScores.
      </p>

      <h2>Cookies et mesure d’audience</h2>
      <p>
        DXScores utilise un seul cookie, qui garde votre session ouverte, et le stockage de votre
        navigateur pour vos préférences (par exemple le thème clair ou sombre). La mesure d’audience
        (Vercel Analytics) n’utilise pas de cookies.
      </p>

      <h2>Qui traite les données avec nous</h2>
      <ul>
        <li>Vercel — hébergement du site</li>
        <li>Railway — serveur de l’application</li>
        <li>Neon — base de données</li>
        <li>Resend — envoi des e-mails (codes de vérification, invitations, mots de passe oubliés)</li>
      </ul>

      <h2>Combien de temps</h2>
      <p>
        Tant que le compte ou l’organisation existe. Sur demande, nous supprimons un compte ou les
        données d’une organisation.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander à consulter, corriger ou supprimer les données qui vous concernent — y
        compris si vous êtes un joueur dont le nom apparaît sur le site d’une ligue — en écrivant à{' '}
        <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
      </p>
    </LegalPage>
  );
}
