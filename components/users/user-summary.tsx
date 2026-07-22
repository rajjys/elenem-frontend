'use client';

import * as React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { UserResponse } from '@/services/users';

function fmt(d?: unknown): string {
  if (!d || typeof d === 'object') return '—';
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

function StatusPill({ ok, okLabel, koLabel }: { ok?: boolean; okLabel: string; koLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {ok ? okLabel : koLabel}
    </span>
  );
}

// Read-only summary of a user. The reusable detail hub; edit is an action the
// host page provides. Works for any scope (admin/tenant/league/team) — the
// backend already scopes what a viewer is allowed to fetch.
export function UserSummary({ user }: { user: UserResponse }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
          {(user.firstName?.[0] || user.username[0] || '?').toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
          <p className="text-sm text-gray-500">@{user.username} · {user.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(user.roles ?? []).map((r) => (
          <span key={r} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            {r}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <StatusPill ok={user.isActive} okLabel="Actif" koLabel="Inactif" />
        <StatusPill ok={user.isEmailVerified} okLabel="Email vérifié" koLabel="Email non vérifié" />
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <Row label="Organisation" value={user.tenant?.name} />
        <Row label="Ligue gérée" value={user.managingLeague?.name} />
        <Row label="Équipe gérée" value={user.managingTeam?.name} />
        <Row label="Créé le" value={fmt(user.createdAt)} />
        <Row label="Dernière connexion" value={fmt(user.lastLoginAt)} />
      </div>
    </div>
  );
}
