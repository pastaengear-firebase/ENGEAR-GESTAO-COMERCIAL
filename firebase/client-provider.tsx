'use client';

import type React from 'react';
import { useMemo } from 'react';
import { initializeFirebase } from './init';
import { FirebaseProvider } from './provider';

/**
 * IMPORTANTE:
 * App Check DESATIVADO temporariamente para não bloquear produção (403).
 * Depois que o login estiver OK, reativamos com ReCaptcha v3 e domínios liberados.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicializa o Firebase de forma estável (uma vez)
  const firebase = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider value={firebase}>
      {children}
    </FirebaseProvider>
  );
}
