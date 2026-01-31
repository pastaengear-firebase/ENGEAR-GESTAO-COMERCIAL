
// src/firebase/index.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Export providers and hooks for easy import
export { FirebaseProvider, FirebaseClientProvider, useFirebase, useFirebaseApp, useFirestore } from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

// --- Initialize Firebase ---
let firebaseApp: FirebaseApp;
let firestore: Firestore;

function initializeFirebase() {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
  firestore = getFirestore(firebaseApp);

  return { app: firebaseApp, firestore };
}

export { initializeFirebase };
