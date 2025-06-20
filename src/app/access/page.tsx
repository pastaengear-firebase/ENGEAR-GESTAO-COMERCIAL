// src/app/access/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Logo from '@/components/common/logo';
import { APP_ACCESS_GRANTED_KEY, DEFAULT_ACCESS_PASSWORD } from '@/lib/constants';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AccessPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEFAULT_ACCESS_PASSWORD) {
      sessionStorage.setItem(APP_ACCESS_GRANTED_KEY, 'true');
      toast({
        title: "Acesso Concedido",
        description: "Redirecionando para o painel...",
      });
      router.replace('/dashboard');
    } else {
      setError('Senha incorreta. Tente novamente.');
      toast({
        title: "Falha no Acesso",
        description: "Senha incorreta.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="items-center text-center space-y-3">
          <Logo className="mb-2" />
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center">
            <ShieldCheck className="mr-2 h-7 w-7 text-primary" /> Acesso Restrito
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Digite a senha para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha de Acesso</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Digite a senha"
                  required
                  className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-accent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ENGEAR. Todos os direitos reservados.</p>
        <p>Acesso exclusivo para equipe comercial.</p>
      </footer>
    </div>
  );
}
