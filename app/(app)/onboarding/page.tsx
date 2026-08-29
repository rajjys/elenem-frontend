'use client';

import { AccessGate } from '@/app/(auth)/AccessGate';
import { SetupWizard } from '@/components/onboarding';
import { Roles } from '@/schemas';

/**
 * The signed-in half of onboarding: competition, season, clubs.
 *
 * Reached from the end of sign-up, and reachable again later — an organiser who skipped it, or
 * who is adding a second competition, gets the same guided path rather than a different one.
 */
export default function OnboardingPage() {
  return (
    <AccessGate allowedRoles={[Roles.SYSTEM_ADMIN, Roles.TENANT_ADMIN, Roles.LEAGUE_ADMIN]}>
      <SetupWizard />
    </AccessGate>
  );
}
