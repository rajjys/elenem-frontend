/**
 * The sports that cannot end level, as an organiser names them.
 *
 * Mirrors the API (`src/sport-rules/utils/result-rules.ts`), which decides; this only lets a
 * dialog say so before the request instead of after it. Basketball plays overtime and volleyball a
 * fifth set until somebody wins, so a level final score there is a typo — the owner, 2026-10-12.
 */
const NO_DRAW_SPORT_FR: Record<string, string> = {
  BASKETBALL: 'basketball',
  VOLLEYBALL: 'volley-ball',
};

/** Why this final score cannot be recorded in this sport, or `null` when it can. */
export function levelScoreRefusal(
  sport: string | null | undefined,
  home: number,
  away: number,
): string | null {
  if (home !== away || !sport) return null;
  const name = NO_DRAW_SPORT_FR[sport];
  return name ? `Un match de ${name} ne se termine pas sur un nul (${home}–${away}). Vérifiez le score.` : null;
}
