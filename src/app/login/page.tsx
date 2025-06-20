// src/app/login/page.tsx
// This page is no longer used as the login system has been removed.
// It is kept as a minimal placeholder to prevent build errors if it's still referenced.
// The application should redirect directly to the dashboard.

export default function LoginPage() {
  // It's recommended to ensure that your middleware and root page ('/')
  // are correctly redirecting to '/dashboard' and that no links
  // point to '/login' anymore.
  if (typeof window !== 'undefined') {
    // Attempt to redirect if somehow accessed client-side,
    // though middleware should prevent this.
    window.location.href = '/dashboard';
  }
  return null; // Render nothing
}
