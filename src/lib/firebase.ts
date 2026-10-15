import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const env = import.meta.env;

const rawConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Check if all expected environment variables are present
export const isFirebaseConfigured = Boolean(
  rawConfig.apiKey &&
  rawConfig.authDomain &&
  rawConfig.projectId &&
  rawConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  const config: FirebaseConfig = {
    apiKey: rawConfig.apiKey as string,
    authDomain: rawConfig.authDomain as string,
    projectId: rawConfig.projectId as string,
    storageBucket: (rawConfig.storageBucket as string) || `${rawConfig.projectId}.appspot.com`,
    messagingSenderId: (rawConfig.messagingSenderId as string) || '',
    appId: rawConfig.appId as string,
  };

  // Prevent duplicate app initialization during Vite HMR
  app = getApps().length > 0 ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn(
    'Firebase environment variables missing. Ensure VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID are set in .env'
  );
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db };
