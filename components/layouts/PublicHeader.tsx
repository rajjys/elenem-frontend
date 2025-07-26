// components/layouts/PublicHeader.tsx
"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { FiSun, FiMoon, FiMenu, FiX, FiAward } from 'react-icons/fi';
import { usePathname } from 'next/navigation';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Matchs', href: '/games' },
  { label: 'Organisations', href: '/tenants' },
  { label: 'Actualites', href: '/news' },
  { Label: 'Classements', href: '/standings' },
  { label: 'Plus', href: '#'}
];

export const PublicHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="rounded-lg bg-indigo-600 p-2 text-white">
                <FiAward className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">ELENEM</span>
            </Link>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    pathname === link.href ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center space-x-4">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
                Login
                </Link>
                <Link href="/register" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
                Get Started
                </Link>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-300"
              >
                {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-200 px-2 pt-4 pb-3 dark:border-gray-800 space-y-3">
            <Link href="/login" className="block w-full text-center rounded-md px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
              Login
            </Link>
            <Link href="/register" className="block w-full text-center rounded-md bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};