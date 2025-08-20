// src/components/forms/register-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CountryDropdown } from "react-country-region-selector";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/"; // Assuming your ui components are here
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import {
  //RegisterDto,
  PublicTenantResponseDto,
  Gender,
  SupportedLanguages,
  PaginatedResponseDto,
  RegisterFormSchema,
} from "@/schemas"; // Assuming you have these schemas/types exported
import axios from 'axios';

// Define the form schema for validation
type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<PublicTenantResponseDto[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  // Fetch tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      setTenantsLoading(true);
      try {
        const response = await api.get<PaginatedResponseDto<PublicTenantResponseDto>>(
          "/public-tenants"
        );
        setTenants(response.data.data);
      } catch (error) {
        let errorMessage = "Failed to Fetch Tenants";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
      } finally {
        setTenantsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      gender: undefined,
      nationality: "",
      profileImageUrl: "",
      preferredLanguage: SupportedLanguages.ENGLISH,
      timezone: "UTC",
      tenantId: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      await register(values);   // 👈 store does everything (API call + set tokens + set user)
      toast.success("Registration successful!");
      router.push("/account/dashboard"); // Redirect to dashboard
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto max-w-md p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center">Create Your Account</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {/* Functional Identity */}
            <h2 className="text-xl font-semibold">Account Details</h2>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage name="username"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage name="e_mail"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage name="password"/>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            {/* Personal Identity */}
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage name="first_name"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage name="last_name"/>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage name="phone"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage name="date"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage name="gender"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality</FormLabel>
                  <FormControl>
                    <CountryDropdown
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      className="w-full h-10 border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage name="country"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profileImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage name="profile_image" />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            {/* Localization and Tenant */}
            <h2 className="text-xl font-semibold">Preferences</h2>
            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SupportedLanguages.ENGLISH}>English</SelectItem>
                      <SelectItem value={SupportedLanguages.FRANCAIS}>Français</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage name="language"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., America/New_York" {...field} />
                  </FormControl>
                  <FormMessage name="timezone"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select a Tenant (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={tenantsLoading}>
                        <SelectValue placeholder="Select a Tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">No Tenant</SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage name="tenant"/>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}