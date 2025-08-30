// app/(auth)/login/LoginClientPage.tsx
'use client'; // THIS IS CRUCIAL: Marks this as a Client Component

import { LoginForm } from "@/components/forms/login-form";
import { Roles } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react"; // Import useEffect and React

export default function LoginClientPage() {
  const { user, tokens } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams(); // This hook is now inside a client component

  useEffect(() => {
    if (tokens?.accessToken && user) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        const userRoles = user.roles || [];

        if (userRoles.includes(Roles.SYSTEM_ADMIN)) {
          router.push("/admin/dashboard");
        } else if (userRoles.includes(Roles.TENANT_ADMIN)) {
          router.push("/tenant/dashboard");
        } else if (userRoles.includes(Roles.LEAGUE_ADMIN)) {
          router.push("/league/dashboard");
        } else if (userRoles.includes(Roles.TEAM_ADMIN)) {
          router.push("/team/dashboard");
        } else {
          router.push("/account/dashboard");
        }
      }
    }
  }, [user, tokens, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-center mb-6 pb-4 border-b border-indigo-200">
          <Image
            src='/logos/elenem-sport.png'
            alt='Elenem Logo'
            width={180}
            height={120}
            //fallbackText={userAuth?.username.charAt(0) || "Logo"}
          />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Se connecter</h1>
        {/* LoginForm is already a client component, so it can be rendered directly here */}
        <LoginForm />
      </div>
    </div>
  );
}