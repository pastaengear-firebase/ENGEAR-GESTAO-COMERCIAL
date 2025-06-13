
// src/app/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth(); // AuthContext agora deve retornar isAuthenticated: true, loading: false

  useEffect(() => {
    // console.log(`HomePage (Login Disabled): AuthContext state - loading=${loading}, isAuthenticated=${isAuthenticated}`);
    if (!loading) {
      if (isAuthenticated) { // Deve ser sempre true com o login desabilitado
        // console.log("HomePage (Login Disabled): Authenticated (as per disabled login). Redirecting to /dashboard.");
        router.replace('/dashboard');
      } else {
        // Este caso não deve ocorrer com o login desabilitado no AuthContext
        // console.warn("HomePage (Login Disabled): Not authenticated (UNEXPECTED with disabled login). Redirecting to /login (which should redirect to dashboard).");
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Carregando aplicação...</p>
    </div>
  );
}
