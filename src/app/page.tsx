// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redireciona para o dashboard por padrão. 
  // O AuthGate irá interceptar e redirecionar para /login se o usuário não estiver autenticado.
  // Isso remove o conflito de redirecionamento que existia antes.
  redirect('/dashboard');
}
