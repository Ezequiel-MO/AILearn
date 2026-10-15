import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getFirestore, runTransaction } from 'firebase/firestore';
import { mergeDocs } from '../storage/merge';
import { migrate } from '../storage/migrate';
import type { ProgressDoc } from '../storage/types';

// La configuración web de Firebase no es secreta: lo que protege los datos son las reglas de
// Firestore (`firestore.rules`), que solo dejan a cada usuario leer y escribir lo suyo.
const firebaseConfig = {
  apiKey: 'AIzaSyCTyoP9zmcZYb3U3B5Oyp5EN-lArcdCtCQ',
  authDomain: 'ailearn-ebf6e.firebaseapp.com',
  projectId: 'ailearn-ebf6e',
  storageBucket: 'ailearn-ebf6e.firebasestorage.app',
  messagingSenderId: '842941016450',
  appId: '1:842941016450:web:a6702300d79aeffbd4879b',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export interface CloudUser {
  uid: string;
  /** Nombre visible, o el correo si no hay nombre. */
  name: string;
}

/** Avisa del usuario actual (también del que ya tenía la sesión abierta al cargar). */
export const watchUser = (listener: (user: CloudUser | null) => void): (() => void) =>
  onAuthStateChanged(auth, (user) =>
    listener(user ? { uid: user.uid, name: user.displayName ?? user.email ?? '' } : null),
  );

export const signIn = async (): Promise<void> => {
  await signInWithPopup(auth, new GoogleAuthProvider());
};

export const signOut = (): Promise<void> => firebaseSignOut(auth);

/**
 * Fusiona `local` con el progreso guardado en la nube en una transacción, escribe el resultado si
 * cambia y lo devuelve. Un documento de la nube ilegible no se pisa: lanza.
 */
export const syncProgress = (
  uid: string,
  gameId: string,
  local: ProgressDoc,
): Promise<ProgressDoc> =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, 'users', uid, 'progress', gameId);
    const snap = await tx.get(ref);
    const raw: unknown = snap.exists() ? snap.get('doc') : undefined;
    let remote: ProgressDoc | null = null;
    if (raw !== undefined) {
      try {
        remote = typeof raw === 'string' ? migrate(JSON.parse(raw)) : null;
      } catch {
        remote = null;
      }
      if (remote === null) throw new Error(`Progreso ilegible en la nube: ${gameId}`);
    }
    const merged = remote ? mergeDocs(local, remote) : local;
    const text = JSON.stringify(merged);
    if (text !== raw) tx.set(ref, { doc: text, updatedAt: new Date().toISOString() });
    return merged;
  });
