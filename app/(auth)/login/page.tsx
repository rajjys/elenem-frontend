// app/(auth)/login/page.tsx
"use client";
import { LoginForm } from "@/components/forms/loginForm";
import { Role, User } from "@/prisma"; // Import Role and User from your new frontend types
import { useAuthStore } from "@/store/auth.store";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { useEffect } from "react";

export default function LoginPage() {
  const { user, tokens } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params from the URL

  useEffect(() => {
    // Only proceed if tokens and user data are available (i.e., user is authenticated)
    if (tokens?.accessToken && user) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        // If middleware specified a redirect URL, go there
        router.push(redirectUrl);
      } else {
        // Otherwise, determine redirection based on user roles
        const userRoles = user.roles || []; // Ensure it's an array for safety

        // Prioritize redirection to the highest administrative dashboard
        if (userRoles.includes(Role.SYSTEM_ADMIN)) {
          router.push("/admin/dashboard");
        } else if (userRoles.includes(Role.TENANT_ADMIN)) {
          router.push("/tenant/dashboard"); // New Tenant Admin dashboard
        } else if (userRoles.includes(Role.LEAGUE_ADMIN)) {
          router.push("/league/dashboard");
        } else if (userRoles.includes(Role.TEAM_ADMIN)) {
          router.push("/team/dashboard");
        } else {
          // Default for general authenticated users (PLAYER, REFEREE, GENERAL_USER)
          // You might want a more specific path like "/my-dashboard" or "/player-dashboard"
          router.push("/account/dashboard"); 
        }
      }
    }
  }, [user, tokens, router, searchParams]); // Dependencies for useEffect

  // Render the login form if not authenticated, or while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}
