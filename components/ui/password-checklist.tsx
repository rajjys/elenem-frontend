'use client';

import { Check, Circle, X } from 'lucide-react';
import { cn } from '@/utils';

/**
 * The password rule, and two pieces of advice, as rows that go green as they are met.
 *
 * The rule is one: at least 8 characters (PHASE5A_PRODUCT_SITE §8.3, decided 2026-09-26). On a
 * phone keyboard, composition rules are where people give up, and current guidance (NIST
 * SP 800-63B) favours length. A capital and a digit or symbol still make a password stronger, so
 * they stay on screen as advice: they tick when met, but they never block a submit and never turn
 * red. The backend checks the same rule.
 */

export interface PasswordRule {
  label: string;
  met: boolean;
  /** Advice is shown and ticked, but a password without it is accepted. */
  advice?: boolean;
}

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export function passwordRules(value: string): PasswordRule[] {
  return [
    { label: `${PASSWORD_MIN} caractères au minimum`, met: value.length >= PASSWORD_MIN },
    { label: 'Une majuscule (conseillé)', met: /[A-Z]/.test(value), advice: true },
    { label: 'Un chiffre ou un symbole (conseillé)', met: /[\d\W]/.test(value), advice: true },
  ];
}

export function passwordMeetsRules(value: string): boolean {
  return passwordRules(value).every((r) => r.met || r.advice);
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
    <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 pt-0.5 sm:grid-cols-2">
      {rules.map((rule) => {
        const failed = showFailures && !rule.met && !rule.advice;
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
