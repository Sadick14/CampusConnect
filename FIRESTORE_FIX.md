# 🔧 Firestore Collection Fix

## ❌ Issue

Users were only being created in **Firebase Authentication** but NOT in the **Firestore `users` collection**.

### Root Causes

1. **Firestore Rules** - Circular dependency preventing user creation
2. **Server/Client Mismatch** - Service using server-side Firestore from client context

---

## ✅ Solutions Applied

### 1. Fixed Firestore Rules

**Problem:** Rules required user to be `school_admin` to create a profile, but new users don't have a profile yet.

**Old Rule:**
```javascript
match /users/{userId} {
  allow create: if isSchoolAdmin(); // ❌ Circular dependency!
}
```

**New Rule:**
```javascript
match /users/{userId} {
  allow create: if isSignedIn() && userId == request.auth.uid; // ✅ Users can create own profile
}
```

### 2. Switched to Client-Side Firestore

**Changed:** `src/services/user.ts`

**Before:**
```typescript
'use server';
import { getDb } from '@/lib/firebase-server';
```

**After:**
```typescript
import { getDb } from '@/lib/firebase'; // Client-side
```

### 3. Added Detailed Error Logging

Now you'll see exactly what's failing in the browser console:
- ✅ Success: `[User Service] ✅ Successfully created user profile`
- ❌ Failure: `[User Service] ❌ Failed to create user document: [error details]`

---

## 🚨 **ACTION REQUIRED: Deploy Firestore Rules**

### Option 1: Manual Deployment (5 minutes)

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/campusconnect-pro-61eqk/firestore/rules
   ```

2. **Copy the rules from:**
   ```
   /workspaces/CampusConnect/firestore.rules
   ```

3. **Paste into the Firebase Console editor**

4. **Click "Publish"**

5. **Wait for deployment** (~30 seconds)

### Option 2: Using Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 🧪 Testing After Deployment

### 1. Clear Browser Data (Important!)
```
1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear Site Data
4. Close and reopen browser
```

### 2. Test Login

1. Go to: http://opulent-space-goldfish-9vrr6r76997fxqrr-9002.app.github.dev:9002/login
2. Open browser console (F12 → Console tab)
3. Click "Continue with Google"
4. Sign in with `issakasaddick14@gmail.com`

### 3. Check Console Logs

**Success looks like:**
```
[User Service - Firestore] Syncing profile for UID: abc123...
[User Service] Creating new user profile
[User Service] Attempting to create Firestore document...
[User Service] ✅ Successfully created user profile with role: superadmin
[AuthContext] Profile fetched/synced: {email: "issakasaddick14@gmail.com", role: "superadmin", ...}
```

**Permission error looks like:**
```
[User Service] ❌ Failed to create user document: FirebaseError: Missing or insufficient permissions
[User Service] Error code: permission-denied
```
👉 **If you see this, the rules haven't been deployed yet!**

### 4. Verify in Firestore Console

1. Go to: https://console.firebase.google.com/project/campusconnect-pro-61eqk/firestore
2. Look for `users` collection
3. Find document with your UID
4. Should contain:
   ```
   {
     id: "your-uid",
     email: "issakasaddick14@gmail.com",
     name: "Your Name",
     photoURL: "https://...",
     role: "superadmin",
     schoolId: null,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

---

## 🐛 Troubleshooting

### Still no collection created?

**Check 1: Are the rules deployed?**
```
Go to: https://console.firebase.google.com/project/campusconnect-pro-61eqk/firestore/rules
Look for: allow create: if isSignedIn() && userId == request.auth.uid;
```

**Check 2: Look at browser console**
```
Press F12 → Console tab
Look for error messages with ❌
```

**Check 3: Google Sign-In enabled?**
```
Go to: https://console.firebase.google.com/project/campusconnect-pro-61eqk/authentication/providers
Google should be "Enabled"
```

**Check 4: Authorized domains added?**
```
Go to: https://console.firebase.google.com/project/campusconnect-pro-61eqk/authentication/settings
Should see your Codespace domain in authorized list
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `permission-denied` | Rules not deployed | Deploy firestore.rules to Firebase |
| `Missing or insufficient permissions` | Old rules still active | Clear cache, wait 60s, retry |
| `auth/popup-closed-by-user` | Closed Google popup | Try again, complete sign-in |
| `auth/unauthorized-domain` | Domain not authorized | Add domain in Firebase Console |

---

## 📋 Files Modified

| File | Change | Status |
|------|--------|--------|
| `firestore.rules` | Allow users to create own profile | ✅ Updated |
| `src/services/user.ts` | Use client-side Firestore + better logging | ✅ Updated |
| `scripts/deploy-firestore-rules.sh` | Deployment helper script | ✅ Created |

---

## ⚡ Quick Summary

**What was wrong:**
1. ❌ Firestore rules blocked new user creation (circular dependency)
2. ❌ Service was using server-side Firestore from client

**What was fixed:**
1. ✅ Updated rules to allow users to create their own profile
2. ✅ Switched to client-side Firestore
3. ✅ Added detailed error logging

**What you need to do:**
1. ⚠️ **Deploy firestore.rules to Firebase Console** (REQUIRED!)
2. ⚠️ Test login with issakasaddick14@gmail.com
3. ⚠️ Check browser console for success/error messages
4. ⚠️ Verify user appears in Firestore

---

**Status:** ✅ Code fixed, ⚠️ Awaiting rules deployment  
**Next Step:** Deploy firestore.rules to Firebase Console  
**ETA:** 5 minutes


