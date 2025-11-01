/**
 * @fileOverview Server-side Firestore initialization.
 * Used exclusively by server actions in services/*.ts files.
 */

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Firebase configuration is incomplete. Check environment variables.');
}

// Initialize Firebase App for server
const serverApp = !getApps().length 
  ? initializeApp(firebaseConfig, 'server')
  : getApp('server');

// Firestore instance cache
let dbInstance: Firestore | null = null;

/**
 * Get Firestore instance for server-side operations.
 * ONLY use this in server actions ('use server' functions).
 */
export function getDb(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }
  
  dbInstance = getFirestore(serverApp);
  return dbInstance;
}
