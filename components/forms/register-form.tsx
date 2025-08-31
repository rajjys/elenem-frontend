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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
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
  PublicTenantBasic,
  Gender,
  SupportedLanguages,
  PaginatedResponseDto,
  RegisterFormSchema,
} from "@/schemas"; // Assuming you have these schemas/types exported
import axios from 'axios';
import { ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

// Define the form schema for validation
type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<PublicTenantBasic[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMore, setShowMore] = useState(false);
  // Fetch tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      setTenantsLoading(true);
      try {
        const response = await api.get<PaginatedResponseDto<PublicTenantBasic>>(
          "/public-tenants"
        );
        setTenants(response.data.data);
      } catch (error) {
        let errorMessage = "Failed to Fetch Tenants";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
      console.log(error);
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
      preferredLanguage: SupportedLanguages.FRANCAIS,
      timezone: "UTC+2",
      tenantId: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      await register(values);   // 👈 authStore does everything (API call + set tokens + set user -> login)
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

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Mandatory Fields */}
          <div className="space-y-4">
            {/* Functional Identity */}
            <h3 className="text-lg font-semibold hidden">Identifiants</h3>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel hidden>Nom d&apos;utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom d'utilisateur" {...field} />
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
                  <FormLabel hidden>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="E-mail" {...field} />
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
                  <FormLabel hidden>Mot de Passe</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de Passe"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-2 top-2 text-gray-500"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FormMessage name="password"/>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            {/* Personal Identity */}
            <h3 className="text-lg font-semibold">Informations Personnelles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel hidden>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
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
                    <FormLabel hidden>Post-Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Post-Nom" {...field} />
                    </FormControl>
                    <FormMessage name="last_name"/>
                  </FormItem>
                )}
              />
            </div>
            <Collapsible open={showMore} onOpenChange={setShowMore}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full flex items-center justify-between" >
                    Plus de détails
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 mt-4">
                <div>
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
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Creation...</span>
                  </>
                ) : (
                  <span>Creer Mon Compte</span>
                )}
            </Button>
          </div>
          {/* Already have an account? Sign In */}
        <div className="mt-4 py-8 border-t border-indigo-200">
          <p className="text-sm text-gray-600">Vous avez deja un compte? 
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500 transition-all duration-300 ease-in-out font-medium pl-2">Connectez-vous</Link>
          </p>
        </div>
        </form>
      </Form>
  );
}