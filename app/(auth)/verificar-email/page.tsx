'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, reload } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { useSales } from '@/hooks/use-sales';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerificarEmailPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loadingAuth, logout } = useSales();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.replace('/login');
      } else if (user.emailVerified) {
        router.replace('/dashboard');
      }
    }
  }, [user, loadingAuth, router]);

  const handleResendEmail = async () => {
    if (!auth?.currentUser) return;
    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada." });
    } catch (error: any) {
      toast({ title: "Erro", description: "Aguarde um momento antes de reenviar.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!auth?.currentUser) return;
    setIsChecking(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        toast({ title: "Sucesso", description: "E-mail verificado com sucesso!" });
        window.location.reload(); // Hard refresh to update SalesContext
      } else {
        toast({ title: "Ainda não", description: "O e-mail ainda não consta como verificado.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  if (loadingAuth || !user || user.emailVerified) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Verifique seu E-mail</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para <strong>{user.email}</strong>.
            Você precisa verificar seu e-mail para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800 text-xs">
              Se você acabou de clicar no link no seu e-mail, clique no botão "Já verifiquei" abaixo.
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={handleCheckStatus} disabled={isChecking}>
            {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Já verifiquei
          </Button>
          <Button variant="outline" className="w-full" onClick={handleResendEmail} disabled={isResending}>
            {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Reenviar e-mail de verificação
          </Button>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={logout}>
            Sair e entrar com outra conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
