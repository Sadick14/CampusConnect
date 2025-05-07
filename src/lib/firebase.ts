
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentMultipleTabManager, type PersistentSettings } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Disable persistence
const settings: PersistentSettings = {
  persistenceKey: 'disabled',
  tabManager: persistentMultipleTabManager
};

let db;

if (getApps().length > 0) {
  db = getFirestore();
} else {
  // Initialize Firestore with persistence disabled
  db = initializeFirestore(app, {
    localCacheSettings: settings
  });
}

const auth = getAuth(app);

export { app, db, auth };
