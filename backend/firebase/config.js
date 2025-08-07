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

  console.log('Firebase Admin SDK initialized (service account file)');
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
