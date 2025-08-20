// src/components/ui/form.tsx

"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"
import { cn } from "@/utils" // A utility function for Tailwind class merging

// -----------------------------------------------------------------------------
// Form Context and Provider (Component: Form)
// -----------------------------------------------------------------------------

// This is the main provider component. It wraps the entire form and passes the form
// context from react-hook-form down to all nested components.
const Form = FormProvider

// -----------------------------------------------------------------------------
// Field Item Context (Component: FormItem)
// -----------------------------------------------------------------------------

// We create a context to hold information about a single form field, like its ID and error state.
// This allows FormLabel, FormControl, and FormMessage to automatically connect to the right field.
type FormItemContextValue = {
  error?: boolean;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // Use a unique ID for each form item
  const id = React.useId();
    const formItemId = id;
    const formDescriptionId = `${id}-description`;
    const formMessageId = `${id}-message`;
  return (
    <FormItemContext.Provider value={{ formItemId, formDescriptionId, formMessageId }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

// Custom hook to access the form item context
function useFormItemContext() {
  const context = React.useContext(FormItemContext)
  if (!context) {
    throw new Error("useFormItemContext must be used within a <FormItem>")
  }
  return context
}

// -----------------------------------------------------------------------------
// Form Field (Component: FormField)
// -----------------------------------------------------------------------------

// This component acts as the bridge between react-hook-form and our custom UI components.
// It wraps react-hook-form's Controller component and injects the field state and props
// into the child component.
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return <Controller {...props} />
}

// -----------------------------------------------------------------------------
// Form Label (Component: FormLabel)
// -----------------------------------------------------------------------------

// This component renders the label for the form field.
// It automatically links the label to the control using the 'htmlFor' attribute.
const FormLabel = React.forwardRef<
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => {
  const { formItemId } = useFormItemContext()
  const { formState: { errors: formError } } = useFormContext();

  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        formError && "text-red-500", // Example of styling based on error state
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

// -----------------------------------------------------------------------------
// Form Control (Component: FormControl)
// -----------------------------------------------------------------------------

// This component is a placeholder for the actual input element.
// It uses the `Slot` component from Radix to automatically render itself as its child
// while passing down the necessary props (like id).
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormItemContext()
  //const { formState: { errors } } = useFormContext();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

// -----------------------------------------------------------------------------
// Form Message (Component: FormMessage)
// -----------------------------------------------------------------------------

// This component displays the error message for the field.
// It only renders when an error exists and is managed by react-hook-form.
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { name: string }
>(({ className, children, name, ...props }, ref) => {
  const { formMessageId } = useFormItemContext()
  const { formState: { errors } } = useFormContext();

  const body = errors[name] ? String(errors[name]?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-red-500", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormItemContext,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
}


