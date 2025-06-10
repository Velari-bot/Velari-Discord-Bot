import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
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