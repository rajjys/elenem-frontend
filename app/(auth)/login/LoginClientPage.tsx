// app/(auth)/login/LoginClientPage.tsx
'use client'; // THIS IS CRUCIAL: Marks this as a Client Component

import { LoginForm } from "@/components/forms/login-form";
import { Role } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";
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

        if (userRoles.includes(Role.SYSTEM_ADMIN)) {
          router.push("/admin/dashboard");
        } else if (userRoles.includes(Role.TENANT_ADMIN)) {
          router.push("/tenant/dashboard");
        } else if (userRoles.includes(Role.LEAGUE_ADMIN)) {
          router.push("/league/dashboard");
        } else if (userRoles.includes(Role.TEAM_ADMIN)) {
          router.push("/team/dashboard");
        } else {
          router.push("/account/dashboard");
        }
      }
    }
  }, [user, tokens, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h1>
        {/* LoginForm is already a client component, so it can be rendered directly here */}
        <LoginForm />
      </div>
    </div>
  );
}