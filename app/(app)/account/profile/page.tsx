'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Input, Label, LoadingSpinner } from '@/components/ui';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { toastApiError } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * The reader's own account.
 *
 * Linked from the sidebar menu **and** the navbar avatar — on every page, for every role — and it
 * rendered the words "User Profile Page". It is the most-linked dead end in the product, which is
 * why it is one of the five routes item 16 builds rather than deletes
 * (`docs/PLAYERS_AND_STATS.md` §3.2).
 *
 * Deliberately small. `PUT /users/me/profile` accepts a dozen fields; this offers the four a person
 * actually corrects about themselves — their name, the username they sign in with, and the address
 * mail goes to. Everything else on that DTO is either set at registration and never touched, or
 * belongs on a screen that does not exist yet, and a form asking for a nationality nothing reads is
 * a form that teaches people this screen is not worth opening.
 *
 * The password lives at `/account/security`, where it already did.
 */
export default function AccountProfilePage() {
  const qc = useQueryClient();
  // Refreshed from `/auth/me` rather than set from the PUT's body: the store holds the shape the
  // whole shell reads (roles, managing ids, the organisation), and a profile response is a
  // narrower object. Writing the narrow one into the store is how a sidebar loses its scope.
  const refreshUser = useAuthStore((s) => s.fetchUser);

  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/users/me')).data,
  });

  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '' });
  const [seeded, setSeeded] = useState(false);

  // Seeded once. A refetch may add to a draft; it may never overwrite it — the rule the scoresheet
  // learned the hard way when adding a player wiped an evening's typing
  // (`GAME_AND_STANDINGS` §6.1).
  useEffect(() => {
    if (seeded || !me.data) return;
    setForm({
      firstName: me.data.firstName ?? '',
      lastName: me.data.lastName ?? '',
      username: me.data.username ?? '',
      email: me.data.email ?? '',
    });
    setSeeded(true);
  }, [me.data, seeded]);

  const save = useMutation({
    mutationFn: async (body: typeof form) => (await api.put('/users/me/profile', body)).data,
    onSuccess: () => {
      toast.success('Profil mis à jour.');
      qc.invalidateQueries({ queryKey: ['me'] });
      // The navbar and the sidebar both read the name from the store, so a save that did not
      // refresh it would leave the old name on screen beside the confirmation that it changed.
      void refreshUser();
    },
    onError: (e) => toastApiError(e),
  });

  if (me.isPending) {
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (me.isError) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        Impossible de charger votre profil.
      </p>
    );
  }

  const dirty =
    form.firstName !== (me.data.firstName ?? '') ||
    form.lastName !== (me.data.lastName ?? '') ||
    form.username !== (me.data.username ?? '') ||
    form.email !== (me.data.email ?? '');

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Mon profil</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Votre nom tel qu&apos;il apparaît dans l&apos;application, et les identifiants avec lesquels
        vous vous connectez.
      </p>

      <form
        className="space-y-4 rounded-xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) save.mutate(form);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="firstName"
            label="Prénom"
            value={form.firstName}
            onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
          />
          <Field
            id="lastName"
            label="Nom"
            value={form.lastName}
            onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
          />
        </div>

        <Field
          id="username"
          label="Nom d'utilisateur"
          value={form.username}
          onChange={(v) => setForm((f) => ({ ...f, username: v }))}
          hint="Vous pouvez vous connecter avec ce nom ou avec votre adresse e-mail."
        />

        <Field
          id="email"
          label="Adresse e-mail"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          {/* Nothing is written when nothing changed. A success toast for a save that saved
              nothing is a lie about what just happened (`GAME_AND_STANDINGS` §6.2). */}
          <Button type="submit" variant="primary" disabled={!dirty} isLoading={save.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}
