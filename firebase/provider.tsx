'use client';
import type React from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { FirebaseStorage } from 'firebase/storage';

interface FirebaseContextType {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

interface FirebaseProviderProps {
  children: React.ReactNode;
  value: {
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
  };
}

export function FirebaseProvider({ children, value }: FirebaseProviderProps) {
  // Garantir que o valor do contexto seja estável
  const contextValue = useMemo(() => value, [value.app, value.firestore, value.auth, value.storage]);
  
  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase deve ser usado dentro de um FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
    return useFirebase().app;
}

export function useFirestore() {
    return useFirebase().firestore;
}

export function useAuth() {
    return useFirebase().auth;
}

export function useStorage() {
    return useFirebase().storage;
}
