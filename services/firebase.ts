
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Safely get environment variables supporting both Vite (import.meta.env) and process.env
const getEnv = (key: string) => {
    let value = undefined;
    
    // Try import.meta.env
    try {
        const meta = import.meta as any;
        if (meta && meta.env) {
            value = meta.env[key];
        }
    } catch (e) {}

    // Fallback to process.env
    if (!value && typeof process !== 'undefined') {
        const proc = process as any;
        if (proc.env) {
            value = proc.env[key];
        }
    }
    
    return value;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Initialize Firebase
// We wrap in a try-catch to prevent app crash if keys are missing during development
let app;
let auth: any;
let googleProvider: any;

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        // FORCE ACCOUNT SELECTION: This prevents auto-login if a session exists,
        // ensuring the user explicitly chooses an account every time.
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
    } else {
        console.warn("Firebase Config missing or incomplete. Google Login will not work properly.");
    }
} catch (error) {
    console.error("Error initializing Firebase", error);
}

export { auth, googleProvider };
