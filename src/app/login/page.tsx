
// src/app/login/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Com o login desabilitado, esta página não deveria ser acessível.
    // O middleware deve redirecionar para /dashboard.
    // Se, por algum motivo, chegar aqui, tenta redirecionar.
    console.log("LoginPage (Login Disabled): Attempting to redirect to /dashboard.");
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-secondary">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">Login desabilitado. Redirecionando para o painel...</p>
    </div>
  );
}
