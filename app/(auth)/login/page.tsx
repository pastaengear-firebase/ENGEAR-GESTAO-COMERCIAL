'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { useSales } from '@/hooks/use-sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/constants';

const LoginSchema = z.object({
  email: z.string().email({ message: "Insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});
type LoginFormData = z.infer<typeof LoginSchema>;

const RegisterSchema = z.object({
  email: z
    .string()
    .email({ message: "Insira um e-mail válido." })
    .refine(
      (email) => {
        const lower = email.toLowerCase().trim();
        return lower.endsWith(ALLOWED_EMAIL_DOMAIN) || lower === 'pastaengear@gmail.com';
      },
      {
        message: `Apenas e-mails institucionais (${ALLOWED_EMAIL_DOMAIN}) são permitidos.`,
      }
    ),
  password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres." }),
});
type RegisterFormData = z.infer<typeof RegisterSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loadingAuth } = useSales();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);

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
    setSuccess(null);
    setIsProcessing(true);
    try {
      await signInWithEmailAndPassword(auth, data.email.trim(), data.password);
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'E-mail ou senha inválidos.' : 'Erro ao entrar.');
      setIsProcessing(false);
    }
  };
  
  const handleRegister = async (data: RegisterFormData) => {
    if (!auth) return;
    setError(null);
    setSuccess(null);
    setIsProcessing(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      // O Firebase já autentica o usuário imediatamente após a criação
    } catch (err: any) {
       setError(err.code === 'auth/email-already-in-use' ? 'Este e-mail já possui cadastro. Use a aba "Entrar".' : 'Erro ao registrar acesso.');
       setIsProcessing(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !forgotPasswordEmail) return;
    setForgotPasswordError(null);
    setForgotPasswordSuccess(null);
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail.trim());
      setForgotPasswordSuccess(`Enviamos um link de redefinição de senha para ${forgotPasswordEmail}. Verifique sua caixa de entrada.`);
    } catch (err: any) {
      setForgotPasswordError(err.code === 'auth/user-not-found' ? 'E-mail não encontrado.' : 'Erro ao enviar e-mail de recuperação.');
    } finally {
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
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="register">Criar Acesso (Leitor)</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Acesso ao Sistema</CardTitle>
              <CardDescription>Entre com suas credenciais para acessar o painel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotPasswordSuccess && (
                    <Alert className="border-green-500 text-green-700 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>{forgotPasswordSuccess}</AlertDescription>
                    </Alert>
                  )}
                  {forgotPasswordError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{forgotPasswordError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">E-mail Cadastrado</Label>
                    <Input 
                      id="forgot-email" 
                      type="email" 
                      placeholder="seu.nome@engearpb.com.br"
                      value={forgotPasswordEmail} 
                      onChange={(e) => setForgotPasswordEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? 'Enviando...' : 'Enviar Link de Redefinição'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => { setShowForgotPassword(false); setForgotPasswordSuccess(null); setForgotPasswordError(null); }}
                  >
                    Voltar ao Login
                  </Button>
                </form>
              ) : (
                <>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input 
                        id="login-email" 
                        type="email" 
                        placeholder="seu.email@engearpb.com.br" 
                        {...loginForm.register("email")} 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Senha</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <Input id="login-password" type="password" {...loginForm.register("password")} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isProcessing}>
                      {isProcessing ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou continue com</span></div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isProcessing}>
                    <FcGoogle className="mr-2 text-lg"/> Entrar com Google
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Criar Acesso de Leitor
              </CardTitle>
              <CardDescription>
                Acesso direto de visualização para colaboradores (@engearpb.com.br). Sem burocracia: informe seu e-mail e crie uma senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {registerForm.formState.errors.email && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{registerForm.formState.errors.email.message}</AlertDescription>
                </Alert>
              )}
              {registerForm.formState.errors.password && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{registerForm.formState.errors.password.message}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email Corporativo</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="seu.nome@engearpb.com.br" 
                    {...registerForm.register("email")} 
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Requer e-mail com final @engearpb.com.br.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Defina sua Senha</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="Mínimo de 6 caracteres" 
                    {...registerForm.register("password")} 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? 'Criando Acesso...' : 'Criar Acesso e Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}