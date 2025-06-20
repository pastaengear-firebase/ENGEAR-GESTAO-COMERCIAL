"use client";
import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { APP_ACCESS_GRANTED_KEY } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

export default function AccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Este efeito roda apenas no cliente
    const accessGranted = sessionStorage.getItem(APP_ACCESS_GRANTED_KEY);

    if (accessGranted === 'true') {
      setIsVerifying(false); // Acesso permitido, parar de verificar
    } else {
      // Se não tem acesso E não está na página de acesso, redireciona
      if (pathname !== '/access') {
        router.replace('/access');
        // Mantém isVerifying como true aqui. O loader será mostrado
        // até que o redirecionamento para /access seja concluído.
        // A página /access não será bloqueada por esta instância do guard.
      } else {
        // Se já está na página /access e não tem acesso, permite a renderização da página /access
        setIsVerifying(false);
      }
    }
  }, [pathname, router]);

  if (isVerifying) {
    // Mostra o loader enquanto isVerifying é true.
    // Se o pathname for '/access', o useEffect acima rapidamente setará isVerifying para false.
    // Se o pathname for uma rota protegida sem acesso, o router.replace() foi chamado,
    // e este loader será exibido até a navegação para /access ocorrer.
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Verificando acesso...</p>
      </div>
    );
  }

  // Se isVerifying é false, significa que:
  // 1. O acesso foi concedido (sessionStorage tinha a chave)
  // 2. Ou estamos na página '/access' e ela deve ser renderizada.
  return <>{children}</>;
}
