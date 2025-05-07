
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
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

// Firestore instance variable
let dbInstance: ReturnType<typeof getFirestore>;

/**
 * Initializes and/or returns the Firestore database instance.
 * Ensures that `initializeFirestore` with persistence settings is called once on the client.
 */
function getDbInstance(): ReturnType<typeof getFirestore> {
  if (dbInstance) {
    return dbInstance;
  }

  if (typeof window !== 'undefined') { // Client-side
    try {
      // Initialize Firestore with multi-tab persistent cache
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
          cacheSizeBytes: CACHE_SIZE_UNLIMITED, // Or a specific size like 100 * 1024 * 1024 for 100MB
        }),
      });
      // console.log('Firestore initialized with persistence on the client.');
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        // This error typically means another tab already has persistence enabled.
        // Or, the browser does not support IndexedDB in the current context (e.g., private browsing).
        console.warn('Firestore persistence (multi-tab) failed to initialize. This can happen if multiple tabs are open or IndexedDB is unavailable. Falling back.', error.message);
        // Fallback to default (possibly in-memory or single-tab if available)
        // Or try single-tab persistence:
        try {
            dbInstance = initializeFirestore(app, { localCache: persistentLocalCache({}) });
        } catch (singleTabError: any) {
             console.warn('Firestore single-tab persistence also failed. Using default Firestore instance.', singleTabError.message);
             dbInstance = getFirestore(app); // Default instance without explicit persistence settings
        }

      } else if (error.message && error.message.includes('already been called')) {
        // Firestore was already initialized (e.g., due to HMR or other part of the code)
        // console.log('Firestore was already initialized. Getting existing instance.');
        dbInstance = getFirestore(app);
      } else {
        // Other unexpected errors
        console.error('Error initializing Firestore with persistence:', error);
        dbInstance = getFirestore(app); // Fallback to default instance
      }
    }
  } else { // Server-side
    try {
      // Initialize Firestore with default settings for server-side usage
      // No client-side persistence features are applicable here.
      dbInstance = initializeFirestore(app, {});
    } catch (error: any) {
       if (error.message && error.message.includes('already been called')) {
        dbInstance = getFirestore(app);
      } else {
        // Rethrow if it's an unexpected error during server-side initialization
        throw error;
      }
    }
    // console.log('Firestore initialized for server environment.');
  }
  return dbInstance;
}

const db = getDbInstance();
const auth = getAuth(app);

export { app, db, auth };

