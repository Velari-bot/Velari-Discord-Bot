import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
  let serviceAccount;
  
  // Try to load from environment variable first (for Railway/Production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Firebase service account loaded from environment variable');
    } catch (error) {
      console.error('❌ Error parsing Firebase service account from environment:', error);
      process.exit(1);
    }
  } else {
    // Load from local file (for local development)
    try {
      const serviceAccountPath = path.join(process.cwd(), 'velari-59c5e-firebase-adminsdk-fbsvc-1d3000b75a.json');
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
      console.log('✅ Firebase service account loaded from local file');
    } catch (error) {
      console.error('❌ Error loading Firebase service account:', error);
      console.log('📋 Make sure the Firebase service account key file is in your project root directory.');
      console.log('📋 Or set the FIREBASE_SERVICE_ACCOUNT environment variable.');
      process.exit(1);
    }
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://velari-59c5e.firebaseio.com'
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    process.exit(1);
  }
}

export const db = admin.firestore();

// Test database connection
export async function testConnection() {
  try {
    await db.collection('test').doc('connection').get();
    console.log('✅ Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    return false;
  }
}

// Initialize key system collections
export async function initializeKeySystem() {
  try {
    // Create a test document to ensure the keys collection exists
    await db.collection('keys').doc('system_info').set({
      initialized: true,
      initializedAt: new Date(),
      version: '1.0.0',
      description: 'Key Management System'
    });
    console.log('✅ Key system collections initialized');
    return true;
  } catch (error) {
    console.error('❌ Error initializing key system:', error);
    return false;
  }
}

// Legacy functions for embed templates
export async function saveTemplate(userId, name, data) {
  try {
    await db.collection('embedTemplates').doc(`${userId}_${name}`).set(data);
    return true;
  } catch (error) {
    console.error('Error saving template:', error);
    return false;
  }
}

export async function loadTemplate(userId, name) {
  try {
    const doc = await db.collection('embedTemplates').doc(`${userId}_${name}`).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error loading template:', error);
    return null;
  }
} 