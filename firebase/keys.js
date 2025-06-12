import { db } from './firebase.js';

// Key management functions
export async function createKey(keyData) {
  try {
    const keyRef = await db.collection('keys').add({
      ...keyData,
      createdAt: new Date(),
      isActive: true
    });
    return keyRef.id;
  } catch (error) {
    console.error('Error creating key:', error);
    throw error;
  }
}

export async function getKey(keyId) {
  try {
    const keyDoc = await db.collection('keys').doc(keyId).get();
    return keyDoc.exists ? { id: keyDoc.id, ...keyDoc.data() } : null;
  } catch (error) {
    console.error('Error getting key:', error);
    throw error;
  }
}

export async function redeemKey(keyId, userId, username) {
  try {
    const keyRef = db.collection('keys').doc(keyId);
    const keyDoc = await keyRef.get();
    
    if (!keyDoc.exists) {
      throw new Error('Key not found');
    }
    
    const keyData = keyDoc.data();
    
    if (!keyData.isActive) {
      throw new Error('Key is already used or deactivated');
    }
    
    // Check if key is expired
    if (keyData.expiresAt && new Date() > keyData.expiresAt.toDate()) {
      throw new Error('Key has expired');
    }
    
    // Update key with redemption info
    await keyRef.update({
      isActive: false,
      redeemedBy: userId,
      redeemedByUsername: username,
      redeemedAt: new Date()
    });
    
    return keyData;
  } catch (error) {
    console.error('Error redeeming key:', error);
    throw error;
  }
}

export async function getAllKeys() {
  try {
    const keysSnapshot = await db.collection('keys').orderBy('createdAt', 'desc').get();
    const keys = [];
    keysSnapshot.forEach(doc => {
      keys.push({ id: doc.id, ...doc.data() });
    });
    return keys;
  } catch (error) {
    console.error('Error getting all keys:', error);
    throw error;
  }
}

export async function getKeysByModel(model) {
  try {
    const keysSnapshot = await db.collection('keys')
      .where('model', '==', model)
      .orderBy('createdAt', 'desc')
      .get();
    
    const keys = [];
    keysSnapshot.forEach(doc => {
      keys.push({ id: doc.id, ...doc.data() });
    });
    return keys;
  } catch (error) {
    console.error('Error getting keys by model:', error);
    throw error;
  }
}

export async function getActiveKeysByModel(model) {
  try {
    const keysSnapshot = await db.collection('keys')
      .where('model', '==', model)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    
    const keys = [];
    keysSnapshot.forEach(doc => {
      keys.push({ id: doc.id, ...doc.data() });
    });
    return keys;
  } catch (error) {
    console.error('Error getting active keys by model:', error);
    throw error;
  }
}

export async function deactivateKey(keyId) {
  try {
    await db.collection('keys').doc(keyId).update({
      isActive: false,
      deactivatedAt: new Date()
    });
  } catch (error) {
    console.error('Error deactivating key:', error);
    throw error;
  }
}

export async function reactivateKey(keyId) {
  try {
    await db.collection('keys').doc(keyId).update({
      isActive: true,
      deactivatedAt: null
    });
  } catch (error) {
    console.error('Error reactivating key:', error);
    throw error;
  }
}

export async function getUserKeys(userId) {
  try {
    const keysSnapshot = await db.collection('keys')
      .where('redeemedBy', '==', userId)
      .orderBy('redeemedAt', 'desc')
      .get();
    
    const keys = [];
    keysSnapshot.forEach(doc => {
      keys.push({ id: doc.id, ...doc.data() });
    });
    return keys;
  } catch (error) {
    console.error('Error getting user keys:', error);
    throw error;
  }
}

export async function getKeyStats() {
  try {
    const keysSnapshot = await db.collection('keys').get();
    const stats = {
      total: 0,
      active: 0,
      redeemed: 0,
      expired: 0,
      byModel: {}
    };
    
    keysSnapshot.forEach(doc => {
      const keyData = doc.data();
      stats.total++;
      
      if (keyData.isActive) {
        stats.active++;
      } else {
        stats.redeemed++;
      }
      
      if (keyData.expiresAt && new Date() > keyData.expiresAt.toDate()) {
        stats.expired++;
      }
      
      if (!stats.byModel[keyData.model]) {
        stats.byModel[keyData.model] = { total: 0, active: 0, redeemed: 0 };
      }
      stats.byModel[keyData.model].total++;
      
      if (keyData.isActive) {
        stats.byModel[keyData.model].active++;
      } else {
        stats.byModel[keyData.model].redeemed++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting key stats:', error);
    throw error;
  }
} 