// app/(admin)/users/create/page.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Role } from "@/schemas";
import { useAuthStore } from "@/store/auth.store";



const roleOptions = Object.values(Role).map(role => ({ value: role, label: role }));

// Matches CreateSystemUserDto from backend
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role),
  leagueId: z.string().optional().nullable(), // Optional, can be null for SYSTEM_ADMIN
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});
type UserFormValues = z.infer<typeof userSchema>;

interface LeagueOption {
  id: string;
  name: string;
  leagueCode: string;
}

export default function CreateUserPage() {
  const router = useRouter();
const { user, tokens } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: Role.GENERAL_USER,
      leagueId: user?.leagueId ,
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  useEffect(() => {
    // Fetch leagues for the leagueId dropdown
    const fetchLeagues = async () => {
      try {
        
      } catch (error) {
        
      }
    };
    fetchLeagues();
  }, []);

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true);
    setApiError(null);

    const payload = {
        ...data,
        leagueId: data.leagueId === "" ? null : data.leagueId, // Send null if empty string selected
    };


    try {
      await api.post("/league/users", payload);
      router.push("/league/users");
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to create user.");
      setIsLoading(false);
    }
  }

  const selectedRole = form.watch("role");

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>
      {apiError && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded">{apiError}</p>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Username"
          {...form.register("username")}
          error={form.formState.errors.username?.message}
          disabled={isLoading}
        />
        <Input
          label="Email"
          type="email"
          {...form.register("email")}
          error={form.formState.errors.email?.message}
          disabled={isLoading}
        />
        <Input
          label="Password"
          type="password"
          {...form.register("password")}
          error={form.formState.errors.password?.message}
          disabled={isLoading}
        />
        <Input
          label="First Name"
          {...form.register("firstName")}
          error={form.formState.errors.firstName?.message}
          disabled={isLoading}
        />
        <Input
          label="Last Name"
          {...form.register("lastName")}
          error={form.formState.errors.lastName?.message}
          disabled={isLoading}
        />
        <Input
          label="Phone (Optional)"
          {...form.register("phone")}
          error={form.formState.errors.phone?.message}
          disabled={isLoading}
        />
        <Select
          label="Role"
          options={roleOptions}
          {...form.register("role")}
          error={form.formState.errors.role?.message}
          disabled={isLoading}
        />
        <div className="flex items-center justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            Create User
          </Button>
        </div>
      </form>
    </div>
  );
}
