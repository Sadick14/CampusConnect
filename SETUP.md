# CampusConnect Pro - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Local Development Setup](#local-development-setup)
4. [Creating the Super Admin](#creating-the-super-admin)
5. [Firestore Security Rules](#firestore-security-rules)
6. [Storage Rules](#storage-rules)
7. [Testing Your Setup](#testing-your-setup)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- A **Google account** for Firebase
- A **Google AI API key** (for AI features) - Get one at [Google AI Studio](https://aistudio.google.com/app/apikey)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `campusconnect-pro` (or your preferred name)
4. Disable Google Analytics (optional) or configure it
5. Click **"Create project"**

### 2. Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get started"**
3. Enable **"Email/Password"** sign-in method
4. Click **"Save"**

### 3. Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add proper rules later)
4. Select a location closest to your users
5. Click **"Enable"**

### 4. Enable Storage

1. Go to **Build** → **Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Click **"Done"**

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click the **Web** icon (`</>`)
4. Register app: `CampusConnect Pro`
5. Copy the `firebaseConfig` object

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/Sadick14/CampusConnect.git
cd CampusConnect

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase config values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Google AI API Key (for AI report generation)
GOOGLE_GENAI_API_KEY=AIzaSy...

# Application Settings
NEXT_PUBLIC_APP_NAME="CampusConnect Pro"
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:9002](http://localhost:9002)

## Creating the Super Admin

The super admin must be created manually with a custom UID.

### Method 1: Firebase Console (Recommended)

1. Go to **Authentication** in Firebase Console
2. Click **"Add user"**
3. Enter:
   - **Email**: `superadmin@example.com` (or your preferred email)
   - **Password**: Create a strong password
4. Click **"Add user"**
5. Click on the newly created user
6. Click **"User UID"** and click the edit icon
7. Change the UID to: `superadmin`
8. Click **"Save"**

### Method 2: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set the project
firebase use your-project-id

# Create super admin with custom UID (requires Firebase Admin SDK)
# You'll need to create a Node.js script for this
```

**Important**: The application expects the super admin to have UID `superadmin`. The user profile is automatically created in Firestore when they first log in.

## Firestore Security Rules

Replace the default rules with these production-ready rules:

1. Go to **Firestore Database** → **Rules**
2. Replace with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // Helper Functions
    // ============================================
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isSuperAdmin() {
      return isSignedIn() && request.auth.uid == 'superadmin';
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isSchoolAdmin(schoolId) {
      return isSignedIn() && 
             getUserData().role == 'school_admin' &&
             getUserData().schoolId == schoolId;
    }
    
    function isTeacher(schoolId) {
      return isSignedIn() && 
             getUserData().role == 'teacher' &&
             getUserData().schoolId == schoolId;
    }
    
    function belongsToSchool(schoolId) {
      return isSignedIn() && getUserData().schoolId == schoolId;
    }
    
    // ============================================
    // Schools Collection
    // ============================================
    
    match /schools/{schoolId} {
      // Anyone authenticated can read schools (for school selection)
      allow read: if isSignedIn();
      
      // Anyone can create a school (registration)
      allow create: if isSignedIn();
      
      // Only super admin or the school's admin can update
      allow update: if isSuperAdmin() || isSchoolAdmin(schoolId);
      
      // Only super admin can delete schools
      allow delete: if isSuperAdmin();
    }
    
    // ============================================
    // Users Collection
    // ============================================
    
    match /users/{userId} {
      // Users can read their own profile, admins can read all
      allow read: if isSignedIn() && 
                     (request.auth.uid == userId || 
                      isSuperAdmin() || 
                      getUserData().role in ['school_admin', 'teacher']);
      
      // Users can be created during registration/signup
      allow create: if isSignedIn();
      
      // Users can update their own profile, or admins can update any
      allow update: if isSignedIn() && 
                       (request.auth.uid == userId || 
                        isSuperAdmin() ||
                        getUserData().role == 'school_admin');
      
      // Only super admin can delete users
      allow delete: if isSuperAdmin();
    }
    
    // ============================================
    // Students Collection
    // ============================================
    
    match /students/{studentId} {
      // Read: Students can view their own data, teachers/admins in same school can view
      allow read: if isSignedIn() && 
                     (isSuperAdmin() || 
                      (resource.data.schoolId != null && belongsToSchool(resource.data.schoolId)));
      
      // Write: School admins and teachers in same school
      allow create, update: if isSignedIn() && 
                               (isSuperAdmin() || 
                                (request.resource.data.schoolId != null && 
                                 (isSchoolAdmin(request.resource.data.schoolId) || 
                                  isTeacher(request.resource.data.schoolId))));
      
      // Delete: Only super admin and school admin
      allow delete: if isSuperAdmin() || 
                       (resource.data.schoolId != null && isSchoolAdmin(resource.data.schoolId));
    }
    
    // ============================================
    // Attendance Collection
    // ============================================
    
    match /attendance/{recordId} {
      // Read: Students can view their own, teachers/admins in same school
      allow read: if isSignedIn() && 
                     (isSuperAdmin() || 
                      request.auth.uid == resource.data.studentId ||
                      (resource.data.schoolId != null && belongsToSchool(resource.data.schoolId)));
      
      // Write: School admins and teachers
      allow create, update: if isSignedIn() && 
                               (isSuperAdmin() || 
                                (request.resource.data.schoolId != null && 
                                 (isSchoolAdmin(request.resource.data.schoolId) || 
                                  isTeacher(request.resource.data.schoolId))));
      
      // Delete: School admins only
      allow delete: if isSuperAdmin() || 
                       (resource.data.schoolId != null && isSchoolAdmin(resource.data.schoolId));
    }
    
    // ============================================
    // Grades Collection
    // ============================================
    
    match /grades/{gradeId} {
      // Read: Students can view their own grades, teachers/admins in school
      allow read: if isSignedIn() && 
                     (isSuperAdmin() || 
                      request.auth.uid == resource.data.studentId ||
                      (resource.data.schoolId != null && belongsToSchool(resource.data.schoolId)));
      
      // Write: School admins and teachers
      allow create, update: if isSignedIn() && 
                               (isSuperAdmin() || 
                                (request.resource.data.schoolId != null && 
                                 (isSchoolAdmin(request.resource.data.schoolId) || 
                                  isTeacher(request.resource.data.schoolId))));
      
      // Delete: School admins only
      allow delete: if isSuperAdmin() || 
                       (resource.data.schoolId != null && isSchoolAdmin(resource.data.schoolId));
    }
    
    // ============================================
    // Staff Collection
    // ============================================
    
    match /staff/{staffId} {
      allow read: if isSignedIn() && 
                     (isSuperAdmin() || 
                      (resource.data.schoolId != null && belongsToSchool(resource.data.schoolId)));
      
      allow write: if isSuperAdmin() || 
                      (request.resource.data.schoolId != null && 
                       isSchoolAdmin(request.resource.data.schoolId));
      
      allow delete: if isSuperAdmin() || 
                       (resource.data.schoolId != null && isSchoolAdmin(resource.data.schoolId));
    }
    
    // ============================================
    // Fees Collection
    // ============================================
    
    match /fees/{feeId} {
      allow read: if isSignedIn() && 
                     (isSuperAdmin() || 
                      request.auth.uid == resource.data.studentId ||
                      (resource.data.schoolId != null && belongsToSchool(resource.data.schoolId)));
      
      allow write: if isSuperAdmin() || 
                      (request.resource.data.schoolId != null && 
                       isSchoolAdmin(request.resource.data.schoolId));
      
      allow delete: if isSuperAdmin() || 
                       (resource.data.schoolId != null && isSchoolAdmin(resource.data.schoolId));
    }
    
    // ============================================
    // Expenditure Collection
    // ============================================
    
    match /expenditure/{expenseId} {
      allow read: if isSignedIn() && 
                     (isSuperAdmin() || 
                      (resource.data.schoolId != null && 
                       (isSchoolAdmin(resource.data.schoolId) || isTeacher(resource.data.schoolId))));
      
      allow write: if isSuperAdmin() || 
                      (request.resource.data.schoolId != null && 
                       isSchoolAdmin(request.resource.data.schoolId));
      
      allow delete: if isSuperAdmin() || 
                       (resource.data.schoolId != null && isSchoolAdmin(resource.data.schoolId));
    }
    
    // ============================================
    // Timetables Collection
    // ============================================
    
    match /timetables/{timetableId} {
      allow read: if isSignedIn() && 
                     (isSuperAdmin() || 
                      (resource.data.schoolId != null && belongsToSchool(resource.data.schoolId)));
      
      allow write: if isSuperAdmin() || 
                      (request.resource.data.schoolId != null && 
                       (isSchoolAdmin(request.resource.data.schoolId) || 
                        isTeacher(request.resource.data.schoolId)));
      
      allow delete: if isSuperAdmin() || 
                       (resource.data.schoolId != null && isSchoolAdmin(resource.data.schoolId));
    }
  }
}
```

3. Click **"Publish"**

## Storage Rules

Set up Firebase Storage rules for school logos:

1. Go to **Storage** → **Rules**
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // School logos - only school admins can upload/delete
    match /school-logos/{schoolId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
                      request.resource.size < 5 * 1024 * 1024 && // Max 5MB
                      request.resource.contentType.matches('image/.*');
      allow delete: if isSignedIn();
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

## Testing Your Setup

### 1. Start the Application

```bash
npm run dev
```

### 2. Test Super Admin Login

1. Navigate to [http://localhost:9002/login](http://localhost:9002/login)
2. Log in with your super admin credentials
3. You should see the dashboard with all modules

### 3. Register a Test School

1. Navigate to **Schools** → **Register School**
2. Fill in the form:
   - School Name
   - Admin Email (different from super admin)
   - Admin Password
3. Click **"Register School"**
4. A new school and school admin user should be created

### 4. Test School Admin Login

1. Log out from super admin
2. Log in with the new school admin credentials
3. You should see a limited dashboard (no Schools module)

### 5. Add Test Students

1. Navigate to **Students**
2. Fill in the student form
3. Click **"Add Student"**
4. The student should appear in the table

## Troubleshooting

### Firebase Connection Issues

**Problem**: "Firebase config is incomplete" error

**Solution**: 
- Verify all environment variables in `.env.local`
- Ensure variables start with `NEXT_PUBLIC_`
- Restart the development server

### Authentication Issues

**Problem**: Can't create super admin with custom UID

**Solution**:
- Use Firebase Console method (easiest)
- Ensure UID is exactly `superadmin` (lowercase, no spaces)

### Firestore Permission Denied

**Problem**: "Missing or insufficient permissions" error

**Solution**:
- Check Firestore rules are published
- Verify user profile exists in `users` collection
- Check user has correct `role` and `schoolId` fields

### Storage Upload Fails

**Problem**: Can't upload school logo

**Solution**:
- Verify Storage is enabled in Firebase Console
- Check Storage rules are published
- Ensure file is under 5MB and is an image

### Data Not Appearing

**Problem**: Created data doesn't show up

**Solution**:
- Check browser console for errors
- Verify Firestore indexes are created (Firebase will prompt)
- Check network tab for failed requests

## Next Steps

After setup is complete:

1. ✅ Customize the application colors in `tailwind.config.ts`
2. ✅ Add your school's branding
3. ✅ Configure AI report generation with your Google AI API key
4. ✅ Set up email notifications (optional)
5. ✅ Deploy to production (Vercel/Firebase Hosting)

## Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/Sadick14/CampusConnect/issues)
2. Review Firebase documentation
3. Open a new issue with details

---

**Happy School Managing! 🎓**
