import { LoadingSpinner } from '@/components/ui';
import { SignUpFlow } from '@/components/onboarding';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { Suspense } from 'react';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunk p-4">
      <div className="relative bg-surface p-6 sm:p-8 rounded-lg shadow-md w-full max-w-lg">
        <Link
          href="/login"
          aria-label="Retour à la connexion"
          className="absolute top-4 left-4 rounded-full flex items-center text-ink-inverted bg-ink-subtle/60 hover:bg-ink-subtle/80 p-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center justify-center mb-6 pb-6 border-b border-accent-line">
          <Image src="/logos/elenem-sport.png" alt="Elenem" width={180} height={120} />
        </div>
        <h1 className="text-2xl font-bold text-center text-ink mb-2">Créez votre organisation</h1>
        <p className="text-sm text-ink-muted text-center mb-8">
          Deux étapes, et votre ligue est prête à recevoir ses équipes.
        </p>
        <Suspense fallback={<LoadingSpinner message="Chargement…" />}>
          <SignUpFlow />
        </Suspense>
      </div>
    </div>
  );
};

export default RegisterPage;
