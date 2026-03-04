// src/firebase/init.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp;
let firestore: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

/**
 * Inicializa o Firebase de forma isolada para evitar dependências circulares.
 */
export function initializeFirebase() {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
  firestore = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
  storage = getStorage(firebaseApp);

  return { app: firebaseApp, firestore, auth, storage };
}
