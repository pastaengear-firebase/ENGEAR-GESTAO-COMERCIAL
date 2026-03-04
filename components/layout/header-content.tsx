
// src/components/layout/header-content.tsx
"use client";
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, User as UserIcon, LogOut, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useSales } from '@/hooks/use-sales'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_SELLERS_OPTION, SELLERS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';

interface HeaderContentProps {
  toggleMobileMenu: () => void;
}

export default function HeaderContent({ toggleMobileMenu }: HeaderContentProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout, viewingAsSeller, setViewingAsSeller, userRole } = useSales();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const sellerOptions = [ALL_SELLERS_OPTION, ...SELLERS];

  return (
    <header className="sticky top-0 z-30 flex w-full flex-col border-b bg-accent">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="mr-2 md:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
           {user && (
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-sidebar-foreground mr-4">
              <UserIcon className="h-5 w-5" />
              <span>{user.email}</span>
            </div>
           )}

            <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-sidebar-foreground" />
                <Select
                    value={viewingAsSeller}
                    onValueChange={(value) => setViewingAsSeller(value as UserRole)}
                >
                    <SelectTrigger className="w-[180px] bg-sidebar text-sidebar-foreground border-sidebar-border focus:ring-sidebar-ring">
                        <SelectValue placeholder="Ver como..." />
                    </SelectTrigger>
                    <SelectContent>
                        {sellerOptions.map((seller) => (
                            <SelectItem key={seller} value={seller}>
                                {seller}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>


          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label="Toggle theme"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={logout} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sair</span>
          </Button>
        </div>
      </div>
       {user && (
        <div className="md:hidden border-t p-2 flex justify-center bg-accent text-sm font-medium text-sidebar-foreground">
            <UserIcon className="h-5 w-5 mr-2" />
            <span>{user.email}</span>
        </div>
       )}
    </header>
  );
}
