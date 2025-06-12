# 🧪 Quick Test Guide - Key System

Your key generation and management system is now live! Here's how to test it:

## ✅ **What's Working Now**

- ✅ Firebase connection established
- ✅ Commands deployed successfully
- ✅ Bot is running
- ✅ Key system initialized

## 🧪 **Testing Steps**

### **1. Test Admin Commands (You need admin permissions)**

#### **Generate Keys**
```
/keys generate model:premium_tweak duration:30d count:3
```
**Expected Result:** You should see 3 keys generated with a success embed.

#### **View Key Dashboard**
```
/keys dashboard
```
**Expected Result:** Excel-like dashboard showing key statistics and recent keys.

#### **View Key Status**
```
/keys view model:premium_tweak
```
**Expected Result:** Overview of keys for the Premium Tweak App model.

### **2. Test User Commands**

#### **Redeem a Key**
```
/redeem key:PRE-XXXX-XXXX-XXXX
```
**Expected Result:** Success message if key is valid, error if invalid.

#### **View Your Keys**
```
/mykeys
```
**Expected Result:** Shows your redeemed keys or "no keys found" message.

## 🔍 **What to Look For**

### **In Discord:**
- ✅ Commands appear in slash command menu
- ✅ No error messages when using commands
- ✅ Proper embeds with key information
- ✅ Buttons and interactions work

### **In Console:**
You should see these messages when the bot starts:
```
✅ Firebase service account loaded from local file
✅ Firebase Admin SDK initialized successfully
✅ Firestore connection test successful
✅ Key system collections initialized
🔑 Key system ready!
```

### **In Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `velari-59c5e`
3. Go to **Firestore Database**
4. You should see a `keys` collection with documents

## 🚨 **Troubleshooting**

### **If Commands Don't Appear:**
- Wait 1-2 minutes for Discord to update
- Check if you have the required admin roles
- Verify bot has proper permissions

### **If Keys Don't Generate:**
- Check console for error messages
- Verify Firebase connection is working
- Check if you have admin permissions

### **If Firebase Errors:**
- Ensure `velari-59c5e-firebase-adminsdk-fbsvc-1d3000b75a.json` is in project root
- Check internet connection
- Verify Firebase project is active

## 🎯 **Test Scenarios**

### **Scenario 1: Basic Key Generation**
1. Use `/keys generate` to create 5 keys
2. Check Firebase Console for new documents
3. Use `/keys dashboard` to view them

### **Scenario 2: Key Redemption**
1. Generate a key using `/keys generate`
2. Copy the key from the embed
3. Use `/redeem` with the copied key
4. Check that key status changes to "redeemed"

### **Scenario 3: Dashboard Features**
1. Use `/keys dashboard`
2. Try the filter buttons
3. Check if statistics update correctly

## 📊 **Expected Database Structure**

In Firebase Console, you should see:
```
📁 keys/
├── 📄 {auto-generated-id}
│   ├── key: "PRE-XXXX-XXXX-XXXX"
│   ├── model: "premium_tweak"
│   ├── duration: "30d"
│   ├── isActive: true
│   ├── createdAt: [timestamp]
│   └── createdBy: [your-user-id]
└── 📄 system_info
    ├── initialized: true
    ├── version: "1.0.0"
    └── description: "Key Management System"
```

## 🎉 **Success Indicators**

- ✅ Commands work without errors
- ✅ Keys generate and store in Firebase
- ✅ Dashboard shows real-time data
- ✅ Key redemption works properly
- ✅ No console errors

## 📞 **Need Help?**

If you encounter issues:
1. Check the console output for error messages
2. Verify your admin roles in `config.js`
3. Test Firebase connection with `!testfirebase` (if you add the debug command)
4. Create a support ticket using `/ticket`

---

**Your key system is now fully operational!** 🚀 