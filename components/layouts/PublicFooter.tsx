// components/layouts/PublicFooter.tsx
import Link from 'next/link';
import { FiAward } from 'react-icons/fi';
import React from 'react';

export const PublicFooter = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Product Links */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Product</h3>
                        <ul className="mt-4 space-y-4">
                            <li><Link href="/features" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Features</Link></li>
                            <li><Link href="/pricing" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Pricing</Link></li>
                            <li><Link href="/explore" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Explore Leagues</Link></li>
                        </ul>
                    </div>
                    {/* Company Links */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Company</h3>
                        <ul className="mt-4 space-y-4">
                            <li><Link href="/about" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">About</Link></li>
                            <li><Link href="/blog" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Blog</Link></li>
                            <li><Link href="/contact" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Contact</Link></li>
                        </ul>
                    </div>
                    {/* Resources Links */}
                     <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resources</h3>
                        <ul className="mt-4 space-y-4">
                            <li><Link href="/help" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Help Center</Link></li>
                            <li>{/* Add other resources like API docs if public */}</li>
                        </ul>
                    </div>
                    {/* Legal Links */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Legal</h3>
                        <ul className="mt-4 space-y-4">
                            <li><Link href="/privacy" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Privacy</Link></li>
                            <li><Link href="/terms" className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
                    <div className="flex flex-col items-center justify-between sm:flex-row">
                        <div className="flex items-center space-x-2">
                             <div className="rounded-lg bg-indigo-600 p-2 text-white"><FiAward className="h-6 w-6" /></div>
                            <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">ELENEM</span>
                        </div>
                        <p className="mt-4 text-base text-gray-500 dark:text-gray-400 sm:mt-0">
                            &copy; {currentYear} ELENEM. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};