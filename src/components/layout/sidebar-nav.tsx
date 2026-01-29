// src/components/layout/sidebar-nav.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';
import { LayoutDashboard, FilePlus, Database, FileEdit, Receipt, Settings, FileText, X, BrainCircuit } from 'lucide-react';
import Logo from '@/components/common/logo';
import { Button } from '@/components/ui/button';

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    isActive: (pathname) => pathname.startsWith('/dashboard'),
  },
  {
    title: 'Busca IA',
    href: '/busca-ia',
    icon: BrainCircuit,
    isActive: (pathname) => pathname.startsWith('/busca-ia'),
  },
  {
    title: 'Inserir Venda',
    href: '/inserir-venda',
    icon: FilePlus,
    isActive: (pathname) => pathname.startsWith('/inserir-venda'),
  },
  {
    title: 'Dados',
    href: '/dados',
    icon: Database,
    isActive: (pathname) => pathname.startsWith('/dados'),
  },
  {
    title: 'Editar Venda',
    href: '/editar-venda',
    icon: FileEdit,
    isActive: (pathname) => pathname.startsWith('/editar-venda'),
  },
  {
    title: 'Faturamento',
    href: '/faturamento',
    icon: Receipt,
    isActive: (pathname) => pathname.startsWith('/faturamento'),
  },
  {
    title: 'Propostas',
    href: '/propostas/gerenciar',
    icon: FileText,
    isActive: (pathname) => pathname.startsWith('/propostas'),
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    isActive: (pathname) => pathname.startsWith('/configuracoes'),
  },
];

interface SidebarNavProps {
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

export default function SidebarNav({ isMobileMenuOpen, closeMobileMenu }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      <div
        onClick={closeMobileMenu}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 md:hidden",
          isMobileMenuOpen ? "block" : "hidden"
        )}
      />

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-36 flex-col border-r text-sidebar-foreground shadow-lg",
        "bg-sidebar",
        "transition-transform duration-300 ease-in-out md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="relative flex h-auto items-center justify-center border-b border-sidebar-border bg-white dark:bg-white px-2 py-3">
          <Logo className="w-full" />
          <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <X className="h-6 w-6" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu} // Close menu on link click for mobile
              className={cn(
                'group flex items-center rounded-md px-2 py-2 text-xs font-medium transition-colors',
                item.isActive && item.isActive(pathname)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar'
              )}
            >
              <item.icon className={cn('mr-2 h-4 w-4 flex-shrink-0')} aria-hidden="true" />
              <span className="truncate">{item.title}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <p className="text-center text-xs text-sidebar-foreground/70">
            © {new Date().getFullYear()} ENGEAR
          </p>
        </div>
      </aside>
    </>
  );
}
