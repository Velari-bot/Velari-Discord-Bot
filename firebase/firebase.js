import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveTemplate(userId, name, data) {
  await setDoc(doc(db, 'embedTemplates', `${userId}_${name}`), data);
}

export async function loadTemplate(userId, name) {
  const docSnap = await getDoc(doc(db, 'embedTemplates', `${userId}_${name}`));
  return docSnap.exists() ? docSnap.data() : null;
} 