import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Initialize Firebase only if the API key is provided
if (firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // This log helps debug which Firebase project is actually being used.
    console.log(`Firebase App Initialized. Using Project ID: ${app.options.projectId}`);

    // Warn if the .env file projectId doesn't match the one being used,
    // which indicates that the hosting environment is injecting credentials.
    if (firebaseConfig.projectId && app.options.projectId !== firebaseConfig.projectId) {
      console.warn(
        `FIREBASE CONFIG MISMATCH: The app is connected to project "${app.options.projectId}" (from the hosting environment), but your .env file specifies "${firebaseConfig.projectId}". The environment configuration takes priority.`
      );
    }

    // Try to enable offline persistence
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          // This is a warning, not a critical error. The app will still function.
          console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence not available in this browser.');
        }
      });
      
  } catch (e) {
    console.error("Firebase initialization error:", e);
    // app, auth, and db will remain null
  }
} else {
  // This message will appear in the server console during build/SSR
  // and in the browser console.
  console.warn("Firebase API key is missing. Authentication will be disabled. Please check your .env file.");
}

export { app, auth, db };
