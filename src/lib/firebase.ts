'use client'; // Ensure this runs client-side where persistence is relevant

import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
// Remove Firestore imports
// import {
//   getFirestore,
//   initializeFirestore,
//   persistentLocalCache,
//   persistentMultipleTabManager,
//   enableIndexedDbPersistence,
//   terminate,
//   clearIndexedDbPersistence,
//   CACHE_SIZE_UNLIMITED,
//   type Firestore
// } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // Keep Firebase Storage

console.warn(`
***************************************************************************
* Firestore initialization is DISABLED in src/lib/firebase.ts.           *
* The application is currently configured to use a TEMPORARY             *
* in-memory store (src/lib/in-memory-db.ts) for development purposes.    *
* Data will be LOST on server restart. Re-enable Firestore for production. *
***************************************************************************
`);


const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Make sure this is set in .env
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App - Ensure this happens reliably
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App Initialized (Auth and Storage only).");
} else {
    app = getApp();
    // console.log("Using existing Firebase App instance.");
}


// Remove all Firestore initialization logic (getDb, initializeDbInternal, dbInstance etc.)
// ... Firestore initialization code removed ...

/**
 * Public function to get the initialized Firestore instance.
 * Ensures initialization is attempted only once.
 *
 * NO LONGER USED - Returns null to satisfy type checks elsewhere,
 * but services should now use the in-memory store.
 */
export async function getDb(): Promise<null> {
    console.warn("getDb() called, but Firestore is disabled. Returning null. Use in-memory store instead.");
    return null;
    // throw new Error("Firestore is disabled. Cannot get DB instance.");
}

// Initialize other Firebase services
const auth = getAuth(app);
const storage = getStorage(app);

// --- Experimental Offline Utilities (Use with caution) ---
// Remove clearPersistence as it relies on Firestore
// export async function clearPersistence() { ... }


export { app, auth, storage }; // Export app, auth, storage directly
// Do not export 'db' directly anymore