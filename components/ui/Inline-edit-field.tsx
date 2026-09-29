'use client';
import { Button, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Pencil, X } from "lucide-react";
import { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
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
  /**
   * A choice from a list instead of free text: edited with a select, and shown by its label. For
   * values a reader should never have to type — a time zone, where « UTC+1 » looks right and is not.
   */
  options?: { value: string; label: string }[];
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
  options,
}: InlineEditFieldProps<T>) {
  const { register, getValues, reset, trigger, watch, formState, setValue } = form;
  const isEditing = activeEditField === name;
  const currentValue = watch(name);
  const shown = options?.find((o) => o.value === currentValue)?.label ?? currentValue;
  const error = formState.errors[name]?.message as string | undefined;

  if (!isEditing) {
    return (
      <div
  key={name}
  className="py-3 px-2 border-b border-line hover:bg-surface-sunk transition-colors "
>
  {/* Label */}
  <span className="text-sm font-medium text-ink-muted">{label}</span>

  {/* Value + Edit Button */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 w-full">
    <span
      className="text-ink truncate max-w-full sm:max-w-sm"
      title={shown}
    >
      {shown}
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
      <Pencil className="w-4 h-4 text-ink-muted" />
      <span className="hidden md:inline text-xs">Modifier</span>
    </Button>
  </div>
</div>

    );
  }

  return (
    <div key={name} className="px-4 py-3 border-l-4 border-accent bg-accent-soft flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 rounded-md">
      {/* Input Section */}
      <div className="flex-1 min-w-[200px]">
        {options ? (
          <>
            <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
            <Select
              value={currentValue ?? ''}
              onValueChange={(v) => setValue(name, v as PathValue<T, Path<T>>, { shouldDirty: true })}
            >
              <SelectTrigger aria-label={label}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <Input
            label={label}
            type={type}
            placeholder={placeholder}
            {...register(name)}
          />
        )}
        {error && <p className="text-xs text-negative mt-1">{error}</p>}
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
          <Check className="w-5 h-5 text-positive" />
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
