'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Input, Label, Modal, SelectField } from '@/components/ui';
import { useStandingsLeagues } from '@/services/standings';
import { useCreateTeam, useUpdateTeam, suggestShortCode, type TeamListItem } from '@/services/teams';
import { toastApiError } from '@/utils';

/**
 * Registering one club.
 *
 * This replaces a three-step, 495-line form on a page of its own, which asked for a logo, a banner,
 * a founding year, a contact e-mail, a website, a tax number and bank details — for a record the
 * server will accept with **a name and a competition**. An organiser adding a club that turned up
 * in week three has none of that to hand and does not need it to register them.
 *
 * What the old form collected is not lost, it is *later*: `/team/edit` is where a club's details go
 * once the club exists, which is the only order in which anybody actually has them
 * (`UI_CONVENTIONS` §7).
 *
 * The abbreviation is **suggested and left editable**. A results table needs one — « VIR – KAR » is
 * how a fixture is written — and asking an organiser to invent twenty of them is how you get twenty
 * blanks; but two clubs in one town can genuinely both shorten to KIV, and only the organiser knows
 * which one gets it. It stops following the name the moment it is touched.
 */
export function TeamFormDialog({
  open,
  onOpenChange,
  team,
  leagueId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing. Only name and abbreviation — the rest is `/team/edit`. */
  team?: TeamListItem | null;
  /** Pinned when the screen is already inside one competition. */
  leagueId?: string;
}) {
  const isEdit = !!team;

  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [pickedLeague, setPickedLeague] = useState('');

  // Reset per opening rather than per mount: the dialog is kept mounted by its parent, so without
  // this the second club you add starts with the first one's name in the field.
  useEffect(() => {
    if (!open) return;
    setName(team?.name ?? '');
    setShortCode(team?.shortCode ?? '');
    setCodeTouched(!!team?.shortCode);
    setPickedLeague(leagueId ?? team?.leagueId ?? '');
  }, [open, team, leagueId]);

  const leagues = useStandingsLeagues(open && !leagueId && !isEdit);
  const leagueOptions = useMemo(() => leagues.data?.data ?? [], [leagues.data]);

  // One competition is not a choice. The picker appears only where there is something to pick.
  const needsLeaguePicker = !leagueId && !isEdit && leagueOptions.length > 1;

  const create = useCreateTeam();
  const update = useUpdateTeam();
  const busy = create.isPending || update.isPending;

  /**
   * Which competition this club joins.
   *
   * `??` was wrong here: `pickedLeague` starts as the empty string, which is not nullish, so it
   * short-circuited the fallback and the form sat permanently disabled with a picker showing
   * « Choisir une compétition ». When the picker is on screen a choice is genuinely required;
   * when it is not, there is exactly one competition and it is the answer.
   */
  const effectiveLeagueId = leagueId || pickedLeague || (needsLeaguePicker ? '' : leagueOptions[0]?.id ?? '');
  const canSubmit = !!name.trim() && !busy && (isEdit || !!effectiveLeagueId);

  const onNameChange = (value: string) => {
    setName(value);
    if (!codeTouched) setShortCode(suggestShortCode(value));
  };

  const submit = () => {
    if (!canSubmit) return;
    const code = shortCode.trim().toUpperCase() || undefined;

    if (isEdit && team) {
      update.mutate(
        { id: team.id, dto: { name: name.trim(), shortCode: code ?? null } },
        {
          onSuccess: () => {
            toast.success(`${name.trim()} enregistré.`);
            onOpenChange(false);
          },
          onError: (e) => toastApiError(e),
        },
      );
      return;
    }

    create.mutate(
      { name: name.trim(), leagueId: effectiveLeagueId, ...(code ? { shortCode: code } : {}) },
      {
        onSuccess: (t) => {
          toast.success(`${t.name} inscrit.`);
          onOpenChange(false);
        },
        onError: (e) => toastApiError(e),
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Modifier le club' : 'Nouveau club'}
      className="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit} isLoading={busy}>
            {isEdit ? 'Enregistrer' : 'Inscrire le club'}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <Label htmlFor="team-name">Nom du club</Label>
          <Input
            id="team-name"
            name="team-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="BC Virunga"
            autoComplete="off"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="team-code">Abréviation</Label>
          <Input
            id="team-code"
            name="team-code"
            value={shortCode}
            onChange={(e) => {
              setCodeTouched(true);
              setShortCode(e.target.value);
            }}
            placeholder="VIR"
            maxCharacters={5}
            transform="uppercase"
            autoComplete="off"
            className="uppercase"
            hint="Utilisée dans le calendrier et le classement : « VIR – KAR »."
          />
        </div>

        {needsLeaguePicker && (
          <div>
            <Label htmlFor="team-league">Compétition</Label>
            <SelectField
              id="team-league"
              label="Compétition"
              placeholder="Choisir une compétition"
              value={pickedLeague}
              onChange={setPickedLeague}
              options={leagueOptions.map((l) => ({ value: l.id, label: l.name }))}
            />
          </div>
        )}

        {!isEdit && (
          <p className="text-xs text-ink-subtle">
            Ville, année de fondation et logo se renseignent ensuite sur la fiche du club.
          </p>
        )}
      </form>
    </Modal>
  );
}
