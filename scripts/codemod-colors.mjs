#!/usr/bin/env node
// Rewrites hardcoded Tailwind colour utilities onto the design tokens.
//
//   node scripts/codemod-colors.mjs --dry components app       report only
//   node scripts/codemod-colors.mjs components/ui              apply
//
// Why a script: there were 2,275 hardcoded colour utilities across 13 colour families, plus two
// competing neutral greys. Hand-editing that is how you get a half-migrated codebase. See
// docs/DESIGN_AND_MVP_PLAN.md §2.5.
//
// Two rules encoded here:
//   * one neutral. gray / slate / zinc / neutral / stone all collapse onto the ink+line+surface
//     tokens.
//   * colour means something. green -> positive, red -> negative, amber/yellow/orange -> caution,
//     blue / indigo / primary -> accent. Nothing else keeps a hue.
//
// `dark:` variants are deleted rather than translated: the token layer resolves light and dark
// itself, so a leftover `dark:` rule fights it instead of helping.
//
// Deliberately NOT touched (context-dependent, needs a human):
//   * text-white / bg-black — correct on a coloured fill, wrong on canvas
//   * gradients (from-/via-/to-) — decorative, being removed by hand
//   * shades 800/900 of any colour — usually an intentional dark surface

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const MAP = [
  // --- surfaces -----------------------------------------------------------
  [/\bbg-white\b/g, 'bg-surface'],
  [/\bbg-(?:gray|slate|zinc|neutral|stone)-(?:50|100)\b/g, 'bg-surface-sunk'],
  [/\bbg-(?:gray|slate|zinc|neutral|stone)-(?:200|300)\b/g, 'bg-line'],

  // --- text ---------------------------------------------------------------
  [/\btext-(?:gray|slate|zinc|neutral|stone)-(?:700|800|900|950)\b/g, 'text-ink'],
  [/\btext-(?:gray|slate|zinc|neutral|stone)-(?:500|600)\b/g, 'text-ink-muted'],
  [/\btext-(?:gray|slate|zinc|neutral|stone)-(?:300|400|450)\b/g, 'text-ink-subtle'],

  // --- rules --------------------------------------------------------------
  [/\bborder-(?:gray|slate|zinc|neutral|stone)-(?:100|200|300)\b/g, 'border-line'],
  [/\bborder-(?:gray|slate|zinc|neutral|stone)-(?:400|500)\b/g, 'border-line-strong'],
  [/\bdivide-(?:gray|slate|zinc|neutral|stone)-(?:100|200|300)\b/g, 'divide-line'],

  // --- accent -------------------------------------------------------------
  [/\bbg-(?:blue|indigo|primary)-(?:500|600|700)\b/g, 'bg-accent'],
  [/\bbg-(?:blue|indigo|primary)-(?:50|100)\b/g, 'bg-accent-soft'],
  [/\btext-(?:blue|indigo|primary)-(?:600|700|800)\b/g, 'text-accent-text'],
  [/\bborder-(?:blue|indigo|primary)-(?:400|500|600)\b/g, 'border-accent'],
  [/\bring-(?:blue|indigo|primary)-(?:400|500|600)\b/g, 'ring-accent'],
  [/\boutline-(?:blue|indigo|primary)-(?:400|500|600)\b/g, 'outline-accent'],

  // --- semantic: it went well --------------------------------------------
  [/\bbg-(?:green|emerald|teal)-(?:50|100)\b/g, 'bg-positive-soft'],
  [/\bbg-(?:green|emerald|teal)-(?:400|500|600|700)\b/g, 'bg-positive'],
  [/\btext-(?:green|emerald|teal)-(?:600|700|800)\b/g, 'text-positive'],
  [/\bborder-(?:green|emerald|teal)-(?:300|400|500|600)\b/g, 'border-positive'],

  // --- semantic: it failed ------------------------------------------------
  [/\bbg-(?:red|rose)-(?:50|100)\b/g, 'bg-negative-soft'],
  [/\bbg-(?:red|rose)-(?:400|500|600|700)\b/g, 'bg-negative'],
  [/\btext-(?:red|rose)-(?:500|600|700|800)\b/g, 'text-negative'],
  [/\bborder-(?:red|rose)-(?:300|400|500|600)\b/g, 'border-negative'],

  // --- semantic: needs attention -----------------------------------------
  [/\bbg-(?:yellow|amber|orange)-(?:50|100)\b/g, 'bg-caution-soft'],
  [/\bbg-(?:yellow|amber|orange)-(?:400|500|600)\b/g, 'bg-caution'],
  [/\btext-(?:yellow|amber|orange)-(?:600|700|800)\b/g, 'text-caution'],
  [/\bborder-(?:yellow|amber|orange)-(?:300|400|500)\b/g, 'border-caution'],


  // --- second pass: shades and utilities the first pass left, now that the
  //     obvious cases are done and the remainder has been eyeballed ------------
  [/\bring-(?:red|rose)-(?:400|500|600)\b/g, 'ring-negative'],
  [/\bring-(?:green|emerald|teal)-(?:400|500|600)\b/g, 'ring-positive'],
  [/\bring-(?:gray|slate|zinc|neutral|stone)-(?:300|400|500)\b/g, 'ring-line-strong'],
  [/\btext-(?:blue|indigo|primary)-(?:400|500)\b/g, 'text-accent-text'],
  [/\btext-(?:green|emerald|teal)-(?:400|500|900)\b/g, 'text-positive'],
  [/\btext-(?:red|rose)-(?:400|900)\b/g, 'text-negative'],
  [/\btext-(?:yellow|amber|orange)-(?:400|500|900)\b/g, 'text-caution'],
  [/\bborder-(?:red|rose)-(?:100|200)\b/g, 'border-negative'],
  [/\bborder-(?:green|emerald|teal)-(?:100|200)\b/g, 'border-positive'],
  [/\bborder-(?:yellow|amber|orange)-(?:100|200)\b/g, 'border-caution'],
  [/\bborder-(?:blue|indigo|primary)-(?:100|200|300)\b/g, 'border-accent-line'],
  [/\bborder-(?:gray|slate|zinc|neutral|stone)-(?:50|600|700|800|900)\b/g, 'border-line'],
  [/\bbg-(?:gray|slate|zinc|neutral|stone)-(?:400|500|600)\b/g, 'bg-ink-subtle'],
  [/\btext-(?:gray|slate|zinc|neutral|stone)-(?:100|200)\b/g, 'text-ink-inverted'],
  [/\bbg-(?:blue|indigo|primary)-(?:300|400)\b/g, 'bg-accent'],
  [/\bbg-(?:red|rose)-(?:300)\b/g, 'bg-negative'],


  // --- legacy shadcn-style tokens ------------------------------------------
  // Some were defined light-only (--foreground: #171717), so they rendered near-black on a dark
  // surface — that is why league names vanished in dark mode. The rest (popover, ring, input,
  // *-foreground) were never defined at all and generated no CSS, exactly like primary-* did.
  [/\btext-card-foreground\b/g, 'text-ink'],
  [/\btext-primary-foreground\b/g, 'text-accent-ink'],
  [/\btext-accent-foreground\b/g, 'text-accent-text'],
  [/\btext-muted-foreground\b/g, 'text-ink-muted'],
  [/\btext-foreground\b/g, 'text-ink'],
  [/\btext-popover\b/g, 'text-ink'],
  [/\btext-muted\b/g, 'text-ink-muted'],
  [/\bbg-background\b/g, 'bg-canvas'],
  [/\bbg-popover\b/g, 'bg-elevated'],
  [/\bbg-muted\b/g, 'bg-surface-sunk'],
  [/\bring-ring\b/g, 'ring-accent'],
  [/\bborder-input\b/g, 'border-line'],

  // --- the token layer owns light/dark now --------------------------------
  [/\bdark:[a-z0-9:[\]/.-]+\s?/g, ''],
];

const EXTS = new Set(['.tsx', '.ts']);
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'scripts']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const targets = args.filter((a) => !a.startsWith('--'));
if (!targets.length) {
  console.error('usage: node scripts/codemod-colors.mjs [--dry] <dir> [dir…]');
  process.exit(1);
}

let filesChanged = 0;
let totalReplacements = 0;
const perRule = new Map();

for (const target of targets) {
  for (const file of walk(target)) {
    const before = readFileSync(file, 'utf8');
    let after = before;
    let fileCount = 0;

    for (const [re, to] of MAP) {
      const matches = after.match(re);
      if (!matches) continue;
      fileCount += matches.length;
      perRule.set(String(re), (perRule.get(String(re)) ?? 0) + matches.length);
      after = after.replace(re, to);
    }

    if (fileCount > 0) {
      filesChanged++;
      totalReplacements += fileCount;
      if (!dry) writeFileSync(file, after);
    }
  }
}

console.log(`${dry ? 'WOULD CHANGE' : 'CHANGED'}: ${filesChanged} files, ${totalReplacements} replacements`);
const top = [...perRule.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
for (const [rule, n] of top) {
  console.log(`  ${String(n).padStart(5)}  ${rule.slice(0, 88)}`);
}
