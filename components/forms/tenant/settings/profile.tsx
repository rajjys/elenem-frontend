// src/app/tenant/settings/profile/page.tsx
'use client';
import { Button } from "@/components/ui";
import { InlineEditField } from "@/components/ui/Inline-edit-field";
import { TenantDetails } from "@/schemas";
import { CreateBusinessProfileSchema } from "@/schemas/common-schemas";
import { api } from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Path, useForm } from "react-hook-form";
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

  // State to track which field is currently open for editing
    const [activeEditField, setActiveEditField] = useState<Path<ProfileFormValues> | null>(null);

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
    //setValue,
    //watch, // Use watch to read current values
  } = form;

  // keep form in sync when tenant prop changes (route navigation / data refetch)
    useEffect(() => {
      const defaults = buildDefaultValues(tenant);
      initialRef.current = defaults;
      reset(defaults);
    }, [tenant, reset]);

const onSubmit = async (data: ProfileFormValues) => {
        // Close any active edit field on submit attempt
        setActiveEditField(null);
        
        // 1. Manually parse the raw form data using Zod to get the final, validated, and transformed payload
        let finalPayload: ProfileFormValues;
        try {
            finalPayload = CreateBusinessProfileSchema.parse(data);
        } catch (e) {
            // This should rarely happen if zodResolver worked, but good practice
            toast.error("Validation failed before submission.");
            console.error(e);
            return;
        }

        // 2. Compute delta using the final, transformed values
        const initialOutputValues = CreateBusinessProfileSchema.parse(initialRef.current);
        const finalDelta = computeDelta(initialOutputValues, finalPayload);

        if (Object.keys(finalDelta).length === 0) {
            toast.info("Aucune modification détectée à enregistrer.");
            return;
        }

        try {
            await api.put(`/tenants/${tenant.id}`, { businessProfile: finalDelta });
            
            toast.success("Profil de locataire mis à jour avec succès !");
            
            // 3. Update the baseline with the successfully saved (and transformed) data
            // We convert the saved finalPayload (number type) back to the form's input type (string/number)
            initialRef.current = buildDefaultValues({ businessProfile: finalPayload } as TenantDetails); 
            reset(initialRef.current);
            
            if (onSuccess) onSuccess();

        } catch (error) {
            let errorMessage = "Échec de la mise à jour des paramètres du locataire";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            toast.error(errorMessage);
            console.error("Erreur lors de la mise à jour du locataire :", error);
        }
    };

    return (
  <form
    onSubmit={handleSubmit(onSubmit)}
    className="space-y-6 p-6 pb-0 shadow-md bg-white rounded-lg"
  >
    {/* --- Error Summary Display (Optional for large forms) --- */}
    {errors && Object.keys(errors).length > 0 && isDirty && (
      <div
        className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
        role="alert"
      >
        <p className="font-semibold">
          Erreurs de validation: Veuillez corriger les champs en édition.
        </p>
      </div>
    )}

    {/* --- 1. Core Business Metadata --- */}
    <h3 className="text-xl font-semibold pt-4">
      Informations Commerciales de Base
    </h3>
    <InlineEditField
      form={form}
      name="legalName"
      label="Nom Légal"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="establishedYear"
      label="Année d'Établissement"
      type="number"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="description"
      label="Description"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="nationalIdNumber"
      label="Numéro d'Identification National"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="leagueRegistrationId"
      label="ID d'Enregistrement de la Ligue"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />

    <hr className="my-6" />

    {/* --- 2. Contact Information --- */}
    <h3 className="text-xl font-semibold">Coordonnées</h3>
    <InlineEditField
      form={form}
      name="contactEmail"
      label="E-mail de Contact"
      type="email"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="phone"
      label="Téléphone"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="businessPhone"
      label="Téléphone Commercial"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="supportEmail"
      label="E-mail de Support"
      type="email"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="website"
      label="Site Web"
      type="url"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />

    <hr className="my-6" />

    {/* --- 3. Financial/Administrative --- */}
    <h3 className="text-xl font-semibold">Informations Financières/Administratives</h3>
    <InlineEditField
      form={form}
      name="taxNumber"
      label="Numéro d'Identification Fiscale"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="bankInfo"
      label="Informations Bancaires (JSON)"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="mobileMoneyInfo"
      label="Informations Mobile Money (JSON)"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />

    <hr className="my-6" />

    {/* --- 4. Location Details --- */}
    <h3 className="text-xl font-semibold">Détails de l&apos;Emplacement</h3>
    <InlineEditField
      form={form}
      name="region"
      label="Région"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="state"
      label="État/Province"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="city"
      label="Ville"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="physicalAddress"
      label="Adresse Physique"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="latitude"
      label="Latitude"
      type="number"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="longitude"
      label="Longitude"
      type="number"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />
    <InlineEditField
      form={form}
      name="timezone"
      label="Fuseau Horaire"
      activeEditField={activeEditField}
      setActiveEditField={setActiveEditField}
      initialValues={initialRef.current}
    />

    {/* --- STICKY FOOTER FOR SUBMISSION --- */}
    <div
      className="sticky bottom-0 z-10 p-4 -mx-6 mt-6 bg-white border-t border-slate-200 shadow-lg rounded-b-lg flex justify-end"
      style={{ width: "calc(100% + 48px)" }}
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setActiveEditField(null);
            reset(initialRef.current);
          }}
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
            <span>Enregistrer les Modifications</span>
          )}
        </Button>
      </div>
    </div>
  </form>
);

}