// components/forms/user-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Button,
  Input,
  PasswordInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  TextArea
} from "@/components/ui/";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect, useCallback } from "react";
import { Gender, SupportedLanguages, Roles, UserDetail, PaginatedTenantsResponseDto, TenantDetails } from "@/schemas"; // Import UserDetail
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store'; // Import useAuthStore

// Define the schema for the user form based on the provided User model
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  profileImageUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional().or(z.literal('')),
  gender: z.nativeEnum(Gender).optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().or(z.literal('')),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
  preferredLanguage: z.nativeEnum(SupportedLanguages).optional(),
  timezone: z.string().optional().or(z.literal('')),
  tenantId: z.string().cuid("Invalid Tenant ID").optional().or(z.literal("")),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: string; // Optional: for edit mode, pass the user ID to fetch
  isEditMode?: boolean; // True for edit, false for create
  onSuccess?: (userId: string) => void;
  onCancel?: () => void;
}

export function UserForm({
  userId,
  isEditMode = false,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const user = useAuthStore((state) => state.user); // Get user from auth store
  const currentUserRoles = user?.roles || [];
  const currentUsersTenantId = user?.tenantId;
  const isSystemAdmin = currentUserRoles.includes(Roles.SYSTEM_ADMIN);
  const isTenantAdmin = currentUserRoles.includes(Roles.TENANT_ADMIN);
  const isLeagueAdmin = currentUserRoles.includes(Roles.LEAGUE_ADMIN);

  const [loadingForm, setLoadingForm] = useState(true); // Overall loading for form data
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<TenantDetails[]>([]);
  const [initialUserData, setInitialUserData] = useState<UserDetail | null>(null); // To store fetched user data for edit

  // Create-mode options: how to give the user access, and which role.
  const [creationMethod, setCreationMethod] = useState<'invite' | 'password'>('invite');
  const [selectedRole, setSelectedRole] = useState<Roles>(Roles.GENERAL_USER);
  // Non-scoped roles safe to assign from this generic form (scoped admin roles
  // are handled by their dedicated invite/promote flows).
  const assignableRoles = [Roles.GENERAL_USER, Roles.PLAYER, Roles.COACH, Roles.REFEREE];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      profileImageUrl: "",
      phone: "",
      dateOfBirth: undefined,
      nationality: "",
      gender: undefined,
      bio: "",
      avatarUrl: "",
      preferredLanguage: undefined,
      timezone: "",
      tenantId: "",
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = form;

  // Password is required only when creating with the "set password" method.
  useEffect(() => {
    if (!isEditMode && creationMethod === 'password') {
      register("password", {
        required: "Password is required for new users.",
        minLength: { value: 8, message: "Password must be at least 8 characters." },
      });
    } else {
      register("password", { required: false });
    }
  }, [isEditMode, creationMethod, register]);

  // Fetch initial user data for edit mode
  useEffect(() => {
    if (isEditMode && userId) {
      const fetchUser = async () => {
        setLoadingForm(true);
        try {
          const response = await api.get<UserDetail>(`/users/${userId}`); // Use /users endpoint
          const fetchedUser = response.data;
          setInitialUserData(fetchedUser);

          // Populate form with fetched data
          reset({
            username: fetchedUser.username || "",
            email: fetchedUser.email || "",
            password: "", // Never pre-fill password
            firstName: fetchedUser.firstName || "",
            lastName: fetchedUser.lastName || "",
            profileImageUrl: fetchedUser.profileImageUrl || "",
            phone: fetchedUser.phone || "",
            dateOfBirth: fetchedUser.dateOfBirth ? new Date(fetchedUser.dateOfBirth).toISOString().split('T')[0] : undefined,
            nationality: fetchedUser.nationality || "",
            gender: fetchedUser.gender || undefined,
            bio: fetchedUser.bio || "",
            avatarUrl: fetchedUser.avatarUrl || "",
            preferredLanguage: fetchedUser.preferredLanguage || undefined,
            timezone: fetchedUser.timezone || "",
            tenantId: fetchedUser.tenantId || "", // Set tenantId from fetched data
          });
        } catch (error) {
          console.error('Failed to fetch user details:', error);
          toast.error("Failed to load user details.", { description: "User not found or access denied." });
          onCancel?.(); // Go back if user not found/accessible
        } finally {
          setLoadingForm(false);
        }
      };
      fetchUser();
    } else {
      // For create mode or no userId in edit, set default tenantId
      if (isTenantAdmin || isLeagueAdmin) {
        setValue("tenantId", currentUsersTenantId || "");
      }
      setLoadingForm(false);
    }
  }, [isEditMode, userId, reset, isTenantAdmin, isLeagueAdmin, currentUsersTenantId, onCancel, setValue]);


  // Fetch Tenants for System Admin
  useEffect(() => {
    if (isSystemAdmin) {
      const fetchTenants = async () => {
        setLoadingTenants(true);
        try {
          const response = await api.get<PaginatedTenantsResponseDto>('/tenants?pageSize=100'); // SysAdmin still fetches all tenants
          setAvailableTenants(response.data.data);
        } catch (error) {
          console.error('Failed to fetch tenants:', error);
          toast.error("Failed to load tenants for selection.");
        } finally {
          setLoadingTenants(false);
        }
      };
      fetchTenants();
    }
  }, [isSystemAdmin]);

  // Handle tenantId display for Tenant/League Admins
  const displayTenantName = initialUserData?.tenant?.name || availableTenants.find(t => t.id === currentUsersTenantId)?.name;

  const onSubmit = useCallback(async (data: UserFormValues) => {
    if (!user) {
      toast.error("Authentication required.", { description: "Please log in to perform this action." });
      return;
    }

    // Construct the payload for the backend DTO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
      nationality: data.nationality || undefined,
      gender: data.gender || undefined,
      bio: data.bio || undefined,
      avatarUrl: data.avatarUrl || undefined,
      profileImageUrl: data.profileImageUrl || undefined, // Ensure this is correctly mapped if your DTO uses it
      preferredLanguage: data.preferredLanguage || undefined,
      timezone: data.timezone || undefined,
      tenantId: data.tenantId === "" ? null : data.tenantId, // Convert empty string to null for backend DTO
    };

    if (!isEditMode) {
      // On create: pick the role, and either set a password or (omit it to) send an invite.
      payload.roles = [selectedRole];
      if (creationMethod === 'password' && data.password) {
        payload.password = data.password;
      }
      // creationMethod === 'invite' -> no password -> backend emails a set-password invite.
    } else if (data.password) {
      // On edit: only send a password if the admin is explicitly changing it (roles left untouched).
      payload.password = data.password;
    }

    try {
      let response;
      if (isEditMode && userId) {
        // For editing, ensure tenantId is only sent if System Admin is editing, or if it's the same tenant
        // Backend's /users/:id endpoint should handle role-based updates
        response = await api.put(`/users/${userId}`, payload); // Use /users endpoint
        toast.success(`User '${response.data.username}' updated successfully!`);
      } else {
        // Create new user
        response = await api.post('/users', payload); // Use /users endpoint
        toast.success(`User '${response.data.username}' created successfully!`);
        reset(); // Reset form after successful creation
      }
      onSuccess?.(response.data.id);
    } catch (error) {
      const errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} user.`;
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} user`, { description: errorMessage });
      console.error(`${isEditMode ? 'Update' : 'Create'} user error:`, error);
    }
  }, [isEditMode, userId, onSuccess, reset, user, creationMethod, selectedRole]);

  // Overall loading state for the form
  const overallLoading = isSubmitting || loadingForm || loadingTenants || user === undefined;

  // Authorization check for rendering the form
  const isAuthorizedToViewForm =
    isSystemAdmin ||
    (isTenantAdmin && currentUsersTenantId !== null) ||
    (isLeagueAdmin && currentUsersTenantId !== null);

  if (user === undefined) { // Still loading auth state
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading authentication state...</p>
      </div>
    );
  }

  if (user === null) { // Not authenticated
    toast.error("Authentication required", { description: "Please log in to access user management." });
    // This redirect should ideally happen at the page level, but as a fallback for the component
    if (typeof window !== 'undefined') {
      window.location.href = '/login'; // Direct redirect for unauthenticated state
    }
    return null;
  }

  if (!isAuthorizedToViewForm) {
    toast.error("Unauthorized", { description: "You do not have permission to manage users." });
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'; // Redirect unauthorized users
    }
    return null;
  }

  if (overallLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isEditMode && (
        <h2 className="text-2xl font-bold text-ink mb-6">Create New User</h2>
      )}

      <Tabs defaultValue="identity">
        <TabsList className="mb-4">
          <TabsTrigger value="identity">Identité</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>
        <TabsContent value="identity" className="space-y-4">

      {isSystemAdmin && (
        <div>
          <Label htmlFor="tenantId">Assign to Tenant</Label>
          <Select
            value={watch("tenantId") || ""}
            onValueChange={(value) => setValue("tenantId", value)}
            disabled={overallLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select tenant (optional for SysAdmin)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No Tenant (System-wide)</SelectItem>
              {availableTenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tenantId && (
            <p className="text-negative text-xs mt-1">{errors.tenantId.message}</p>
          )}
        </div>
      )}

      {(isTenantAdmin || isLeagueAdmin) && currentUsersTenantId && (
        <div className="bg-accent-soft border border-accent-line text-accent-text p-3 rounded-md text-sm">
          <p>This user will be associated with tenant:</p>
          <p className="font-semibold">
            {displayTenantName || currentUsersTenantId}
          </p>
          <input type="hidden" {...register("tenantId")} />
        </div>
      )}

      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...register("username")} disabled={overallLoading} />
        {errors.username && (
          <p className="text-negative text-xs mt-1">{errors.username.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} disabled={overallLoading} />
        {errors.email && (
          <p className="text-negative text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {!isEditMode && (
        <>
          <div>
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Roles)}
              disabled={overallLoading}
              className="block w-full px-3 py-2 border border-line rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Accès</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreationMethod('invite')}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${creationMethod === 'invite' ? 'border-accent bg-accent-soft text-accent-text' : 'border-line text-ink-muted hover:bg-surface-sunk'}`}
              >
                Envoyer une invitation
              </button>
              <button
                type="button"
                onClick={() => setCreationMethod('password')}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${creationMethod === 'password' ? 'border-accent bg-accent-soft text-accent-text' : 'border-line text-ink-muted hover:bg-surface-sunk'}`}
              >
                Définir un mot de passe
              </button>
            </div>
            {creationMethod === 'invite' && (
              <p className="mt-1 text-xs text-ink-muted">
                L&apos;utilisateur recevra un email pour activer son compte et définir son mot de passe.
              </p>
            )}
          </div>
        </>
      )}

      {(isEditMode || creationMethod === 'password') && (
        <div>
          <Label htmlFor="password">
            Password {isEditMode ? "(Leave blank to keep current)" : ""}
          </Label>
          <PasswordInput id="password" {...register("password")} disabled={overallLoading} error={errors.password?.message} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" {...register("firstName")} disabled={overallLoading} />
          {errors.firstName && (
            <p className="text-negative text-xs mt-1">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" {...register("lastName")} disabled={overallLoading} />
          {errors.lastName && (
            <p className="text-negative text-xs mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="profileImageUrl">Profile Image URL</Label>
        <Input id="profileImageUrl" type="url" {...register("profileImageUrl")} disabled={overallLoading} />
        {errors.profileImageUrl && (
          <p className="text-negative text-xs mt-1">{errors.profileImageUrl.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" {...register("phone")} disabled={overallLoading} />
        {errors.phone && (
          <p className="text-negative text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} disabled={overallLoading} />
        {errors.dateOfBirth && (
          <p className="text-negative text-xs mt-1">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="nationality">Nationality</Label>
        <Input id="nationality" {...register("nationality")} disabled={overallLoading} />
        {errors.nationality && (
          <p className="text-negative text-xs mt-1">{errors.nationality.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="gender">Gender</Label>
        <Select
          value={watch("gender") || ""}
          onValueChange={(value) => setValue("gender", value as Gender)}
          disabled={overallLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select gender (optional)" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Gender).map((gender) => (
              <SelectItem key={gender} value={gender}>
                {gender}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.gender && (
          <p className="text-negative text-xs mt-1">{errors.gender.message}</p>
        )}
      </div>

        </TabsContent>
        <TabsContent value="preferences" className="space-y-4">

      <div>
        <Label htmlFor="bio">Bio</Label>
        <TextArea
          id="bio"
          {...register("bio")}
          disabled={overallLoading}
          rows={3}
        />
        {errors.bio && (
          <p className="text-negative text-xs mt-1">{errors.bio.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input id="avatarUrl" type="url" {...register("avatarUrl")} disabled={overallLoading} />
        {errors.avatarUrl && (
          <p className="text-negative text-xs mt-1">{errors.avatarUrl.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="preferredLanguage">Preferred Language</Label>
        <Select
          value={watch("preferredLanguage") || ""}
          onValueChange={(value) => setValue("preferredLanguage", value as SupportedLanguages)}
          disabled={overallLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language (optional)" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SupportedLanguages).map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.preferredLanguage && (
          <p className="text-negative text-xs mt-1">{errors.preferredLanguage.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" {...register("timezone")} disabled={overallLoading} />
        {errors.timezone && (
          <p className="text-negative text-xs mt-1">{errors.timezone.message}</p>
        )}
      </div>

        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 mt-8">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={overallLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={overallLoading}>
          {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
