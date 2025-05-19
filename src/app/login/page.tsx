// src/app/login/page.tsx
import LoginForm from '@/components/auth/login-form';
import Logo from '@/components/common/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-8">
        <Logo width={180} height={60} />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Bem-vindo!</CardTitle>
          <CardDescription>CONTROLE DE VENDAS – EQUIPE COMERCIAL ENGEAR</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
       <p className="mt-6 text-center text-sm text-muted-foreground">
        Esqueceu a senha?{' '}
        <a
          href="mailto:pastaengear@gmail.com?subject=Recuperação de Senha - Controle de Vendas ENGEAR"
          className="font-medium text-primary hover:underline"
        >
          Recuperar via E-mail
        </a>
      </p>
    </div>
  );
}
