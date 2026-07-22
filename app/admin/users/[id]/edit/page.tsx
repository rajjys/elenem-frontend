'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '@/components/forms/user-form';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Link href={`/admin/users/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Retour au profil
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Modifier l&apos;utilisateur</h1>
      <UserForm userId={id} isEditMode onSuccess={() => router.push(`/admin/users/${id}`)} onCancel={() => router.push(`/admin/users/${id}`)} />
    </div>
  );
}
