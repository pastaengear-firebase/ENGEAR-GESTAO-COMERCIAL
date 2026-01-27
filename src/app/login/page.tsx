// src/app/login/page.tsx
import { redirect } from 'next/navigation';

export default function LoginPage() {
  // The login page is now the root page ('/'). 
  // This page just redirects to the root to handle any old bookmarks or links.
  redirect('/');
}
