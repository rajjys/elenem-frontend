'use client';

import { useRef, useState } from 'react';
import { ClipboardList, Plus, X } from 'lucide-react';
import { Button, Input, Label, TextArea } from '@/components/ui';
import { parseTeamLines, suggestShortCode, type TeamRow } from '@/services/setup';

/**
 * Entering the clubs: a name and a short code per row.
 *
 * A plain textarea got the names in quickly but hid the code entirely, and the code is not a
 * detail — it is what the published table and every fixture line actually show. Leagues that
 * already publish VIR, CHX and MAE have to be able to keep them, so the derived code is offered
 * as a placeholder the organiser can type over rather than a value imposed on them.
 *
 * Pasting is still the fast path: the block expands into rows, each with its own code, which can
 * then be corrected one at a time.
 */

export interface EditableTeamRow extends TeamRow {
  /** Stable across re-orders, so React does not reuse the wrong input when a row is removed. */
  key: string;
  /**
   * Set once the organiser types their own code, after which the field stops following the
   * name. A league already publishing VIR, CHX and MAE has to keep them, so a suggestion must
   * never overwrite a decision.
   */
  codeEdited?: boolean;
}

let rowCounter = 0;
function newRow(name = '', shortCode = ''): EditableTeamRow {
  rowCounter += 1;
  // A code that arrived with a pasted line is the organiser's, so it is already "edited".
  return { key: `row-${rowCounter}`, name, shortCode, codeEdited: !!shortCode };
}

export function emptyRows(count = 3): EditableTeamRow[] {
  return Array.from({ length: count }, () => newRow());
}

/** Rows worth submitting: a name is required, a code is not. */
export function filledRows(rows: EditableTeamRow[]): TeamRow[] {
  const seen = new Set<string>();
  const out: TeamRow[] = [];
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase('fr');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, shortCode: row.shortCode?.trim() ? row.shortCode.trim().toUpperCase() : undefined });
  }
  return out;
}

export function TeamRowsEditor({
  rows,
  onChange,
}: {
  rows: EditableTeamRow[];
  onChange: (rows: EditableTeamRow[]) => void;
}) {
  const [pasting, setPasting] = useState(false);
  const [block, setBlock] = useState('');
  const lastNameRef = useRef<HTMLInputElement | null>(null);

  function update(index: number, patch: Partial<EditableTeamRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  /** Typing a name fills the code in, until the organiser writes their own. */
  function updateName(index: number, name: string) {
    const row = rows[index];
    update(index, {
      name,
      ...(row.codeEdited ? {} : { shortCode: suggestShortCode(name) }),
    });
  }

  function addRow() {
    onChange([...rows, newRow()]);
    // Focus lands on the new field so a run of teams can be typed without reaching for the mouse.
    requestAnimationFrame(() => lastNameRef.current?.focus());
  }

  function removeRow(index: number) {
    onChange(rows.length === 1 ? [newRow()] : rows.filter((_, i) => i !== index));
  }

  function applyPaste() {
    const parsed = parseTeamLines(block);
    if (parsed.length === 0) return;
    // Replaces empty rows rather than appending under them, so pasting into a fresh form does
    // not leave three blanks at the top.
    const kept = rows.filter((r) => r.name.trim());
    // A pasted line without a code still gets one. Leaving "—" there would hand the organiser
    // twenty-five blanks to fill in, which is the work this box exists to remove.
    onChange([
      ...kept,
      ...parsed.map((t) => newRow(t.name, t.shortCode ?? suggestShortCode(t.name))),
    ]);
    setBlock('');
    setPasting(false);
  }

  const named = rows.filter((r) => r.name.trim()).length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <Label>Équipes</Label>
        <button
          type="button"
          onClick={() => setPasting((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-accent-text hover:underline"
        >
          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
          {pasting ? 'Fermer' : 'Coller une liste'}
        </button>
      </div>

      {pasting && (
        <div className="space-y-2 rounded-lg border border-line bg-surface-sunk p-3">
          <TextArea
            rows={5}
            spellCheck={false}
            value={block}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBlock(e.target.value)}
            placeholder={'BC Virunga\nAS Vita Club, VIT\nChaux Sport'}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-subtle">
              Une équipe par ligne. Le sigle peut suivre une virgule.
            </p>
            <Button type="button" variant="secondary" onClick={applyPaste} disabled={!block.trim()}>
              Ajouter à la liste
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Empty spans rather than sr-only ones: sr-only is absolutely positioned, so it leaves
            the grid flow entirely and every following header slides a column to the left. */}
        <div className="grid grid-cols-[1.5rem_1fr_5.5rem_2rem] gap-2 px-0.5" aria-hidden>
          <span />
          <span className="text-[0.6875rem] uppercase tracking-wider text-ink-subtle">Nom</span>
          <span className="text-[0.6875rem] uppercase tracking-wider text-ink-subtle">Sigle</span>
          <span />
        </div>

        {rows.map((row, index) => (
          <div key={row.key} className="grid grid-cols-[1.5rem_1fr_5.5rem_2rem] gap-2 items-center">
            {/* Numbered, because on a phone the list is the only place the count is visible. */}
            <span className="text-right text-xs tabular-nums text-ink-subtle">{index + 1}</span>
            <Input
              aria-label={`Nom de l'équipe ${index + 1}`}
              placeholder="BC Virunga"
              transform="name"
              maxCharacters={80}
              autoTrim
              value={row.name}
              ref={index === rows.length - 1 ? lastNameRef : undefined}
              onChange={(e) => updateName(index, e.target.value)}
            />
            <Input
              aria-label={`Sigle de l'équipe ${index + 1}`}
              transform="uppercase"
              maxCharacters={4}
              placeholder="—"
              value={row.shortCode ?? ''}
              onChange={(e) =>
                update(index, { shortCode: e.target.value.toUpperCase(), codeEdited: true })
              }
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              aria-label={`Retirer la ligne ${index + 1}`}
              className="flex h-9 w-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-sunk hover:text-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={addRow}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Ajouter une équipe
        </Button>
        <span className="text-xs text-ink-subtle">
          {named === 0 ? 'Aucune équipe' : `${named} équipe${named > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
}
