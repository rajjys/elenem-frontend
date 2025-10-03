// src/app/tenant/settings/profile/page.tsx

import { Button, Input } from "@/components/ui";
import { TenantDetails } from "@/schemas";
import { CreateBusinessProfileSchema } from "@/schemas/common-schemas";
import { api } from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";


type ProfileFormValues = z.infer<typeof CreateBusinessProfileSchema>; // Assuming update uses the same shape
interface TenantProfileSettingsProps {
  tenant: TenantDetails;
  onSuccess?: () => void;
}

// Helper: build a shape matching UpdateTenantSchema from the full TenantDetails
function buildDefaultValues(tenant: TenantDetails): ProfileFormValues {
  return {
    // make sure all keys expected by UpdateTenantSchema are present
    ...tenant.businessProfile
  } as ProfileFormValues; // cast - your UpdateTenantSchema determines exact optionality
}

function isEqual(a: unknown, b: unknown) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function computeDelta(oldObj: Partial<ProfileFormValues>, newObj: Partial<ProfileFormValues>) {
  const delta: Partial<ProfileFormValues> = {};
  Object.keys(newObj).forEach((key) => {
    const k = key as keyof ProfileFormValues;
    if (!isEqual(oldObj[k], newObj[k])) {
      // Only include keys that changed
      // Note: we don't remove keys that became `null`/`undefined` on purpose — backend should handle nullable fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delta[k] = newObj[k] as any;
    }
  });
  return delta;
}

export function TenantBusinessProfile({ tenant, onSuccess }: TenantProfileSettingsProps) {
  // Use the existing businessProfile data for the initial state
  const initialRef = useRef<ProfileFormValues>(buildDefaultValues(tenant));
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(CreateBusinessProfileSchema),
    // Map initial data (e.g., initialProfile.name, initialProfile.contactEmail)
    defaultValues: initialRef.current,
    mode: "onChange",
  });
  
  const {
    //control,
    handleSubmit,
    formState: { isSubmitting, isDirty, errors },
    reset,
    getValues,
    //setValue,
    //watch, // Use watch to read current values
  } = form;

  // keep form in sync when tenant prop changes (route navigation / data refetch)
    useEffect(() => {
      const defaults = buildDefaultValues(tenant);
      initialRef.current = defaults;
      reset(defaults);
    }, [tenant, reset]);

const onSubmit = async () => {
    const currentValues = getValues();
    const deltaPayload = computeDelta(initialRef.current, currentValues);
    if (Object.keys(deltaPayload).length === 0) {
          toast.info("No changes detected to save.");
          return;
    }
    
    try {
        // Send the update: We wrap the delta in the 'businessProfile' field.
        await api.put(`/tenants/${tenant.id}`, { businessProfile: deltaPayload });
        toast.success("Tenant Profile updated successfully!");
         // update the "saved" baseline and reset the form's dirty state
        initialRef.current = getValues();
        // Only reset with the new initial values, which are now current values
        reset(initialRef.current);
        if(onSuccess) onSuccess();
    } catch (error) {
        let errorMessage = "Failed to update tenant settings";
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage)
        console.error("error updating Tenant:", error);
    } finally {
        // Ensure form state is updated regardless of the initial try/catch success/failure
        // This is important to clear submitting state and dirty state
        // If an error occurred before setting initialRef.current, we still want to reset to initialRef.current
        reset(initialRef.current);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 pb-0 shadow-md bg-white rounded-lg">
        {/* Error Display */}
        {errors && Object.keys(errors).length > 0 && 
          (
            <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                <p className="font-semibold border-b flex items-center justify-center pb-2 mb-2">Erreurs de validation:</p>
                <ul className="list-disc list-inside mt-1">
                    {Object.entries(errors).map(([field, error]) => {
                        // Safely extract the message from the error object
                        let message: string | undefined;
                        if (error && typeof error === 'object' && 'message' in error) {
                            message = error.message as string;
                        } else if (typeof error === 'string') {
                            message = error;
                        }
                        
                        // Fallback for array errors or complex objects not caught above
                        if (error && typeof error === 'object' && 'root' in error && Array.isArray(error.root)) {
                            message = error.root.map(e => e.message).join(', ');
                        }

                        if (!message) return null;

                        return <li key={field}><span className="font-semibold">{field}</span>: {message}</li>;
                    })}
                </ul>
            </div>
          )
        }
            
      {/* Informations Commerciales de Base */}
      <h3 className="text-xl font-semibold mt-4">Informations Commerciales de Base</h3>
      <Input label="Nom Légal" {...form.register('legalName')} />
      <Input label="Année d'Établissement" type="number" {...form.register('establishedYear')} />
      <Input label="Numéro d'Identification National" {...form.register('nationalIdNumber')} />
      <Input label="ID d'Enregistrement de la Ligue" {...form.register('leagueRegistrationId')} />
      <Input label="Description" {...form.register('description')}/>
      {/* Coordonnées (Contact Information) - Completed from previous request */}
      <h3 className="text-xl font-semibold mt-4">Coordonnées</h3>
      <Input label="E-mail de Contact" {...form.register('contactEmail')} />
      <Input label="Téléphone" {...form.register('phone')} />
      <Input label="Téléphone Commercial" {...form.register('businessPhone')} />
      <Input label="E-mail de Support" {...form.register('supportEmail')} />
      <Input label="Site Web" {...form.register('website')} />
      
      {/* Informations Financières/Administratives - Completed from previous request */}
      <h3 className="text-xl font-semibold mt-4">Informations Financières/Administratives</h3>
      <Input label="Numéro d'Identification Fiscale" {...form.register('taxNumber')} />
      <Input label="Informations Bancaires (JSON)" {...form.register('bankInfo')} />
      <Input label="Informations Mobile Money (JSON)" {...form.register('mobileMoneyInfo')}/>
      {/* Détails de l'Emplacement (Location Details) - Completed from previous request */}
      <h3 className="text-xl font-semibold mt-4">Détails de l&apos;Emplacement</h3>
      <Input label="Région" {...form.register('region')} />
      <Input label="État/Province" {...form.register('state')} />
      <Input label="Ville" {...form.register('city')} />
      <Input label="Adresse Physique" {...form.register('physicalAddress')} />
      <Input label="Latitude" type="number" {...form.register('latitude')} />
      <Input label="Longitude" type="number" {...form.register('longitude')} />
      <Input label="Fuseau Horaire" {...form.register('timezone')} />
      
      {/* Buttons */}
      <div className="sticky bottom-0 z-10 p-4 -mx-6 mt-6 bg-white border-t rounded-b-lg border-slate-200 shadow-lg flex justify-end">
          <div className="flex items-center gap-3">
              <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset(initialRef.current)}
                  disabled={isSubmitting || !isDirty}
              >
                  Réinitialiser
              </Button>
              <Button type="submit" disabled={!isDirty || isSubmitting}>
                  {isSubmitting ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Sauvegarde...</span>
                      </>
                  ) : (
                      <span>Sauvegarder</span>
                  )}
              </Button>
          </div>
      </div>
    </form>
  );
}