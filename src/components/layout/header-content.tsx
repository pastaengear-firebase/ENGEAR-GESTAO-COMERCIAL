// src/components/layout/header-content.tsx
"use client";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Moon, Sun, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSales } from '@/hooks/use-sales'; // To display current seller

interface HeaderContentProps {
  toggleMobileMenu: () => void;
}

export default function HeaderContent({ toggleMobileMenu }: HeaderContentProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { selectedSeller } = useSales();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-accent/30">
      <div className="container flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="mr-2 md:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-sidebar-foreground mr-4">
             <UserIcon className="h-5 w-5" />
             <span>{selectedSeller}</span>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Avatar do usuário'} />
                  <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : <UserIcon />}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
      <div className="md:hidden border-t p-1 flex justify-center bg-accent/30 text-sm font-medium text-sidebar-foreground">
         <UserIcon className="h-5 w-5 mr-2" />
         <span>{selectedSeller}</span>
      </div>
    </header>
  );
}
