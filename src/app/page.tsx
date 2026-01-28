// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // O AuthGate irá interceptar isso. Se o usuário não estiver logado, será redirecionado para /login.
  // Se estiver logado, será redirecionado para /dashboard.
  redirect('/dashboard');
}
