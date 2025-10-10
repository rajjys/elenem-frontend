import { FieldErrors } from "react-hook-form";
import { capitalizeFirst } from "./capitalize";

export function flattenErrors(errors: FieldErrors, prefix = ""): string[] {
  const result: string[] = [];

  for (const [key, value] of Object.entries(errors)) {
    const fieldPath = prefix ? `${prefix}${key}` : key;

    if (value && typeof value === "object") {
      // Direct message
      if ("message" in value && value.message) {
        result.push(`${fieldPath}: ${value.message}`);
      }

      // Nested types
      if ("types" in value && value.types) {
        for (const [subKey, subMsg] of Object.entries(value.types)) {
          result.push(`${fieldPath}.${subKey}: ${subMsg}`);
        }
      }

      // Recurse into nested objects
      for (const [subKey, subValue] of Object.entries(value)) {
        if (
          typeof subValue === "object" &&
          subValue !== null &&
          !["message", "type", "ref", "types"].includes(subKey)
        ) {
          result.push(...flattenErrors({ [subKey]: subValue } as FieldErrors, `${capitalizeFirst(fieldPath)}: `));
        }
      }
    }
  }

  return result;
}
