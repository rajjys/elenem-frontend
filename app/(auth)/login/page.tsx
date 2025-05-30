// app/(auth)/login/page.tsx
"use client";
import { LoginForm } from "@/components/forms/loginForm";
import { Role } from "@/prisma";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, tokens } = useAuthStore();
  const router = useRouter();

  // This useEffect will run on the client after middleware has done its job.
  // If the user *is* authenticated (and middleware allowed them to proceed),
  // they should be redirected from the login page.
  useEffect(() => {
    if (tokens?.accessToken && user) {
      // Middleware should have already redirected them away from /login if authenticated.
      // This is a client-side fallback just in case, or for subsequent navigation.
      ///Redirect to the appropriate page based on user role
            const userRole = user?.role;
            if (userRole === Role.SYSTEM_ADMIN) {
              router.push("/dashboard");
            } 
            else if (userRole === Role.LEAGUE_ADMIN){
              router.push("/user-dashboard/league");
            }
            else if (userRole === Role.TEAM_ADMIN) {
              router.push("/user-dashboard/team");
            } 
            else {
              router.push("/user-dashboard/");
            }
    }
  }, [user, tokens, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}