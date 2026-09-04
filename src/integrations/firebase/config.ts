import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  Unsubscribe,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const LOCAL_STORAGE_KEY = 'pastelaria_firebase_config';

export const getStoredFirebaseConfig = (): FirebaseConfig | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.projectId && parsed?.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler configuração local do Firebase:', e);
  }

  // Check env variables
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : '');
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : '');
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
  const appId = import.meta.env.VITE_FIREBASE_APP_ID || '';

  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };
  }

  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  window.location.reload();
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

const activeConfig = getStoredFirebaseConfig();

if (activeConfig && activeConfig.apiKey && activeConfig.projectId) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(activeConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.error('Falha ao inicializar Firebase:', err);
  }
}

export const isFirebaseConfigured = (): boolean => {
  return !!db && !!auth && !!activeConfig?.projectId;
};

export { app, db, auth };

/**
 * Helper para escutar alterações em tempo real de uma coleção do Firestore
 */
export const subscribeToCollection = (
  collectionName: string,
  onUpdate: (data: DocumentData[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe => {
  if (!db) {
    return () => {};
  }
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    return onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        onUpdate(docs);
      },
      (error) => {
        console.warn(`[Firebase Realtime] Aviso na coleção ${collectionName}:`, error);
      }
    );
  } catch (err) {
    console.warn(`[Firebase Realtime] Erro ao subscrever ${collectionName}:`, err);
    return () => {};
  }
};
