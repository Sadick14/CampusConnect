# Firestore Security Rules Deployment

## Current Status
🚨 **CRITICAL**: Firestore security rules are NOT deployed. All database operations will fail with "permission-denied" errors until rules are deployed.

## Error You're Seeing
```
Error initializing superadmin: [Error [FirebaseError]: Missing or insufficient permissions.]
  code: 'permission-denied'
```

## Quick Fix - Deploy Security Rules

### Step 1: Go to Firebase Console
Open: https://console.firebase.google.com/project/campusconnect-pro-61eqk/firestore/rules

### Step 2: Copy These Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
             request.auth.token.email in [
               'issakasaddick14@gmail.com',
               'superadmin@campusconnect.com',
               'superadmin@example.com', 
               'admin@campusconnect.com'
             ];
    }
    
    function isSchoolAdmin(schoolId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'school_admin' &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.schoolId == schoolId;
    }
    
    function isTeacher(schoolId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.schoolId == schoolId;
    }
    
    function belongsToSchool(schoolId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.schoolId == schoolId;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users Collection
    match /users/{userId} {
      // Anyone authenticated can read their own profile
      allow read: if isOwner(userId);
      
      // Users can update their own basic profile
      allow update: if isOwner(userId) && 
                      !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'schoolId']);
      
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School admins can read/write users in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           isSchoolAdmin(resource.data.schoolId);
      
      // Teachers can read users in their school
      allow read: if isAuthenticated() && 
                    resource.data.schoolId != null &&
                    isTeacher(resource.data.schoolId);
      
      // Allow profile creation during signup
      allow create: if isOwner(userId);
    }

    // Schools Collection
    match /schools/{schoolId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School admin can read/update their own school
      allow read, update: if isSchoolAdmin(schoolId);
      
      // Users in the school can read school data
      allow read: if belongsToSchool(schoolId);
      
      // Allow school creation during registration
      allow create: if isAuthenticated();
    }

    // Students Collection
    match /students/{studentId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School staff can manage students in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           (isSchoolAdmin(resource.data.schoolId) || isTeacher(resource.data.schoolId));
      
      // Students can read their own data
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Allow student creation by school staff
      allow create: if isAuthenticated();
    }

    // Attendance Collection
    match /attendance/{attendanceId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School staff can manage attendance in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           (isSchoolAdmin(resource.data.schoolId) || isTeacher(resource.data.schoolId));
      
      // Students can read their own attendance
      allow read: if isAuthenticated() && resource.data.studentId == request.auth.uid;
      
      // Allow attendance creation by teachers
      allow create: if isAuthenticated();
    }

    // Grades Collection
    match /grades/{gradeId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School staff can manage grades in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           (isSchoolAdmin(resource.data.schoolId) || isTeacher(resource.data.schoolId));
      
      // Students can read their own grades
      allow read: if isAuthenticated() && resource.data.studentId == request.auth.uid;
      
      // Allow grade creation by teachers
      allow create: if isAuthenticated();
    }

    // Fees Collection
    match /fees/{feeId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School staff can manage fees in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           (isSchoolAdmin(resource.data.schoolId) || isTeacher(resource.data.schoolId));
      
      // Students can read their own fees
      allow read: if isAuthenticated() && resource.data.studentId == request.auth.uid;
      
      // Allow fee creation by school admins
      allow create: if isAuthenticated();
    }

    // Expenditures Collection
    match /expenditures/{expenditureId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School admins can manage expenditures in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           isSchoolAdmin(resource.data.schoolId);
      
      // Teachers can read expenditures in their school
      allow read: if isAuthenticated() && 
                    resource.data.schoolId != null &&
                    isTeacher(resource.data.schoolId);
      
      // Allow expenditure creation by school admins
      allow create: if isAuthenticated();
    }

    // Staff Collection
    match /staff/{staffId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School admins can manage staff in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           isSchoolAdmin(resource.data.schoolId);
      
      // Staff members can read their own data
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Allow staff creation by school admins
      allow create: if isAuthenticated();
    }

    // Timetables Collection
    match /timetables/{timetableId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School staff can manage timetables in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           (isSchoolAdmin(resource.data.schoolId) || isTeacher(resource.data.schoolId));
      
      // Students can read timetables for their class
      allow read: if isAuthenticated() && belongsToSchool(resource.data.schoolId);
      
      // Allow timetable creation by school staff
      allow create: if isAuthenticated();
    }

    // Notifications Collection
    match /notifications/{notificationId} {
      // Superadmin can do anything
      allow read, write: if isSuperAdmin();
      
      // School staff can manage notifications in their school
      allow read, write: if isAuthenticated() && 
                           resource.data.schoolId != null &&
                           (isSchoolAdmin(resource.data.schoolId) || isTeacher(resource.data.schoolId));
      
      // Users can read notifications for their school
      allow read: if isAuthenticated() && belongsToSchool(resource.data.schoolId);
      
      // Allow notification creation by school staff
      allow create: if isAuthenticated();
    }
  }
}
```

### Step 3: Click "Publish"

### Step 4: Create Superadmin User
1. Go to: https://console.firebase.google.com/project/campusconnect-pro-61eqk/authentication/users
2. Click "Add user"
3. **IMPORTANT**: Use one of these EXACT emails:
   - Email: `superadmin@campusconnect.com` (recommended)
   - OR: `superadmin@example.com`
   - OR: `admin@campusconnect.com`
   - Password: (choose a secure password - minimum 6 characters)
4. Click "Add user"
5. **Note**: Firebase will auto-generate the UID - that's normal and expected!

### Step 5: Test Superadmin Login
1. Go to http://localhost:9002/login
2. Login with:
   - Email: `superadmin@campusconnect.com` (or whichever email you used)
   - Password: (the password you set in Step 4)
3. You should now have full access to the system as superadmin
4. Your role will automatically be set to 'superadmin' upon first login

### Step 6: Test Regular Signup
1. Try signing up with `issakasaddick14@gmail.com` again
2. This should now work properly and persist to Firestore

## What Changed?
✅ All services now use Firestore (no more in-memory database)
✅ user.ts - 7 functions migrated to Firestore
✅ school.ts - 4 functions migrated to Firestore
✅ student.ts, attendance.ts, grade.ts - Already using Firestore
✅ Server running without "TEMPORARY In-Memory Database" warnings

## Next Steps After Rules Deployment
1. Test superadmin login
2. Test school registration
3. Test student creation
4. Test attendance marking
5. Test grade entry
