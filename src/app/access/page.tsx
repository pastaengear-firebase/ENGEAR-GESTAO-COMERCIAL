// src/app/access/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccessPage() {
  const router = useRouter();

  useEffect(() => {
    console.log("AccessPage rendered (client-side).");
    // This useEffect is primarily for client-side logging in this minimal version.
    // In a fully functional version, it might check if access is already granted.
  }, []);

  const handleTestNavigation = () => {
    // This is a placeholder for actual password checking and redirection logic.
    // For now, it just simulates granting access and redirecting.
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_engear_access_granted', 'true'); // Simulate granting access
    }
    router.push('/dashboard');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Access Page (Minimal)</h1>
      <p>If you see this, the basic page structure is loading and rendering on the client.</p>
      <p>Check the browser console for a log message.</p>
      <div style={{ marginTop: '20px' }}>
        <input type="password" placeholder="Enter password (not checked)" style={{ padding: '10px', marginRight: '10px' }} />
        <button onClick={handleTestNavigation} style={{ padding: '10px 15px' }}>
          Simulate Login & Go to Dashboard
        </button>
      </div>
    </div>
  );
}
