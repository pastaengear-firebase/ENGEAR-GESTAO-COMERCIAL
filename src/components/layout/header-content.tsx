// src/components/layout/header-content.tsx
"use client";
import { useAuth, useUser } from '@/firebase';
import SellerSelector from '@/components/common/seller-selector';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Moon, Sun, Menu, LogOut } from 'lucide-react'; // Alterado para User
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { APP_ACCESS_GRANTED_KEY } from '@/lib/constants';

interface HeaderContentProps {
  toggleMobileMenu: () => void;
}

export default function HeaderContent({ toggleMobileMenu }: HeaderContentProps) {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    if (!auth) {
      toast({ title: "Erro", description: "Serviço de autenticação não disponível.", variant: "destructive" });
      return;
    }
    try {
      // Important: Remove the session key first.
      sessionStorage.removeItem(APP_ACCESS_GRANTED_KEY);
      
      await signOut(auth);
      toast({ title: "Sucesso", description: "Você foi desconectado com segurança." });

      // Force a hard reload to the login page to clear all state.
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível desconectar. Tente novamente.", variant: "destructive" });
    }
  };

  const displayName = "Usuário Anônimo";
  const displayId = user?.uid;

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white dark:bg-white">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="mr-2 md:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <div className="hidden md:block">
            <SellerSelector />
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

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Avatar className="h-9 w-9">
                     <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-5 w-5" />
                     </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate" title={displayId}>
                      ID: {displayId}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="md:hidden border-t p-2 flex justify-center bg-white dark:bg-white">
         <SellerSelector />
      </div>
    </header>
  );
}
