// components/forms/LoginForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Role } from "@/prisma";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
  leagueCode: z.string().optional(), // Optional for SYSTEM_ADMIN
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSystemAdminLogin, setIsSystemAdminLogin] = useState(false);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: "", password: "", leagueCode: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    setError(null);
    try {
      const payload = isSystemAdminLogin 
        ? { usernameOrEmail: data.usernameOrEmail, password: data.password }
        : data;
      await login(payload.usernameOrEmail, payload.password, payload.leagueCode);
      
      ///Redirect to the appropriate page based on user role
      const userRole = useAuthStore.getState().user?.role;
      if (userRole === Role.SYSTEM_ADMIN) {
        router.push("admin/dashboard");
      } 
      else if (userRole === Role.LEAGUE_ADMIN){
        router.push("/dashboard/league");
      }
      else if (userRole === Role.TEAM_ADMIN) {
        router.push("/dashboard/team");
      } 
      else {
        router.push("/dashboard/user");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700">Username or Email</label>
        <Input id="usernameOrEmail" {...form.register("usernameOrEmail")} />
        {form.formState.errors.usernameOrEmail && <p className="text-red-500 text-xs mt-1">{form.formState.errors.usernameOrEmail.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
        <Input id="password" type="password" {...form.register("password")} />
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
                form.setValue("leagueCode", undefined); // Clear league code for sys admin
            }
          }}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="systemAdminLogin" className="text-sm text-gray-700">Login as System Admin (no league code)</label>
      </div>

      {!isSystemAdminLogin && (
        <div>
          <label htmlFor="leagueCode" className="block text-sm font-medium text-gray-700">League Code</label>
          <Input id="leagueCode" {...form.register("leagueCode")} />
          {form.formState.errors.leagueCode && <p className="text-red-500 text-xs mt-1">{form.formState.errors.leagueCode.message}</p>}
        </div>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        {form.formState.isSubmitting ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}