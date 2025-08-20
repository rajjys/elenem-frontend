// components/access/AccessGate.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Roles } from '@/schemas'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/ui'

interface AccessGateProps {
  allowedRoles: Roles[]
  children: React.ReactNode
}

export const AccessGate: React.FC<AccessGateProps> = ({ allowedRoles, children }) => {
  const router = useRouter()
  const userAuth = useAuthStore((state) => state.user);
  const currentUserRoles = userAuth?.roles || []; // Assuming `roles` is an array on user object
  
  // Wait for user to be loaded (null means loading, not unauthorized)
  if (userAuth === null) {
    return <LoadingSpinner message='Loading User Informations'/> // Show a loading spinner while auth state is being determined
  }

  const hasAccess = allowedRoles.some(role => currentUserRoles.includes(role))

  if (!hasAccess) {
    console.log("Access Denied Here");
    router.replace('/unauthorized') // Or use modal / inline fallback
    return null
  }
  return <>{children}</>
}
