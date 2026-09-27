import { SignUpFlow } from '@/components/onboarding';

export const metadata = {
  title: 'Créer votre organisation',
  description: 'Créez votre ligue sur DXScores : le calendrier, les résultats et un classement que chacun peut vérifier. Gratuit.',
};

export default function RegisterPage() {
  return <SignUpFlow />;
}
