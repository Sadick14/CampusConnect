
'use client'; // Ensure this runs client-side where persistence is relevant

import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableIndexedDbPersistence,
  terminate,
  clearIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED, // Added import
  type Firestore // Import Firestore type
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

// Initialize Firebase App - Ensure this happens reliably
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App Initialized.");
} else {
    app = getApp();
    // console.log("Using existing Firebase App instance.");
}


// Firestore instance variable - module scope
let dbInstance: Firestore | null = null;
let dbInitializationPromise: Promise<Firestore> | null = null;
let persistenceSetupAttempted = false;

/**
 * Initializes and/or returns the Firestore database instance lazily.
 * Attempts to enable multi-tab persistent cache on the client.
 */
function initializeDbInternal(): Promise<Firestore> {
    if (dbInstance) {
        // console.log('Returning existing Firestore instance.');
        return Promise.resolve(dbInstance);
    }

    if (dbInitializationPromise) {
        // console.log('Waiting for existing Firestore initialization promise.');
        return dbInitializationPromise;
    }

    console.log('Attempting to initialize or get Firestore instance...');
    dbInitializationPromise = (async () => {
        // Ensure we only attempt persistence setup once per session/page load on the client
        if (typeof window !== 'undefined' && !persistenceSetupAttempted) {
            persistenceSetupAttempted = true;
            try {
                console.log('Attempting to initialize Firestore with multi-tab persistence...');
                // Try initialize first - might throw if already called or service unavailable
                dbInstance = initializeFirestore(app, {
                    localCache: persistentLocalCache({ 
                        tabManager: persistentMultipleTabManager(),
                        // Specify cache size within the persistentLocalCache options
                        cacheSizeBytes: CACHE_SIZE_UNLIMITED 
                    }),
                    // Remove cacheSizeBytes from the top level
                    // cacheSizeBytes: CACHE_SIZE_UNLIMITED 
                });
                console.log('Firestore initialized successfully with multi-tab persistence.');
            } catch (multiTabError: any) {
                console.warn(`Multi-tab initializeFirestore failed: ${multiTabError.code} - ${multiTabError.message}`);
                // If it failed because it was already initialized OR because persistence failed,
                // try getting the existing instance.
                 if (multiTabError.code === 'failed-precondition' || multiTabError.message?.includes('already been called')) {
                     console.log('Multi-tab failed or already called. Getting existing Firestore instance (may try single-tab persistence)...');
                     try {
                        dbInstance = getFirestore(app); // Get existing instance
                        // Now, try enabling single-tab persistence *on the obtained instance*
                        // This might fail if persistence is already enabled or service unavailable
                        await enableIndexedDbPersistence(dbInstance).then(() => {
                           console.log('Firestore single-tab persistence enabled (or was already).');
                        }).catch((persistenceError: any) => {
                             if (persistenceError.code === 'failed-precondition') {
                                 console.warn('Single-tab persistence failed (might be ok if multi-tab already running). Using existing instance cache.');
                             } else if (persistenceError.message?.includes("is not available")) {
                                // This specific error confirms the service isn't enabled
                                console.error("CRITICAL: Firestore service is not available for this project. Please enable it in the Firebase console.");
                                throw new Error("Firestore service is not available."); // Throw specific error
                             } else {
                                 console.error('Unexpected error enabling single-tab persistence:', persistenceError);
                                 // Continue with the potentially memory-only instance
                             }
                        });
                     } catch (getError: any) {
                        console.error(`CRITICAL: Failed to get Firestore instance even after initialization attempt failed: ${getError.message}`);
                         if (getError.message?.includes("is not available")) {
                             console.error("CRITICAL: Firestore service is not available for this project. Please enable it in the Firebase console.");
                             throw new Error("Firestore service is not available."); // Re-throw specific error
                         }
                        throw new Error(`Could not get Firestore instance: ${getError.message}`);
                     }
                 } else if (multiTabError.message?.includes("is not available")) {
                    // Catch specific service unavailable error during initializeFirestore
                     console.error("CRITICAL: Firestore service is not available for this project. Please enable it in the Firebase console.");
                     throw new Error("Firestore service is not available.");
                 } else {
                     // Unexpected error during multi-tab initialization
                     console.error('Unexpected error during multi-tab persistence init, getting default instance:', multiTabError);
                     try {
                        dbInstance = getFirestore(app); // Final fallback: get default instance
                     } catch (getError: any) {
                         console.error(`CRITICAL: Failed to get default Firestore instance: ${getError.message}`);
                           if (getError.message?.includes("is not available")) {
                               console.error("CRITICAL: Firestore service is not available for this project. Please enable it in the Firebase console.");
                           }
                         throw new Error(`Could not get Firestore instance: ${getError.message}`);
                     }
                 }
            }
        } else { // Server-side or persistence already attempted
            // console.log('Getting Firestore instance (Server or persistence already attempted).');
             try {
                // On server or subsequent client calls, just get the instance
                dbInstance = getFirestore(app);
             } catch (getError: any) {
                 console.error(`CRITICAL: Failed to get Firestore instance: ${getError.message}`);
                 if (getError.message?.includes("is not available")) {
                     console.error("CRITICAL: Firestore service is not available for this project. Please enable it in the Firebase console.");
                     throw new Error("Firestore service is not available."); // Re-throw specific error
                 }
                 throw new Error(`Could not get Firestore instance: ${getError.message}`);
             }
        }

        if (!dbInstance) {
            // This should theoretically not be reached if errors are thrown correctly above
            console.error("Failed to obtain Firestore instance after initialization attempts!");
            throw new Error("Could not initialize or get Firestore instance.");
        }

        // console.log('Firestore instance obtained.');
        return dbInstance;
    })();

    return dbInitializationPromise;
}


/**
 * Public function to get the initialized Firestore instance.
 * Ensures initialization is attempted only once.
 */
export async function getDb(): Promise<Firestore> {
    // Trigger initialization if it hasn't started
    if (!dbInitializationPromise) {
       initializeDbInternal();
    }
    // dbInitializationPromise is guaranteed to be set now (or throw during initialization)
    return dbInitializationPromise!;
}

// Initialize other Firebase services
const auth = getAuth(app);
const storage = getStorage(app);

// --- Experimental Offline Utilities (Use with caution) ---

/** Clears Firestore persistence. Useful for debugging or resetting state. */
export async function clearPersistence() {
    if (typeof window !== 'undefined') {
        try {
            // Check if dbInstance exists and terminate it first
            if (dbInstance) {
                await terminate(dbInstance);
                console.log('Terminated existing Firestore instance.');
            } else {
                // If no instance, maybe it wasn't fully initialized? Try getting it to terminate.
                try {
                   const tempDb = getFirestore(app);
                   await terminate(tempDb);
                   console.log('Terminated fetched Firestore instance.');
                } catch (e) {
                   console.warn("Could not get/terminate Firestore instance before clearing persistence, might be okay if not initialized.", e);
                }
            }

            await clearIndexedDbPersistence(app); // Pass the FirebaseApp instance
            console.log('Firestore persistence cleared.');
            // Reset internal state for re-initialization on next getDb call
            dbInstance = null;
            dbInitializationPromise = null;
            persistenceSetupAttempted = false; // Allow re-attempting persistence setup
        } catch (error) {
            console.error('Error clearing Firestore persistence:', error);
        }
    } else {
        console.warn('Cannot clear persistence: Not on client.');
    }
}


export { app, auth, storage }; // Export app, auth, storage directly
// Do not export 'db' directly anymore, use getDb()

    
