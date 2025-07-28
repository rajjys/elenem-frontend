import React from 'react'

type PublicTenantPageProps = {
  params: {
    tenantSlug: string;
  }
}
const PublicTenantPage = async({ params } : PublicTenantPageProps) => {
  const { tenantSlug } = params;
  return (
    <div>
      Hello World
      {tenantSlug}
    </div>
  )
}

export default PublicTenantPage
