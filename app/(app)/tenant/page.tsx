'use client'
import { useContextualLink } from '@/hooks';
import  Link from 'next/link';
import React from 'react'

const TenantPage = () => {
const  { buildLink } = useContextualLink();
  //router.redirect('/dashboard');
  return (
    <div>
      <Link href={buildLink('/tenant/dashboard')} className='font-bold text-emerald-600 hover:text-emerald-500 px-1'>
        Click Here
      </Link> to Redirect to Dashboard
    </div>
  )
}

export default TenantPage
