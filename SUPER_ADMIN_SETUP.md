# Super Admin Setup Guide

**Super Admin Email:** `issakasaddick14@gmail.com`

---

## 🚀 Quick Setup (Using Google Auth)

### Step 1: Enable Google Sign-In in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `campusconnect-pro-61eqk`
3. Click **Authentication** in the left sidebar
4. Click **Sign-in method** tab
5. Find **Google** in the list
6. Click **Enable**
7. Save changes

### Step 2: Sign In with Google

1. Go to http://localhost:9002/login
2. Click "Continue with Google"
3. Select or sign in with: `issakasaddick14@gmail.com`
4. **You're automatically a super admin!** 🎉

The system automatically recognizes `issakasaddick14@gmail.com` and grants super admin privileges on first login.

---

## ✅ Verification

After login, verify super admin access:

1. **Check sidebar** - You should see "Super Admin" menu items
2. **Navigate to** `/super-admin` - Should load successfully
3. **Test features:**
   - View schools list
   - Check analytics dashboard
   - Invite new schools

---

## 🔐 How It Works

The system automatically grants super admin role to these emails:
- `issakasaddick14@gmail.com` ✅
- `superadmin@campusconnect.com`
- `admin@campusconnect.com`

When you sign in with Google using any of these emails:
1. Firebase authenticates you
2. System checks your email against the super admin list
3. Automatically creates/updates your Firestore profile with `role: superadmin`
4. Redirects you to `/dashboard` with full super admin access

**No manual Firestore editing needed!**

---

## 🔐 Super Admin Capabilities

Once promoted to super_admin, you'll have access to:

✅ **Super Admin Dashboard** (`/super-admin`)
- View all schools in the system
- School analytics and statistics
- Revenue tracking and projections

✅ **School Management**
- Create new schools via invitation system
- Lock/unlock school accounts
- View school details and drill-down

✅ **Subscription Management**
- Approve/reject payment submissions
- Manage subscription plans
- Track monthly recurring revenue

✅ **Analytics & Reporting**
- View system-wide analytics
- Revenue by plan breakdown
- Growth metrics and trends

---

## ✅ Verification

After setup, verify super admin access:

1. **Login** with `issakasaddick14@gmail.com`
2. **Check sidebar** - You should see "Super Admin" menu items
3. **Navigate to** `/super-admin` - Should load successfully
4. **Test features:**
   - View schools list
   - Check analytics dashboard
   - Invite new schools

---

## 🐛 Troubleshooting

### Can't find user in Firestore
**Cause:** User account may not have been created in Firestore yet  
**Fix:** 
1. Make sure you signed up successfully
2. Check Firebase Authentication → Users to confirm account exists
3. If user exists in Auth but not Firestore, re-login to trigger profile sync

### Role change not taking effect
**Cause:** Browser cache or stale session  
**Fix:**
1. Log out completely
2. Clear browser cache (Ctrl+Shift+Delete)
3. Log back in with `issakasaddick14@gmail.com`

### "Permission denied" errors
**Cause:** Firestore security rules blocking super_admin role  
**Fix:** Make sure your `firestore.rules` includes:
```javascript
function hasRole(role) {
  return isAuthenticated() && getUserData().role == role;
}

match /schools/{schoolId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if hasRole('super_admin');
}
```

---

## 📋 Firestore Rules for Super Admin

Make sure your `firestore.rules` file includes super admin permissions:

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
    
    function isSuperAdmin() {
      return hasRole('super_admin');
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isSuperAdmin();
      allow delete: if isSuperAdmin();
    }
    
    // Schools collection
    match /schools/{schoolId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin();
      allow update, delete: if isSuperAdmin();
    }
    
    // Subscriptions collection
    match /subscriptions/{subscriptionId} {
      allow read: if isAuthenticated();
      allow update: if isSuperAdmin();
    }
    
    // Invitations collection
    match /invitations/{invitationId} {
      allow read, write: if isSuperAdmin();
    }
  }
}
```

Deploy rules with: `firebase deploy --only firestore:rules`

---

## 🔄 Update Existing User to Super Admin

If the user already exists but needs role update:

**Option 1: Firebase Console (GUI)**
1. Firestore Database → users → find user → edit → change role to `super_admin`

**Option 2: Using gcloud CLI**
```bash
# Update user role
firebase firestore:update users/USER_ID role super_admin
```

**Option 3: Using REST API**
```bash
curl -X PATCH \
  'https://firestore.googleapis.com/v1/projects/campusconnect-pro-61eqk/databases/(default)/documents/users/USER_ID' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -d '{
    "fields": {
      "role": {"stringValue": "super_admin"}
    }
  }'
```

---

## ✨ Summary

**Email:** `issakasaddick14@gmail.com`  
**Role:** `super_admin`  
**Access Level:** Full system access  

**Steps:**
1. ✅ Sign up with the email
2. ✅ Promote to super_admin in Firestore
3. ✅ Log in and test

---

**Last Updated:** October 28, 2025  
**Status:** Ready to create super admin account
