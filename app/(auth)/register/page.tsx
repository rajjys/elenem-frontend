import { SignUpFlow } from '@/components/onboarding';

export const metadata = {
  title: 'Créer votre organisation · Elenem',
  description: 'Créez votre ligue sur Elenem et publiez un classement que personne ne conteste.',
};

export default function RegisterPage() {
  return <SignUpFlow />;
}
