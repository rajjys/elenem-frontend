// src/app/(auth)/register/RegisterClientPage.tsx
"use client";

import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterClientPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}