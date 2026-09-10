'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, ContextRequired, Input, Label, LoadingSpinner, TextArea } from '@/components/ui';
import { useScopeContext } from '@/hooks/useScopeContext';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';
import { toastApiError } from '@/utils';

/**
 * A club's own details.
 *
 * The organisation has `/tenant/settings` and a competition has `/league/settings`; a club
 * had **nothing** — `/team/edit` rendered the words "Edit Team Page", so a club that spelt its own
 * name wrong at registration had no way to correct it, and no logo could ever be set. That is the
 * one genuine gap among the four "edit" stubs: the other two duplicate a settings screen that
 * already exists, and are deleted rather than built
 * (`docs/PLAYERS_AND_STATS.md` §3.2).
 *
 * Scoped to the four fields `UpdateTeamProfileByTaDto` lets a club administrator change. Status,
 * visibility, the competition and the home venue are a league administrator's, which is what that
 * DTO says and what this screen therefore does not offer.
 */
export default function TeamEditPage() {
  const qc = useQueryClient();
  const ctx = useScopeContext();
  const user = useAuthStore((s) => s.user);
  const teamId = user?.managingTeamId ?? ctx.teamId;

  const team = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => (await api.get(`/teams/${teamId}`)).data,
    enabled: !!teamId,
  });

  const [form, setForm] = useState({ name: '', shortCode: '', description: '', logoUrl: '' });
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded || !team.data) return;
    setForm({
      name: team.data.name ?? '',
      shortCode: team.data.shortCode ?? '',
      description: team.data.description ?? '',
      logoUrl: team.data.logoUrl ?? team.data.businessProfile?.logoUrl ?? '',
    });
    setSeeded(true);
  }, [team.data, seeded]);

  const save = useMutation({
    mutationFn: async (body: Record<string, string | undefined>) =>
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
        Impossible de charger les informations de ce club.
      </p>
    );
  }

  const original = {
    name: team.data.name ?? '',
    shortCode: team.data.shortCode ?? '',
    description: team.data.description ?? '',
    logoUrl: team.data.logoUrl ?? team.data.businessProfile?.logoUrl ?? '',
  };
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== original[k]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Informations du club</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Le nom et l&apos;abréviation utilisés partout dans l&apos;application — sur le calendrier, au
        classement et sur la feuille de match.
      </p>

      <form
        className="space-y-4 rounded-xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!dirty) return;
          // Only what changed. An empty string is a deliberate clearing on a text field, so it is
          // sent; an untouched field is not, and the server keeps what it had.
          const body: Record<string, string> = {};
          for (const k of Object.keys(form) as (keyof typeof form)[]) {
            if (form[k] !== original[k]) body[k] = form[k];
          }
          save.mutate(body);
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
            Trois lettres, comme « VIR ». C&apos;est ce qui apparaît sur les grilles étroites et sur
            le classement imprimé.
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

        <div>
          <Label htmlFor="logoUrl">Logo (URL)</Label>
          <Input
            id="logoUrl"
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://…"
          />
          {/* An address, not an upload, until item 17 wires S3. Saying so is better than a file
              picker that cannot store the file it is handed. */}
          <p className="mt-1 text-xs text-ink-subtle">
            L&apos;envoi d&apos;un fichier arrive avec le site public ; en attendant, collez
            l&apos;adresse d&apos;une image.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit" variant="primary" disabled={!dirty} isLoading={save.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
