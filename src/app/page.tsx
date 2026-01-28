// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The AuthGate will intercept this. If the user is not logged in, it will redirect to /login.
  // If they are logged in, it will redirect to /dashboard.
  // This redirect acts as a fallback.
  redirect('/login');
}
