// components/layout/AppLayoutNavbar.tsx
'use client'

import { Bell, User, LogOut, UserCircle, Settings, Menu } from 'lucide-react' // Import Menu icon
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/'
import Link from 'next/link'

interface AppLayoutNavbarProps {
  dashboardLink: string;
  onMobileMenuToggle: () => void; // New prop for toggling mobile menu
  handleLogout: () => void;
}

export function AppLayoutNavbar({ dashboardLink, onMobileMenuToggle, handleLogout }: AppLayoutNavbarProps) {
  
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle button - visible only on small screens */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuToggle}
          className="md:hidden" // Hide on medium and larger screens
        >
          <Menu className="h-6 w-6" />
        </Button>

        <Link href={dashboardLink} className="flex items-center gap-2 font-semibold text-gray-700 hover:text-primary-600 transition-colors">
          <div className="bg-primary-600 p-2 rounded text-white">
            <UserCircle className="h-5 w-5" />
          </div>
          <span className="text-sm">Dashboard</span>
        </Link>

        <div className="relative hidden md:block"> {/* Search bar hidden on mobile */}
          <Input
            placeholder="Search teams, players, games..."
            type='search'
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>None yet</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}