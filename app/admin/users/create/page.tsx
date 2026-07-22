'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '@/components/forms/user-form';

export default function CreateUserPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Retour aux utilisateurs
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Créer un utilisateur</h1>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <UserForm onSuccess={() => router.push('/admin/users')} onCancel={() => router.push('/admin/users')} />
      </div>
    </div>
  );
}
