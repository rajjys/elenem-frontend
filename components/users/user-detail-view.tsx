'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, MailCheck } from 'lucide-react';
import { Button, LoadingSpinner, Modal, ConfirmDialog } from '@/components/ui';
import { UserSummary } from './user-summary';
import { UserForm } from '@/components/forms/user-form';
import { useUser, useDeleteUser, useSetUserEmailVerified, userKeys } from '@/services/users';
import { useIsSystemAdmin } from '@/hooks';
import { toastApiError } from '@/utils';

// Reusable read-first user detail. Same component for every scope
// (admin/tenant/league/team) — only backHref differs. View is the hub; edit is
// a tabbed modal; verify/delete confirm first.
export function UserDetailView({ userId, backHref }: { userId: string; backHref: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user, isLoading, isError } = useUser(userId);
  const del = useDeleteUser();
  const verify = useSetUserEmailVerified();
  const isSystemAdmin = useIsSystemAdmin();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmVerify, setConfirmVerify] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Retour aux utilisateurs
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : isError || !user ? (
        <p className="text-red-500">Utilisateur introuvable.</p>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow-md">
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
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} className="mr-1" /> Supprimer
              </Button>
            </div>
          </div>
          <UserSummary user={user} />
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
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer cet utilisateur ?"
        description="Cette action est irréversible."
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
