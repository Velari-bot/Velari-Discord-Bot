# 🔥 Firebase Setup Guide for Key System

This guide will help you set up Firebase for the key generation and management system.

## 📋 What You Already Have

✅ **Firebase Project**: `velari-59c5e`  
✅ **Service Account Key**: `velari-59c5e-firebase-adminsdk-fbsvc-1d3000b75a.json`  
✅ **Database URL**: `https://velari-59c5e.firebaseio.com`  
✅ **Firestore**: Already configured  

## 🔧 Firebase Console Setup

### 1. **Access Your Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `velari-59c5e`
3. Navigate to **Firestore Database**

### 2. **Firestore Database Rules**
Update your Firestore security rules to allow the key system:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow access to keys collection
    match /keys/{document} {
      allow read, write: if true; // For now, allow all access
      // Later you can restrict this based on your needs
    }
    
    // Allow access to embedTemplates collection (existing)
    match /embedTemplates/{document} {
      allow read, write: if true;
    }
    
    // Allow access to test collection
    match /test/{document} {
      allow read, write: if true;
    }
  }
}
```

### 3. **Firestore Database Structure**
The key system will automatically create these collections:

```
📁 keys/ (Main collection for key management)
├── 📄 {auto-generated-id} (Individual keys)
│   ├── key: "PRE-XXXX-XXXX-XXXX"
│   ├── model: "premium_tweak"
│   ├── duration: "30d"
│   ├── expiresAt: Timestamp
│   ├── isActive: true
│   ├── createdAt: Timestamp
│   ├── createdBy: "user_id"
│   ├── createdByUsername: "username"
│   ├── redeemedBy: "user_id" (null if not redeemed)
│   ├── redeemedByUsername: "username" (null if not redeemed)
│   ├── redeemedAt: Timestamp (null if not redeemed)
│   ├── description: "Custom description" (optional)
│   └── isCustom: true (for custom keys)
└── 📄 system_info (System information)
    ├── initialized: true
    ├── initializedAt: Timestamp
    ├── version: "1.0.0"
    └── description: "Key Management System"

📁 embedTemplates/ (Existing collection)
└── 📄 {userId}_{name} (Your existing embed templates)

📁 test/ (Test collection for connection testing)
└── 📄 connection (Connection test document)
```

## 🚀 Environment Variables (Optional)

### For Production/Deployment
If you're deploying to Railway or another platform, set this environment variable:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"velari-59c5e",...}
```

**To get this value:**
1. Copy the entire contents of your `velari-59c5e-firebase-adminsdk-fbsvc-1d3000b75a.json` file
2. Paste it as the environment variable value

### For Local Development
Keep using the JSON file in your project root (which you already have).

## 🔍 Testing Your Setup

### 1. **Start Your Bot**
```bash
npm start
```

You should see these messages in your console:
```
✅ Firebase service account loaded from local file
✅ Firebase Admin SDK initialized successfully
✅ Firestore connection test successful
✅ Key system collections initialized
🔑 Key system ready!
```

### 2. **Test Key Generation**
1. Use the `/keys generate` command in Discord
2. Check your Firebase Console → Firestore → keys collection
3. You should see new documents being created

### 3. **Test Key Redemption**
1. Generate a key using `/keys generate`
2. Use `/redeem` with the generated key
3. Check that the key status changes in Firebase

## 📊 Firebase Console Monitoring

### **Monitor Key Usage**
1. Go to Firebase Console → Firestore Database
2. Navigate to the `keys` collection
3. You can see:
   - All generated keys
   - Key status (active/redeemed)
   - User information
   - Expiry dates

### **Real-time Updates**
The Firebase Console updates in real-time, so you can see:
- New keys being generated
- Keys being redeemed
- Status changes

## 🔒 Security Considerations

### **Current Setup (Development)**
- All Firestore operations are allowed
- Service account has full access
- Suitable for development and testing

### **Production Recommendations**
1. **Restrict Firestore Rules**: Limit access based on user authentication
2. **Environment Variables**: Use environment variables instead of JSON files
3. **Service Account Permissions**: Limit service account to only necessary permissions
4. **Regular Backups**: Set up automated backups of your Firestore data

## 🛠️ Troubleshooting

### **Common Issues**

#### 1. **"Firebase service account not found"**
- Ensure `velari-59c5e-firebase-adminsdk-fbsvc-1d3000b75a.json` is in your project root
- Check file permissions
- Verify the file is not corrupted

#### 2. **"Firestore connection test failed"**
- Check your internet connection
- Verify Firebase project is active
- Check Firestore rules allow read/write access

#### 3. **"Key system initialization failed"**
- Check Firestore rules
- Verify service account has write permissions
- Check Firebase project billing status

#### 4. **Keys not being created**
- Check bot has proper permissions
- Verify Firebase connection is working
- Check console for error messages

### **Debug Commands**
Add these to your bot for debugging:

```javascript
// Test Firebase connection
client.on('messageCreate', async message => {
  if (message.content === '!testfirebase') {
    const { testConnection } = await import('./firebase/firebase.js');
    const result = await testConnection();
    message.reply(`Firebase connection: ${result ? '✅ Working' : '❌ Failed'}`);
  }
});
```

## 📈 Firebase Analytics (Optional)

### **Enable Analytics**
1. Go to Firebase Console → Analytics
2. Enable Google Analytics for Firebase
3. Track key generation and redemption events

### **Custom Events**
You can track custom events like:
- Key generation
- Key redemption
- Key expiry
- User subscriptions

## 🔄 Backup and Recovery

### **Export Data**
```bash
# Export all keys (using Firebase CLI)
firebase firestore:export keys-backup --project=velari-59c5e
```

### **Import Data**
```bash
# Import keys (using Firebase CLI)
firebase firestore:import keys-backup --project=velari-59c5e
```

## 📞 Support

### **Firebase Support**
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)

### **Bot Support**
- Check console logs for error messages
- Use `/keys dashboard` to monitor key system
- Create support tickets for issues

---

## ✅ Setup Checklist

- [ ] Firebase project active (`velari-59c5e`)
- [ ] Service account key file in project root
- [ ] Firestore rules updated
- [ ] Bot starts without Firebase errors
- [ ] Key generation works (`/keys generate`)
- [ ] Key redemption works (`/redeem`)
- [ ] Dashboard shows data (`/keys dashboard`)
- [ ] Firebase Console shows key collection

**Your Firebase setup is already mostly complete!** The key system should work immediately with your current configuration. 