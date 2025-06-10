import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://velari-59c5e.firebaseio.com'
  });
}

export const db = admin.firestore();

export async function saveTemplate(userId, name, data) {
  await db.collection('embedTemplates').doc(`${userId}_${name}`).set(data);
}

export async function loadTemplate(userId, name) {
  const doc = await db.collection('embedTemplates').doc(`${userId}_${name}`).get();
  return doc.exists ? doc.data() : null;
} 