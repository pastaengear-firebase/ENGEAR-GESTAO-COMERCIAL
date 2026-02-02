
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { useAuth } from '../../../firebase/provider';
import { useSales } from '../../../hooks/use-sales';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

const LoginSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});
type LoginFormData = z.infer<typeof LoginSchema>;

const RegisterSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres." }),
});
type RegisterFormData = z.infer<typeof RegisterSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loadingAuth } = useSales();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMounted = useRef(false);
  const isRedirecting = useRef(false);
  
  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(LoginSchema) });
  const registerForm = useForm<RegisterFormData>({ resolver: zodResolver(RegisterSchema) });

  useEffect(() => {
    isMounted.current = true;
    if (auth && !user) {
      getRedirectResult(auth).then((result) => {
        if (result && isMounted.current && !isRedirecting.current) {
          isRedirecting.current = true;
          router.replace('/dashboard');
        }
      }).catch((e) => setError(e.message));
    }
    return () => { isMounted.current = false; };
  }, [auth, user, router]);
  
  useEffect(() => {
    if (!loadingAuth && user && isMounted.current && !isRedirecting.current) {
      isRedirecting.current = true;
      router.replace('/dashboard');
    }
  }, [user, loadingAuth, router]);
  
  const handleLogin = async (data: LoginFormData) => {
    if (!auth) return;
    setError(null);
    setIsProcessing(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'E-mail ou senha inválidos.' : 'Erro ao entrar.');
      setIsProcessing(false);
    }
  };
  
  const handleRegister = async (data: RegisterFormData) => {
    if (!auth) return;
    setError(null);
    setIsProcessing(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
    } catch (err: any) {
       setError(err.code === 'auth/email-already-in-use' ? 'E-mail em uso.' : 'Erro ao registrar.');
       setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };
  
  if (loadingAuth || user) {
     return (
        <div className="flex flex-col items-center justify-center h-screen w-screen">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Autenticando...</p>
        </div>
     );
  }

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Entrar</TabsTrigger>
        <TabsTrigger value="register">Registrar</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader><CardTitle>Acesso ao Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" {...loginForm.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" type="password" {...loginForm.register("password")} />
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing}>{isProcessing ? 'Entrando...' : 'Entrar'}</Button>
            </form>
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isProcessing}><FcGoogle className="mr-2 text-lg"/>Google</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="register">
        <Card>
          <CardHeader><CardTitle>Novo Registro</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input id="register-email" type="email" {...registerForm.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input id="register-password" type="password" {...registerForm.register("password")} />
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing}>Registrar</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
