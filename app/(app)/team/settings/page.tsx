'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, ContextRequired, Input, Label, LoadingSpinner, PageHeader, PageShell, TextArea } from '@/components/ui';
import { SettingsSection } from '@/components/league/settings/settings-section';
import { ImageField } from '@/components/media/image-field';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { toastApiError } from '@/utils';

/**
 * A club's settings — the same address, title and place in the menu as the organisation's and the
 * competition's (`/tenant/settings`, `/league/settings`). It was `/team/edit`, « Informations »,
 * in the middle of « Mon club »; the middleware sends the old address here.
 *
 * Scoped to what `UpdateTeamProfileByTaDto` lets a club administrator change: the name, the
 * abbreviation, the description and the logo. Status, visibility, the competition and the home venue
 * are a league administrator's, which is what that DTO says and what this screen therefore does not
 * offer. The logo sits at the top of « Identité » and saves itself when its crop is confirmed; the
 * fields under it save with « Enregistrer » (owner, 2026-10-07).
 */
export default function TeamSettingsPage() {
  const qc = useQueryClient();
  const ctx = useScopeContext();
  const user = useAuthStore((s) => s.user);
  const teamId = user?.managingTeamId ?? ctx.teamId;

  const team = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => (await api.get(`/teams/${teamId}`)).data,
    enabled: !!teamId,
  });

  const [form, setForm] = useState({ name: '', shortCode: '', description: '' });
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded || !team.data) return;
    setForm({
      name: team.data.name ?? '',
      shortCode: team.data.shortCode ?? '',
      // The description lives on the club's business profile, like its logo.
      description: team.data.businessProfile?.description ?? '',
    });
    setSeeded(true);
  }, [team.data, seeded]);

  const save = useMutation({
    mutationFn: async (body: Record<string, string | null>) =>
      (await api.put(`/teams/${teamId}`, body)).data,
    onSuccess: () => {
      toast.success('Club mis à jour.');
      qc.invalidateQueries({ queryKey: ['team', teamId] });
      qc.invalidateQueries({ queryKey: ['scope', 'team', teamId] });
    },
    onError: (e) => toastApiError(e),
  });

  if (ctx.isLoading) return null;
  if (!teamId) return <ContextRequired what="équipe" />;

  if (team.isPending) {
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (team.isError) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        Impossible de charger les paramètres de ce club.
      </p>
    );
  }

  const original = {
    name: team.data.name ?? '',
    shortCode: team.data.shortCode ?? '',
    description: team.data.businessProfile?.description ?? '',
  };
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== original[k]);

  // A club cannot be without a name or an abbreviation: the calendar and the table print them.
  const complete = !!form.name.trim() && !!form.shortCode.trim();

  const submit = () => {
    if (!dirty || !complete) return;
    // Only what changed; an untouched field is not sent and the server keeps what it had. A cleared
    // description goes as null: the API turns an empty string into « not sent » on every PUT
    // (SanitizeDtoInterceptor), so '' would leave the old text in place.
    const body: Record<string, string | null> = {};
    for (const k of Object.keys(form) as (keyof typeof form)[]) {
      if (form[k] !== original[k]) body[k] = form[k].trim() === '' ? null : form[k];
    }
    save.mutate(body);
  };

  return (
    <PageShell className="max-w-3xl">
      <PageHeader title="Paramètres" description={team.data.name} />

      <div className="space-y-6">
        <SettingsSection
          title="Identité"
          description="Le logo, le nom et l’abréviation utilisés partout : sur le calendrier, au classement et sur la feuille de match."
          footer={
            <div className="flex justify-end">
              <Button variant="primary" onClick={submit} disabled={!dirty || !complete} isLoading={save.isPending}>
                Enregistrer
              </Button>
            </div>
          }
        >
          {/* The logo saves itself when its crop is confirmed; « Enregistrer » is for the fields below. */}
          <ImageField
            slot="team-logo"
            entityId={teamId}
            value={team.data.businessProfile?.logoUrl}
            name={team.data.name ?? ''}
            className="mb-5 border-b border-line pb-5"
          />

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div>
              <Label htmlFor="name">Nom du club</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="shortCode">Abréviation</Label>
              <Input
                id="shortCode"
                value={form.shortCode}
                onChange={(e) => setForm((f) => ({ ...f, shortCode: e.target.value.toUpperCase() }))}
                className="uppercase"
                maxLength={5}
              />
              <p className="mt-1 text-xs text-ink-subtle">
                Trois lettres, comme « VIR ». C&apos;est ce qui apparaît sur les grilles étroites et
                sur le classement imprimé.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </form>
        </SettingsSection>

      </div>
    </PageShell>
  );
}
