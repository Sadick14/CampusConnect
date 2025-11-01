/**
 * Script to promote a user to super_admin role
 * 
 * Usage:
 *   node scripts/promote-to-super-admin.js <email>
 * 
 * Example:
 *   node scripts/promote-to-super-admin.js issakasaddick14@gmail.com
 * 
 * Requirements:
 *   - Firebase Admin SDK installed: npm install firebase-admin
 *   - Service account key JSON file
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Get email from command line argument
const targetEmail = process.argv[2] || 'issakasaddick14@gmail.com';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Service account initialization
// You can download this from Firebase Console > Project Settings > Service Accounts
// NOTE: Keep this file secure and never commit it to version control
let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

async function initializeFirebase() {
  try {
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'campusconnect-pro-61eqk'
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.log('\n📝 To use this script:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate New Private Key"');
    console.log('3. Save the JSON file as "firebase-service-account.json" in the project root');
    console.log('4. Run this script again\n');
    return false;
  }
}

async function promoteToSuperAdmin(email) {
  const db = admin.firestore();
  
  try {
    console.log(`\n🔍 Looking up user: ${email}...`);
    
    // Get user from Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`✅ Found user in Firebase Auth`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Email Verified: ${userRecord.emailVerified}`);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        console.error(`❌ User not found in Firebase Authentication`);
        console.log(`\n📝 The user needs to sign up first:`);
        console.log(`   1. Go to http://localhost:9002/signup`);
        console.log(`   2. Sign up with email: ${email}`);
        console.log(`   3. Run this script again\n`);
        return false;
      }
      throw authError;
    }
    
    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      console.log(`⚠️  User not found in Firestore, creating profile...`);
      
      // Create user profile
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || 'Super Admin',
        role: 'super_admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Created user profile with super_admin role`);
    } else {
      const userData = userDoc.data();
      console.log(`\n📋 Current user data:`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Name: ${userData.name}`);
      
      if (userData.role === 'super_admin') {
        console.log(`\n✅ User is already a super_admin!`);
        return true;
      }
      
      // Ask for confirmation
      const answer = await new Promise((resolve) => {
        rl.question(`\n❓ Promote ${email} to super_admin? (yes/no): `, resolve);
      });
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        return false;
      }
      
      // Update role to super_admin
      await db.collection('users').doc(userRecord.uid).update({
        role: 'super_admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`\n✅ Successfully promoted ${email} to super_admin!`);
    }
    
    console.log(`\n🎉 Setup complete!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Log in with: ${email}`);
    console.log(`   2. Navigate to: http://localhost:9002/super-admin`);
    console.log(`   3. Verify super admin access\n`);
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ Error promoting user:`, error);
    return false;
  }
}

async function main() {
  console.log('🔐 Super Admin Promotion Tool');
  console.log('================================\n');
  
  // Initialize Firebase Admin
  const initialized = await initializeFirebase();
  if (!initialized) {
    process.exit(1);
  }
  
  // Promote user
  const success = await promoteToSuperAdmin(targetEmail);
  
  rl.close();
  process.exit(success ? 0 : 1);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
