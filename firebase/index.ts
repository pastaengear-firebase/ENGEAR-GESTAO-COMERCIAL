
// src/firebase/index.ts
/**
 * Arquivo de exportação central do Firebase.
 * NÃO exporta o FirebaseClientProvider aqui para evitar ciclos de importação.
 */
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth, useStorage } from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
export { initializeFirebase } from './init';
