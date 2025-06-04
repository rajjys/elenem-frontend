// app/(app)/account/security/page.tsx
"use client";
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';

export default function SecurityPage() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Account Security</h1>
      
      <div className="max-w-md">
        <h2 className="text-xl font-medium text-gray-700 mb-4">Change Password</h2>
        <ChangePasswordForm />
      </div>

      {/* Placeholder for other security features like MFA */}
      {/* <div className="mt-10 border-t pt-6">
        <h2 className="text-xl font-medium text-gray-700 mb-4">Multi-Factor Authentication (MFA)</h2>
        <p className="text-sm text-gray-600 mb-3">
          Add an extra layer of security to your account.
        </p>
        <Button variant="secondary">Setup MFA (Coming Soon)</Button>
      </div> */}
    </div>
  );
}
