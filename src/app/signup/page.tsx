// src/app/signup/page.tsx
"use client";
import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/common/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


export default function SignUpPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Erro de Validação",
        description: "As senhas não correspondem.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!auth || !firestore) {
      toast({
        title: "Erro de Serviço",
        description: "Serviço de autenticação ou banco de dados não disponível.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a user profile document in Firestore
      const userProfile = {
        email: user.email,
        displayName: user.email, // Default display name
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, "users", user.uid), userProfile);
      
      // Send verification email
      await sendEmailVerification(user);

      toast({
        title: "Registro bem-sucedido!",
        description: "Um e-mail de verificação foi enviado para sua caixa de entrada.",
      });

      // Sign out the user until they verify their email
      await auth.signOut();
      
      router.push('/auth/verify-email');

    } catch (error: any) {
      console.error("Erro no registro:", error);
      let description = "Ocorreu um erro. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este e-mail já está em uso.";
      } else if (error.code === 'auth/weak-password') {
        description = "A senha deve ter no mínimo 6 caracteres.";
      }
      toast({
        title: "Falha no Registro",
        description,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg">
        <div className="text-center">
           <div className="flex justify-center mb-4">
            <Logo width={250} height={70} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Criar Nova Conta
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Preencha os campos para se registrar.
          </p>
        </div>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={isLoading}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" passHref>
            <span className="text-primary hover:underline cursor-pointer">
              Faça login
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
