
'use client'; // Ensure this runs client-side where persistence is relevant

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  enableIndexedDbPersistence,
  terminate,
  clearIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED // Added import
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Make sure this is set in .env
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore instance variable - module scope
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let dbInitializationPromise: Promise<ReturnType<typeof getFirestore>> | null = null;
let persistenceEnabled = false;

/**
 * Initializes and/or returns the Firestore database instance lazily.
 * Attempts to enable multi-tab persistent cache on the client.
 */
function initializeDb(): Promise<ReturnType<typeof getFirestore>> {
    if (dbInstance) {
        // console.log('Returning existing Firestore instance.');
        return Promise.resolve(dbInstance);
    }

    if (dbInitializationPromise) {
        // console.log('Waiting for existing Firestore initialization promise.');
        return dbInitializationPromise;
    }

    dbInitializationPromise = (async () => {
        if (typeof window !== 'undefined') { // Client-side
            if (!persistenceEnabled) {
                try {
                    // console.log('Attempting to initialize Firestore with multi-tab persistence...');
                    const initializedDb = initializeFirestore(app, {
                        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
                        cacheSizeBytes: CACHE_SIZE_UNLIMITED // Example: Set cache size
                    });
                    persistenceEnabled = true;
                    dbInstance = initializedDb;
                    console.log('Firestore initialized with multi-tab persistence.');
                } catch (error: any) {
                    if (error.code === 'failed-precondition' || error.message?.includes('already been called')) {
                        console.warn('Multi-tab persistence failed or already initialized. Trying single-tab or getting existing instance...');
                        try {
                            // Attempt single-tab persistence OR get existing instance if already called
                             dbInstance = getFirestore(app);
                             // Try enabling standard persistence if not already enabled (getFirestore doesn't enable it by default)
                             await enableIndexedDbPersistence(dbInstance).then(() => {
                                persistenceEnabled = true;
                                console.log('Firestore single-tab persistence enabled (or was already).');
                             }).catch((persistenceError: any) => {
                                  if (persistenceError.code === 'failed-precondition') {
                                       console.warn('Single-tab persistence failed. Using memory cache only.');
                                       // dbInstance is already set to memory instance by getFirestore()
                                  } else {
                                      console.error('Unexpected error enabling single-tab persistence:', persistenceError);
                                  }
                             });

                        } catch (singleTabError: any) {
                            console.error('Unexpected error during fallback Firestore init/get:', singleTabError);
                             // Final fallback: just get the instance (likely memory cache)
                             dbInstance = getFirestore(app);
                        }
                    } else {
                        console.error('Unexpected error during multi-tab persistence init:', error);
                        dbInstance = getFirestore(app); // Fallback to memory cache
                    }
                }
            } else {
                // Persistence was likely enabled in a previous attempt, just get the instance
                // console.log('Persistence previously enabled/attempted, getting Firestore instance.');
                dbInstance = getFirestore(app);
            }

        } else { // Server-side
            console.log('Initializing Firestore for server environment (no persistence).');
            try {
                dbInstance = getFirestore(app);
            } catch (error: any) {
                console.error('Error getting Firestore instance on server:', error);
                throw new Error("Failed to get Firestore instance on server.");
            }
        }

        if (!dbInstance) {
            console.error("Failed to obtain Firestore instance after initialization attempts!");
            throw new Error("Could not initialize or get Firestore instance.");
        }

        return dbInstance;
    })();

    return dbInitializationPromise;
}


/**
 * Public function to get the initialized Firestore instance.
 * Ensures initialization is attempted only once.
 */
export async function getDb(): Promise<ReturnType<typeof getFirestore>> {
    return initializeDb();
}

// Initialize other Firebase services (Auth, Storage) - These are generally safer to initialize eagerly
const auth = getAuth(app);
const storage = getStorage(app);

// --- Experimental Offline Utilities (Use with caution) ---

/** Clears Firestore persistence. Useful for debugging or resetting state. */
export async function clearPersistence() {
    if (typeof window !== 'undefined') {
        try {
            const currentDb = await getDb(); // Ensure DB is initialized before terminating
            await terminate(currentDb); // Terminate instance before clearing persistence
            await clearIndexedDbPersistence(app); // Pass the FirebaseApp instance
            console.log('Firestore persistence cleared.');
            // Reset internal state for re-initialization on next getDb call
            dbInstance = null;
            dbInitializationPromise = null;
            persistenceEnabled = false;
        } catch (error) {
            console.error('Error clearing Firestore persistence:', error);
        }
    } else {
        console.warn('Cannot clear persistence: Not on client.');
    }
}


export { app, auth, storage }; // Export app, auth, storage directly
// Do not export 'db' directly anymore, use getDb()

