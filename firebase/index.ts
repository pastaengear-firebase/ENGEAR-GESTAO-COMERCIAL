'use client';
/**
 * Barrel file simplificado para evitar dependências circulares.
 */
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth, useStorage } from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
export { initializeFirebase } from './init';
