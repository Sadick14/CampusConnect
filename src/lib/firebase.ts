'use client';
/**
 * @fileOverview Firebase configuration for client-side.
 * Auth and Storage run on client. Firestore operations run server-side via actions.
 */

import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';


const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Please check your environment variables.');
}

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App Initialized successfully.");
} else {
    app = getApp();
}

// --- Firestore Initialization ---
let dbInstance: Firestore | null = null;

/**
 * Get or initialize Firestore instance.
 * Works in both server and client environments.
 */
export function getDb(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    // Simple initialization that works on both client and server
    dbInstance = getFirestore(app);
    console.log("Firestore initialized successfully.");
    return dbInstance;
  } catch (error: any) {
    console.error("Error initializing Firestore:", error);
    throw new Error(`Failed to initialize Firestore: ${error.message}`);
  }
}

// Initialize other Firebase services
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };