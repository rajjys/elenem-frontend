'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, MailCheck, UserX } from 'lucide-react';
import { Button, LoadingSpinner, Modal, ConfirmDialog } from '@/components/ui';
import { UserSummary } from './user-summary';
import { UserSignInAccess, useCanManageAccess } from './user-sign-in-access';
import { UserActivity } from '@/components/journal/user-activity';
import { UserForm } from '@/components/forms/user-form';
import {
  useUser,
  useDeleteUser,
  useSetUserActive,
  useSetUserEmailVerified,
  userKeys,
} from '@/services/users';
import { useCurrentUser, useIsSystemAdmin } from '@/hooks';
import { toastApiError } from '@/utils';

// Reusable read-first user detail. Same component for every scope
// (admin/tenant/league/team) — only backHref differs. View is the hub; edit is
// a tabbed modal; verify/deactivate/delete confirm first.
export function UserDetailView({
  userId,
  backHref,
  journalHref,
}: {
  userId: string;
  backHref: string;
  /**
   * Where this surface's journal lives. Given only where the viewer may read it (system and
   * organisation administrators); without it the record has no « Activité ».
   */
  journalHref?: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useCurrentUser();
  const { data: user, isLoading, isError } = useUser(userId);
  const del = useDeleteUser();
  const verify = useSetUserEmailVerified();
  const setActive = useSetUserActive();
  const isSystemAdmin = useIsSystemAdmin();
  const canManageAccess = useCanManageAccess({ tenantId: user?.tenantId ?? null });

  const [editOpen, setEditOpen] = useState(false);
  const [confirmVerify, setConfirmVerify] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : '';
  // Never yourself: the API refuses it, and the button would lock the reader out of the screen
  // they are looking at.
  const canDeactivate = !!user && user.isActive && canManageAccess && user.id !== me?.id;

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Retour aux utilisateurs
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : isError || !user ? (
        <p className="text-negative">Utilisateur introuvable.</p>
      ) : (
        <div className="rounded-lg bg-surface p-6 shadow-md">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">Profil</h1>
            <div className="flex flex-wrap gap-2">
              {isSystemAdmin && !user.isEmailVerified && (
                <Button variant="secondary" onClick={() => setConfirmVerify(true)}>
                  <MailCheck size={16} className="mr-1" /> Vérifier l&apos;email
                </Button>
              )}
              <Button variant="primary" onClick={() => setEditOpen(true)}>
                <Pencil size={16} className="mr-1" /> Modifier
              </Button>
              {canDeactivate && (
                <Button variant="outline" onClick={() => setConfirmDeactivate(true)}>
                  <UserX size={16} className="mr-1" /> Désactiver
                </Button>
              )}
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} className="mr-1" /> Supprimer
              </Button>
            </div>
          </div>
          <UserSummary user={user} />
          <div className="mt-6">
            <UserSignInAccess user={user} />
          </div>
          {journalHref && (
            <div className="mt-8">
              <UserActivity userId={user.id} journalHref={journalHref} />
            </div>
          )}
        </div>
      )}

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Modifier l'utilisateur">
        <UserForm
          userId={userId}
          isEditMode
          onSuccess={() => {
            setEditOpen(false);
            qc.invalidateQueries({ queryKey: userKeys.detail(userId) });
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmVerify}
        onOpenChange={setConfirmVerify}
        title="Marquer l'email comme vérifié ?"
        description="L'utilisateur pourra créer une organisation sans confirmer son email lui-même."
        confirmLabel="Vérifier"
        onConfirm={() =>
          verify.mutate(
            { id: userId, value: true },
            { onSuccess: () => toast.success('Email marqué comme vérifié.'), onError: (e) => toastApiError(e) },
          )
        }
      />

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Désactiver ce compte ?"
        description={`${name} ne pourra plus se connecter, et ses sessions ouvertes prennent fin. Rien n’est supprimé : vous pourrez réactiver le compte à tout moment depuis cette fiche.`}
        confirmLabel="Désactiver"
        onConfirm={() =>
          setActive.mutate(
            { id: userId, isActive: false },
            { onSuccess: () => toast.success('Compte désactivé.'), onError: (e) => toastApiError(e) },
          )
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer cet utilisateur ?"
        description={
          canDeactivate
            ? 'Cette action est irréversible. Pour couper l’accès sans rien supprimer, désactivez plutôt le compte.'
            : 'Cette action est irréversible.'
        }
        confirmLabel="Supprimer"
        onConfirm={() =>
          del.mutate(userId, {
            onSuccess: () => {
              toast.success('Utilisateur supprimé.');
              router.push(backHref);
            },
            onError: (e) => toastApiError(e),
          })
        }
      />
    </div>
  );
}
