const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountPath = path.resolve(__dirname, 'FIREBASE_SERVICE_ACCOUNT.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found at: ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

    // Connect to emulators if in development
    if (process.env.NODE_ENV !== 'production') {
      if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      }
      console.log(`🔧 Using Firebase Auth Emulator on ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

      if (!process.env.FIRESTORE_EMULATOR_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      }
      console.log(`🔧 Using Firestore Emulator on ${process.env.FIRESTORE_EMULATOR_HOST}`);
      
      if (!process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST) {
        process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';
      }
      console.log(`🔧 Using Firebase Functions Emulator on ${process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST}`);
    }

  console.log('Firebase Admin SDK initialized');
  return admin.app();
}

function getAuth() {
  const app = initializeFirebase();
  return admin.auth(app);
}

function getFirestore() {
  const app = initializeFirebase();
  return admin.firestore(app);
}

module.exports = { initializeFirebase, getAuth, getFirestore, admin };
