'use client';
import { Button, Input } from "@/components/ui";
import { Check, Pencil, X } from "lucide-react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { toast } from "sonner";

interface InlineEditFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  activeEditField: Path<T> | null;
  setActiveEditField: (field: Path<T> | null) => void;
  initialValues: Partial<T>;
}

/**
 * A reusable inline editable field that integrates with react-hook-form.
 */
export function InlineEditField<T extends FieldValues>({
  form,
  name,
  label,
  type = "text",
  placeholder = "Non renseigné",
  activeEditField,
  setActiveEditField,
  initialValues,
}: InlineEditFieldProps<T>) {
  const { register, getValues, reset, trigger, watch, formState } = form;
  const isEditing = activeEditField === name;
  const currentValue = watch(name);
  const error = formState.errors[name]?.message as string | undefined;

  if (!isEditing) {
    return (
      <div
  key={name}
  className="py-3 px-2 border-b border-slate-200 hover:bg-gray-50 transition-colors "
>
  {/* Label */}
  <span className="text-sm font-medium text-gray-500">{label}</span>

  {/* Value + Edit Button */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 w-full">
    <span
      className="text-gray-900 truncate max-w-full sm:max-w-sm"
      title={currentValue}
    >
      {currentValue}
    </span>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`Modifier ${label}`}
      onClick={async () => {
        if (activeEditField) {
          await trigger(activeEditField);
          if (formState.errors[activeEditField]) {
            toast.warning(
              "Veuillez corriger le champ actuel avant de passer à un autre."
            );
            return;
          }
        }
        setActiveEditField(name);
      }}
      className="flex items-center gap-1"
    >
      <Pencil className="w-4 h-4 text-gray-600" />
      <span className="hidden md:inline text-xs">Modifier</span>
    </Button>
  </div>
</div>

    );
  }

  return (
    <div key={name} className="px-4 py-3 border-l-4 border-blue-500 bg-blue-50 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 rounded-md">
      {/* Input Section */}
      <div className="flex-1 min-w-[200px]">
        <Input
          label={label}
          type={type}
          placeholder={placeholder}
          {...register(name)}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 sm:pt-0">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={async () => {
            const valid = await trigger(name);
            if (!valid) {
              toast.error("Veuillez corriger les erreurs avant de sauvegarder.");
              return;
            }
            setActiveEditField(null);
          }}
          className="flex items-center gap-1">
          <Check className="w-5 h-5 text-green-600" />
          <span className="hidden sm:inline text-sm">Valider</span>
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => {
            setActiveEditField(null);
            reset({ ...getValues(), [name]: initialValues[name] });
          }}
          className="flex items-center gap-1">
          <X className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">Annuler</span>
        </Button>
      </div>
    </div>

  );
}
