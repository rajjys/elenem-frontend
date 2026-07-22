'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, MailCheck } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { UserSummary } from '@/components/users/user-summary';
import { useUser, useDeleteUser, useSetUserEmailVerified } from '@/services/users';
import { useIsSystemAdmin } from '@/hooks';
import { toastApiError } from '@/utils';

// Read-first detail hub. Edit is an action (-> /[id]/edit), not the page itself.
export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: user, isLoading, isError } = useUser(id);
  const del = useDeleteUser();
  const verify = useSetUserEmailVerified();
  const isSystemAdmin = useIsSystemAdmin();

  const onDelete = () => {
    if (!window.confirm('Supprimer cet utilisateur ? Cette action est irréversible.')) return;
    del.mutate(id, {
      onSuccess: () => {
        toast.success('Utilisateur supprimé.');
        router.push('/admin/users');
      },
      onError: (e) => toastApiError(e),
    });
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
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
                <Button
                  variant="secondary"
                  onClick={() =>
                    verify.mutate(
                      { id, value: true },
                      { onSuccess: () => toast.success('Email marqué comme vérifié.'), onError: (e) => toastApiError(e) },
                    )
                  }
                >
                  <MailCheck size={16} className="mr-1" /> Vérifier l&apos;email
                </Button>
              )}
              <Link href={`/admin/users/${id}/edit`}>
                <Button variant="primary"><Pencil size={16} className="mr-1" /> Modifier</Button>
              </Link>
              <Button variant="danger" onClick={onDelete}>
                <Trash2 size={16} className="mr-1" /> Supprimer
              </Button>
            </div>
          </div>
          <UserSummary user={user} />
        </div>
      )}
    </div>
  );
}
