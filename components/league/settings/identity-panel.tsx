'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button, Input, Label, SelectField, Switch } from '@/components/ui';
import { useLeague, useUpdateLeague } from '@/services/leagues';
import { toastApiError } from '@/utils';
import { SettingsSection } from './settings-section';

const GENDERS = [
  { value: 'MALE', label: 'Messieurs' },
  { value: 'FEMALE', label: 'Dames' },
  { value: 'MIXED', label: 'Mixte' },
];

const VISIBILITIES = [
  { value: 'PUBLIC', label: 'Publique' },
  { value: 'PRIVATE', label: 'Privée' },
];

/**
 * What a competition *is*: its name, its category, whether anyone outside can see it.
 *
 * The screen this replaces was one 398-line form with every field in a two-column grid and a single
 * Save at the bottom — an unaccented « Parametres Generales » over `shadow-md`, written before the
 * design system existed. Its real problem was not the styling: **a name and a visibility setting
 * are not the same kind of decision**, and putting them in one grid under one button means every
 * save is a save of everything.
 *
 * So each section states what it governs, and the save is per section. Nothing is committed by
 * being looked at, and the button stays disabled until something actually differs — a form that
 * always offers to save cannot tell you whether you have changed anything.
 */
export function IdentityPanel({ leagueId }: { leagueId: string }) {
  const { data: league, isPending } = useLeague(leagueId);
  const update = useUpdateLeague();

  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [gender, setGender] = useState('');
  const [visibility, setVisibility] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!league) return;
    setName(league.name);
    setDivision(league.division ?? '');
    setGender(league.gender ?? 'MALE');
    setVisibility(league.visibility ?? 'PUBLIC');
    setIsActive(league.isActive ?? true);
  }, [league]);

  const identityDirty = useMemo(
    () =>
      !!league &&
      (name.trim() !== league.name ||
        division.trim() !== (league.division ?? '') ||
        gender !== (league.gender ?? 'MALE')),
    [league, name, division, gender],
  );

  const accessDirty = useMemo(
    () =>
      !!league &&
      (visibility !== (league.visibility ?? 'PUBLIC') || isActive !== (league.isActive ?? true)),
    [league, visibility, isActive],
  );

  if (isPending || !league) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" aria-hidden />
      </div>
    );
  }

  const save = (dto: Parameters<typeof update.mutate>[0]) =>
    update.mutate(dto, {
      onSuccess: () => toast.success('Enregistré.'),
      onError: (e) => toastApiError(e),
    });

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Identité"
        description="Le nom sous lequel cette compétition est publiée, et la catégorie qu’elle regroupe."
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-subtle">
              Le nom apparaît sur le classement publié et sur chaque rencontre.
            </p>
            <Button
              variant="primary"
              disabled={!identityDirty || !name.trim()}
              isLoading={update.isPending}
              onClick={() =>
                save({
                  id: leagueId,
                  name: name.trim(),
                  division: division.trim() || 'D1',
                  gender,
                })
              }
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="league-name">Nom de la compétition</Label>
            <Input
              id="league-name"
              name="league-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Championnat Goma D1 Messieurs"
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="league-division">Division</Label>
            <Input
              id="league-division"
              name="league-division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              placeholder="D1"
              maxCharacters={8}
              transform="uppercase"
              autoComplete="off"
              hint="Ce qui distingue deux compétitions de même catégorie."
            />
          </div>

          <div>
            <Label htmlFor="league-gender">Catégorie</Label>
            <SelectField
              id="league-gender"
              label="Catégorie"
              placeholder="Choisir"
              value={gender}
              onChange={setGender}
              className="w-full"
              options={GENDERS}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Messieurs et Dames sont deux compétitions distinctes, chacune avec son classement.
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Accès"
        description="Qui peut voir cette compétition, et si elle est encore en activité."
        footer={
          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={!accessDirty}
              isLoading={update.isPending}
              onClick={() => save({ id: leagueId, visibility, isActive })}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="max-w-xs">
            <Label htmlFor="league-visibility">Visibilité</Label>
            <SelectField
              id="league-visibility"
              label="Visibilité"
              placeholder="Choisir"
              value={visibility}
              onChange={setVisibility}
              className="w-full"
              options={VISIBILITIES}
            />
            <p className="mt-1 text-xs text-ink-muted">
              {visibility === 'PRIVATE'
                ? 'Seuls les membres de l’organisation voient cette compétition.'
                : 'Le classement et le calendrier sont consultables publiquement.'}
            </p>
          </div>

          {/* A switch, not a dropdown of two words. Archiving is a state, and « Active / Inactive »
              in a select reads as a setting to be configured rather than a thing to be turned off. */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-line px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Compétition active</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Une compétition archivée garde tout son historique — classement, calendrier,
                statistiques — mais n’accepte plus de nouvelles rencontres.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Compétition active" />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
