// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  /**
   * Redirecionamento limpo para o dashboard.
   * O AuthGate dentro do layout cuidará da autenticação.
   */
  redirect('/dashboard');
}
