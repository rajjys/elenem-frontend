import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PublicTenantPage = async({ params } : any) => {
  const { tenantSlug } = params;
  return (
    <div>
      Hello World
      {tenantSlug}
    </div>
  )
}

export default PublicTenantPage
