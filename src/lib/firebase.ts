import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  enableIndexedDbPersistence,
  terminate,
  clearIndexedDbPersistence
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore instance variable - module scope
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let persistenceEnabled = false; // Flag to track if persistence has been successfully enabled

/**
 * Initializes and/or returns the Firestore database instance.
 * Attempts to enable multi-tab persistent cache on the client.
 */
function getDbInstance(): ReturnType<typeof getFirestore> {
    if (dbInstance) {
        // console.log('Returning existing Firestore instance.');
        return dbInstance;
    }

    if (typeof window !== 'undefined') { // Client-side
        if (!persistenceEnabled) {
            try {
                // Attempt to initialize with multi-tab persistence
                // console.log('Attempting to initialize Firestore with multi-tab persistence...');
                dbInstance = initializeFirestore(app, {
                    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
                    // Optional: Specify cache size: cacheSizeBytes: CACHE_SIZE_UNLIMITED 
                });
                persistenceEnabled = true;
                // console.log('Firestore initialized with multi-tab persistence.');
            } catch (error: any) {
                if (error.code === 'failed-precondition') {
                    console.warn('Multi-tab persistence failed (likely another tab open or private browsing). Attempting single-tab persistence...');
                    try {
                         dbInstance = initializeFirestore(app, { localCache: persistentLocalCache({}) });
                         persistenceEnabled = true;
                         console.log('Firestore initialized with single-tab persistence.');
                    } catch (singleTabError: any) {
                         if (singleTabError.code === 'failed-precondition') {
                             console.warn('Single-tab persistence also failed. Using memory cache only.');
                              dbInstance = getFirestore(app); // Fallback to memory cache
                         } else if (singleTabError.message?.includes('already been called')) {
                            console.warn('Firestore initializeFirestore() already called (single-tab fallback). Getting instance.');
                            dbInstance = getFirestore(app);
                            // Heuristic: assume persistence might have been enabled elsewhere if already called
                            persistenceEnabled = true; 
                         } else {
                             console.error('Unexpected error during single-tab persistence init:', singleTabError);
                             dbInstance = getFirestore(app); // Fallback
                         }
                    }
                } else if (error.message?.includes('already been called')) {
                     console.warn('Firestore initializeFirestore() already called (multi-tab attempt). Getting instance.');
                     dbInstance = getFirestore(app);
                      // Heuristic: assume persistence might have been enabled elsewhere if already called
                     persistenceEnabled = true; 
                } else {
                    console.error('Unexpected error during multi-tab persistence init:', error);
                    dbInstance = getFirestore(app); // Fallback
                }
            }
        } else {
             // Persistence was already enabled in a previous call, just get the instance
             // console.log('Persistence already enabled, getting Firestore instance.');
             dbInstance = getFirestore(app);
        }

    } else { // Server-side
        // console.log('Initializing Firestore for server environment (no persistence).');
        // Avoid initializeFirestore on server if possible, just get instance
        try {
             dbInstance = getFirestore(app);
        } catch (error: any) {
             console.error('Error getting Firestore instance on server:', error);
             // Handle specific errors if necessary, otherwise rethrow or handle gracefully
             throw new Error("Failed to get Firestore instance on server.");
        }
    }

    if (!dbInstance) {
        // This should ideally not happen if logic above is correct
        console.error("Failed to obtain Firestore instance!");
        // Attempt a final fallback
        dbInstance = getFirestore(app);
        if (!dbInstance) {
             throw new Error("Could not initialize or get Firestore instance.");
        }
    }
    
    return dbInstance;
}


const db = getDbInstance();
const auth = getAuth(app);

// --- Experimental Offline Utilities (Use with caution) ---

/** Clears Firestore persistence. Useful for debugging or resetting state. */
export async function clearPersistence() {
  if (typeof window !== 'undefined' && dbInstance) {
    try {
      await terminate(dbInstance); // Terminate instance before clearing persistence
      await clearIndexedDbPersistence(db.app); // Pass the FirebaseApp instance
      console.log('Firestore persistence cleared.');
      // Reset internal state
      dbInstance = null;
      persistenceEnabled = false;
      // Re-initialize after clearing
       getDbInstance(); 
    } catch (error) {
      console.error('Error clearing Firestore persistence:', error);
    }
  } else {
      console.warn('Cannot clear persistence: Not on client or db instance not available.');
  }
}


export { app, db, auth };