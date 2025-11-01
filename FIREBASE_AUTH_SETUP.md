# Firebase Authentication Setup Guide

## 🎯 Google Authentication (Primary Method)

**Recommended:** Use Google Sign-In for seamless authentication without password management.

## ✅ Setup Steps

### 1. Enable Google Sign-In

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select project: **campusconnect-pro-61eqk**

2. **Navigate to Authentication:**
   - Click **Authentication** in left sidebar
   - Click **Sign-in method** tab

3. **Enable Google:**
   - Find **Google** in the list
   - Click on it
   - Toggle **Enable** switch to **ON**
   - Click **Save**

### 2. Add Authorized Domain (for GitHub Codespaces)

1. **In Authentication Settings:**
   - Click **Settings** tab
   - Scroll to **Authorized domains** section

2. **Add your Codespace domain:**
   - Click **Add domain**
   - Enter: `opulent-space-goldfish-9vrr6r76997fxqrr-9002.app.github.dev`
   - Click **Add**

3. **Also add localhost (for local development):**
   - Click **Add domain** again
   - Enter: `localhost`
   - Click **Add**

### 3. Verify Configuration

Your current Firebase config in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAkjOgy57nE7OKMKeJMmkHJ8cXPKvrvXiA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=campusconnect-pro-61eqk.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=campusconnect-pro-61eqk
```

✅ Configuration is correct!

### 4. Testing Authentication

After enabling Email/Password auth:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Reload the application**
3. **Try signing up** with a new account
4. **Try logging in** with the created account

### 5. Create First Super Admin User

After authentication is working:

1. Sign up with an email (e.g., `admin@campusconnect.pro`)
2. Go to **Firebase Console** > **Firestore Database**
3. Find the user document in `users` collection
4. Click **Edit** on the user document
5. Change `role` field from `school_admin` to `super_admin`
6. Click **Update**
7. Refresh your app - you'll now have super admin access!

## 🐛 Troubleshooting

### Error: `auth/internal-error`
**Cause:** Email/Password auth not enabled  
**Fix:** Follow Step 1 above

### Error: `auth/unauthorized-domain`
**Cause:** Domain not in authorized list  
**Fix:** Follow Step 2 above

### Error: `auth/invalid-api-key`
**Cause:** Wrong API key in .env.local  
**Fix:** Copy correct key from Firebase Console > Project Settings

### Error: `auth/network-request-failed`
**Cause:** No internet connection  
**Fix:** Check network, refresh page

### Users can sign up but can't access features
**Cause:** Firestore rules denying access  
**Fix:** Check that user document exists in `users` collection with proper `role` and `schoolId`

## 📋 Firestore Security Rules

Make sure your Firestore rules are set up:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function hasRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if request.auth.uid == userId;
      allow update, delete: if request.auth.uid == userId || hasRole('super_admin');
    }
    
    // Schools collection
    match /schools/{schoolId} {
      allow read: if isAuthenticated();
      allow create: if hasRole('super_admin');
      allow update, delete: if hasRole('super_admin');
    }
    
    // Add more rules for other collections...
  }
}
```

## 🔐 Initial Setup Checklist

- [x] Firebase project created
- [x] Environment variables set in `.env.local`
- [ ] **Email/Password authentication enabled** ⚠️ DO THIS FIRST
- [ ] **Authorized domains added** ⚠️ DO THIS SECOND
- [ ] Firestore database created
- [ ] Firestore rules deployed
- [ ] First user account created
- [ ] First user promoted to super_admin

## 🚀 Quick Start Commands

```bash
# Start dev server
npm run dev

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## 📞 Support

If you continue having issues:

1. Check browser console for detailed error messages
2. Verify all Firebase services are enabled
3. Ensure billing is enabled (if required)
4. Check Firebase Console > Usage for quota limits

---

**Last Updated:** October 28, 2025  
**Status:** Production-ready with Firebase authentication only

