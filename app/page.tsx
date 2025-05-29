import Link from 'next/link'
import React from 'react'

const Home = () => {
  return (
    <div>
      <header className='sticky top-0 left-0 right-0 z-50'>
        <Link href="/dashboard" className="text-2xl font-bold p-4">Admin Dashboard</Link>
      </header>
      <main>
        <section>
          
        </section>
      </main>
      
    </div>
  )
}

export default Home
