
// src/components/layout/sidebar-nav.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';
import { LayoutDashboard, FilePlus, Database, FileEdit, Receipt, Settings } from 'lucide-react';
import Logo from '@/components/common/logo';

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    isActive: (pathname) => pathname.startsWith('/dashboard'),
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
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    isActive: (pathname) => pathname.startsWith('/configuracoes'),
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r text-sidebar-foreground shadow-lg md:flex",
      "bg-sidebar sidebar-bg-pattern" // Applied bg-sidebar for base white and sidebar-bg-pattern for the pattern
    )}>
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-6 bg-white dark:bg-white">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              item.isActive && item.isActive(pathname)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar'
            )}
          >
            <item.icon className={cn('mr-3 h-5 w-5 flex-shrink-0')} aria-hidden="true" />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-sidebar-border p-4">
        <p className="text-center text-xs text-sidebar-foreground/70">
          © {new Date().getFullYear()} ENGEAR
        </p>
      </div>
    </aside>
  );
}
