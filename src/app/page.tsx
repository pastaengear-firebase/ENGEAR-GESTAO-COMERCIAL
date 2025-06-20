
// src/app/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// useAuth não é mais necessário aqui para lógica de redirecionamento baseada em auth
// import { useAuth } from '@/hooks/use-auth'; 

export default function HomePage() {
  const router = useRouter();
  // const { isAuthenticated, loading } = useAuth(); // Removido

  useEffect(() => {
    // Redireciona diretamente para o dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Carregando aplicação...</p>
    </div>
  );
}
