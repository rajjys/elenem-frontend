//components/forms/InviteLeagueAdminForm.tsx
// ... (similar structure: useForm, zod, api call to /leagues/my-league/admins/invite)
// Fields: email (string, email), firstName (string, optional), lastName (string, optional)
import { useForm as useFormInvite } from "react-hook-form";
import { zodResolver as zodResolverInvite } from "@hookform/resolvers/zod";
import * as zInvite from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { api } from "@/services/api";

const inviteSchema = zInvite.object({
  email: zInvite.string().email("Invalid email address"),
  firstName: zInvite.string().optional(),
  lastName: zInvite.string().optional(),
});
type InviteFormValues = zInvite.infer<typeof inviteSchema>;

interface InviteLeagueAdminFormProps {
  onInviteSuccess: (newAdminData: any) => void; // Callback after successful invite
}

export function InviteLeagueAdminForm({ onInviteSuccess }: InviteLeagueAdminFormProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useFormInvite<InviteFormValues>({
    resolver: zodResolverInvite(inviteSchema),
    defaultValues: { email: "", firstName: "", lastName: "" },
  });

  async function onSubmit(data: InviteFormValues) {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);
    try {
      const response = await api.post("/leagues/my-league/admins/invite", data);
      setSuccessMessage(`Successfully invited ${data.email}.`);
      onInviteSuccess(response.data); // Pass data to parent to update admin list
      form.reset();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to invite admin.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md bg-gray-50">
       <h3 className="text-lg font-medium text-gray-900">Invite New League Admin</h3>
      {apiError && <p className="text-red-500 bg-red-100 p-2 rounded text-sm">{apiError}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-2 rounded text-sm">{successMessage}</p>}
      <Input
        label="Email Address"
        type="email"
        {...form.register("email")}
        error={form.formState.errors.email?.message}
        disabled={isLoading}
      />
      <Input
        label="First Name (Optional, if new user)"
        {...form.register("firstName")}
        error={form.formState.errors.firstName?.message}
        disabled={isLoading}
      />
      <Input
        label="Last Name (Optional, if new user)"
        {...form.register("lastName")}
        error={form.formState.errors.lastName?.message}
        disabled={isLoading}
      />
      <Button type="submit" isLoading={isLoading} disabled={isLoading}>
        Send Invitation
      </Button>
    </form>
  );
}

