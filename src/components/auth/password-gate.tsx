// src/components/auth/password-gate.tsx
'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/common/logo';
import { KeyRound, ShieldAlert } from 'lucide-react';

const PASSWORD = '1313';
const SESSION_STORAGE_KEY = 'app_authenticated';

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const sessionAuth = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Session storage is not available.', e);
    }
  }, []);

  const handleLogin = () => {
    if (password === PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch (e) {
        // sessionStorage is not available
      }
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Senha incorreta.');
      setPassword('');
    }
  };

  if (!isMounted) {
    return null; // Render nothing on the server to avoid hydration mismatch
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="items-center text-center space-y-4">
          <Logo width={200} height={60} />
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          <CardDescription>Por favor, insira a senha para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
          <Button onClick={handleLogin} className="w-full">
            <KeyRound className="mr-2" />
            Entrar
          </Button>
          <div className="flex items-start space-x-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
             <ShieldAlert className="mt-1 h-4 w-4 flex-shrink-0" />
             <p className="text-xs">
                Este sistema de senha única não oferece segurança de nível de usuário. Não armazene informações sensíveis.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
