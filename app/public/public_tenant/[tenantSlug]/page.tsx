import React from 'react'

const PublicTenantPage = async({ params } : { params: { tenantSlug: string } }) => {
  const { tenantSlug } = params;
  return (
    <div>
      Hello World
      {tenantSlug}
    </div>
  )
}

export default PublicTenantPage
