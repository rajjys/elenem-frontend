// components/forms/loginForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuthStore } from "@/store/auth.store";
import { useState } from "react";


export function LoginForm() {
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [isSystemAdminLogin, setIsSystemAdminLogin] = useState(false);


    // Define a more robust login schema that conditionally requires tenantCode
    const loginSchema = z.object({
      usernameOrEmail: z.string().min(1, "Username or Email is required"),
      password: z.string().min(1, "Password is required"),
      tenantCode: z.string().optional(), // Initially optional, conditional validation below
    }).superRefine((data, ctx) => {
      // If not a system admin login, tenantCode is required
      // We'll rely on the backend to tell us the user's role after login,
      // but for the login form, we assume if SYSTEM_ADMIN checkbox is not checked, a tenantCode is needed.
      // This simplified client-side check aligns with the backend DTO logic.
      if (!data.tenantCode && !isSystemAdminLogin) { // `isSystemAdminLogin` is a UI state, not part of DTO directly
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tenant Code is required for non-System Admin logins",
          path: ['tenantCode'],
        });
      }
    });

    type LoginFormValues = z.infer<typeof loginSchema> & { isSystemAdminLogin?: boolean }; // Add UI state to type


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: "", password: "", tenantCode: "" },
  });

  // Manually register isSystemAdminLogin with react-hook-form if you want Zod to validate it
  // Or manage it purely as local state as done here, which is simpler for a UI flag.
  // If using `superRefine`, ensure `isSystemAdminLogin` is part of the form data or accessible.
  // For now, let's pass it via the `onSubmit` context.

  async function onSubmit(data: LoginFormValues) {
    setError(null);
    try {
      await login(
        data.usernameOrEmail,
        data.password,
        isSystemAdminLogin ? undefined : data.tenantCode // Pass tenantCode only if not system admin login
      );
      // Redirection is handled by login/page.tsx's useEffect and middleware
    } catch (error) {
      const errorMessage = "Login failed";
      setError(errorMessage);
      console.error("Login error:", error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700">Username or Email</label>
        <Input id="usernameOrEmail" type="text" autoComplete="username" {...form.register("usernameOrEmail")} />
        {form.formState.errors.usernameOrEmail && <p className="text-red-500 text-xs mt-1">{form.formState.errors.usernameOrEmail.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
        <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        {form.formState.errors.password && <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="systemAdminLogin" 
          checked={isSystemAdminLogin}
          onChange={(e) => {
            setIsSystemAdminLogin(e.target.checked);
            if (e.target.checked) {
                form.setValue("tenantCode", undefined); // Clear tenant code for system admin
                form.clearErrors("tenantCode"); // Clear any tenantCode errors
            } else {
                form.setValue("tenantCode", ""); // Reset for re-entry if unchecked
            }
          }}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="systemAdminLogin" className="text-sm text-gray-700">Login as System Admin (no tenant code)</label>
      </div>

      {!isSystemAdminLogin && (
        <div>
          <label htmlFor="tenantCode" className="block text-sm font-medium text-gray-700">Tenant Code</label>
          <Input id="tenantCode" {...form.register("tenantCode")} />
          {form.formState.errors.tenantCode && <p className="text-red-500 text-xs mt-1">{form.formState.errors.tenantCode.message}</p>}<p className="text-gray-500 text-xs mt-1">
            Example: &lsquo;demo-tenant&lsquo;
          </p>
        </div>
      )}

      <Button type="submit" className="w-full">Login</Button>
    </form>
  );
}
