// src/app/(auth)/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useSales } from '@/hooks/use-sales';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, KeyRound, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
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
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp!);
  const { user, loadingAuth } = useSales();

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(LoginSchema) });
  const registerForm = useForm<RegisterFormData>({ resolver: zodResolver(RegisterSchema) });

  // Handle redirect result from Google sign-in
  useEffect(() => {
    if (auth) {
      setIsProcessing(true);
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            router.push('/dashboard');
          } else {
             setIsProcessing(false);
          }
        })
        .catch((error) => {
          console.error("Redirect Result Error:", error);
          setError(error.message);
          setIsProcessing(false);
        });
    }
  }, [auth, router]);
  
  // If user is already logged in, redirect
  useEffect(() => {
    if (!loadingAuth && user) {
      router.push('/dashboard');
    }
  }, [user, loadingAuth, router]);
  
  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    setIsProcessing(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'E-mail ou senha inválidos.' : err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRegister = async (data: RegisterFormData) => {
    setError(null);
    setIsProcessing(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
       setError(err.code === 'auth/email-already-in-use' ? 'Este e-mail já está em uso.' : err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };
  
  if (loadingAuth || isProcessing || user) {
     return (
        <div className="flex flex-col items-center justify-center text-center p-10">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
     )
  }

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Entrar</TabsTrigger>
        <TabsTrigger value="register">Registrar</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Acesse sua conta para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email"><Mail className="inline-block mr-2 h-4 w-4" />Email</Label>
                <Input id="login-email" type="email" placeholder="seu@email.com" {...loginForm.register("email")} />
                {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password"><KeyRound className="inline-block mr-2 h-4 w-4" />Senha</Label>
                <Input id="login-password" type="password" {...loginForm.register("password")} />
                 {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing}><LogIn className="mr-2"/>Entrar</Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou continue com</span></div>
            </div>
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isProcessing}><FcGoogle className="mr-2 text-lg"/>Google</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="register">
        <Card>
          <CardHeader>
            <CardTitle>Registrar</CardTitle>
            <CardDescription>Crie uma nova conta de vendedor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email"><Mail className="inline-block mr-2 h-4 w-4" />Email</Label>
                <Input id="register-email" type="email" placeholder="seu@email.com" {...registerForm.register("email")} />
                {registerForm.formState.errors.email && <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password"><KeyRound className="inline-block mr-2 h-4 w-4" />Senha</Label>
                <Input id="register-password" type="password" {...registerForm.register("password")} />
                {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing}><UserPlus className="mr-2"/>Registrar Nova Conta</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
