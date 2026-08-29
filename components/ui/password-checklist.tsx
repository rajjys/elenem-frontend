'use client';

import { Check, Circle, X } from 'lucide-react';
import { cn } from '@/utils';

/**
 * The password rules, shown as four rows that go green as they are met.
 *
 * A single sentence listing every requirement, backed by errors that appear one at a time —
 * "il manque une majuscule", fix it, submit, "il manque un chiffre" — makes the reader discover
 * the rules by failing them. All four are stated up front here and each answers itself while
 * they type, so nothing is learned by being refused.
 */

export interface PasswordRule {
  label: string;
  met: boolean;
}

export function passwordRules(value: string): PasswordRule[] {
  return [
    { label: '8 caractères au minimum', met: value.length >= 8 },
    { label: 'Une lettre majuscule', met: /[A-Z]/.test(value) },
    { label: 'Une lettre minuscule', met: /[a-z]/.test(value) },
    { label: 'Un chiffre ou un symbole', met: /[\d\W]/.test(value) },
  ];
}

export function passwordMeetsRules(value: string): boolean {
  return passwordRules(value).every((r) => r.met);
}

export function PasswordChecklist({
  value,
  /** After a rejected submit, an unmet rule is the reason — say so in red rather than in grey. */
  showFailures = false,
}: {
  value: string;
  showFailures?: boolean;
}) {
  const rules = passwordRules(value);

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
      {rules.map((rule) => {
        const failed = showFailures && !rule.met;
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              rule.met ? 'text-positive' : failed ? 'text-negative' : 'text-ink-subtle',
            )}
          >
            {rule.met ? (
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
            ) : failed ? (
              <X className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
