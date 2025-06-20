// src/app/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona diretamente para a página de acesso
    router.replace('/access');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Carregando aplicação...</p>
    </div>
  );
}
