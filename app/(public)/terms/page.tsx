import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: 'Les règles d’utilisation de DXScores, en clair.',
};

export default function Conditions() {
  return (
    <LegalPage title="Conditions d'utilisation" updated="27 septembre 2026">
      <p>
        En créant un compte sur DXScores, vous acceptez les conditions ci-dessous. Elles sont écrites
        pour être lues&nbsp;: si quelque chose n’est pas clair, écrivez-nous.
      </p>

      <h2>1. Le service</h2>
      <p>
        DXScores permet à une organisation sportive — ligue, fédération, tournoi — de tenir son
        calendrier, d’enregistrer ses résultats, de calculer ses classements et de les publier sur son
        propre site public.
      </p>

      <h2>2. Gratuité</h2>
      <p>
        Gérer votre ligue du début à la fin de la saison est gratuit. Une offre Pro viendra plus tard
        avec des outils avancés&nbsp;; vous en serez prévenus à l’avance.
      </p>

      <h2>3. Votre compte</h2>
      <ul>
        <li>Les informations que vous donnez à l’inscription doivent être exactes.</li>
        <li>Votre mot de passe est personnel&nbsp;: ne le partagez pas.</li>
        <li>
          Vous pouvez inviter des collaborateurs. Vous êtes responsable de ce qu’ils font au nom de
          votre organisation.
        </li>
      </ul>

      <h2>4. Ce que vous publiez</h2>
      <p>
        Votre organisation est responsable des informations qu’elle saisit et publie&nbsp;: résultats,
        classements, noms d’équipes et de joueurs. Elle doit avoir le droit de les publier. Pour les
        compétitions de jeunes, cela veut dire disposer des autorisations nécessaires avant de publier
        le nom d’un mineur.
      </p>
      <p>
        Il est interdit de se faire passer pour une autre organisation, de publier des contenus
        injurieux ou trompeurs, ou d’utiliser le service pour autre chose que l’organisation d’une
        activité sportive. Un compte qui le fait peut être suspendu.
      </p>

      <h2>5. Disponibilité</h2>
      <p>
        Nous faisons de notre mieux pour que DXScores fonctionne en permanence, sans pouvoir le
        garantir. Le service évolue&nbsp;: des fonctionnalités s’ajoutent et changent. Vos classements et
        votre calendrier s’exportent à tout moment (PDF, image, Excel), pour que vous en gardiez une
        copie.
      </p>

      <h2>6. Fermer votre compte</h2>
      <p>
        Vous pouvez demander la fermeture de votre compte et la suppression des données de votre
        organisation en écrivant à <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
      </p>

      <h2>7. Nous joindre</h2>
      <p>
        Pour toute question&nbsp;: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> ou
        WhatsApp{' '}
        <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
          {site.contact.whatsappDisplay}
        </a>
        .
      </p>
    </LegalPage>
  );
}
