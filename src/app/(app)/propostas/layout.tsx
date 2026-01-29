// src/app/(app)/propostas/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, PlusCircle, BellRing } from 'lucide-react';

const navLinks = [
  { href: '/propostas/gerenciar', label: 'Gerenciar', icon: FileText },
  { href: '/propostas/nova', label: 'Nova Proposta', icon: PlusCircle },
  { href: '/propostas/acompanhamento', label: 'Acompanhamento', icon: BellRing },
];

export default function PropostasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'group inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium',
                pathname === link.href
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
              )}
            >
              <link.icon className="h-4 w-4"/>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div>{children}</div>
    </div>
  );
}
