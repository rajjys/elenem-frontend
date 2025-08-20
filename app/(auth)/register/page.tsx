import { RegisterForm } from '@/components/forms/register-form';
import { LoadingSpinner } from '@/components/ui';
import React, { Suspense } from 'react'

const RegisterPage = () => {
  return (
      // Wrap the client component in Suspense
      <Suspense fallback={<LoadingSpinner message="Loading login..." />}>
        <RegisterForm />
      </Suspense>
    );
}

export default RegisterPage
