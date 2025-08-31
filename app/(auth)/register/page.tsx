import { RegisterForm } from '@/components/forms/register-form';
import { LoadingSpinner } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { Suspense } from 'react'

const RegisterPage = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className="relative bg-white p-4 rounded-lg shadow-md w-full max-w-md">
        <Link href="/login" className="absolute top-0 left-0 rounded-full flex items-center text-white text-sm font-medium bg-gray-600/60 hover:bg-gray-600/80 mt-10 ml-8 p-2 transition-all duration-300 ease-in-out">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center justify-center mb-4 pb-4 border-b border-indigo-200">
          <Image
            src='/logos/elenem-sport.png'
            alt='Elenem Logo'
            width={180}
            height={120}
            //fallbackText={userAuth?.username.charAt(0) || "Logo"}
          />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Creez votre compte</h1>
      {// Wrap the client component in Suspense
      }
        <Suspense fallback={<LoadingSpinner message="Loading login..." />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
    );
}

export default RegisterPage
