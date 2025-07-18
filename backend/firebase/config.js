const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseApp;

const initializeFirebase = () => {
    if (!firebaseApp) {
        try {
            // For production: Use service account key file
            if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id,
                    databaseURL: process.env.FIREBASE_DATABASE_URL
                });
            }
            // For development: Use service account key file
            else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
                // Resolve path relative to the backend directory (parent of firebase directory)
                const backendDir = path.dirname(__dirname);
                const serviceAccountPath = path.resolve(backendDir, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

                console.log('🔍 Looking for service account file at:', serviceAccountPath);

                if (!fs.existsSync(serviceAccountPath)) {
                    throw new Error(`Service account file not found at: ${serviceAccountPath}`);
                }

                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                console.log('✅ Service account loaded successfully for project:', serviceAccount.project_id);

                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id,
                    databaseURL: process.env.FIREBASE_DATABASE_URL
                });
            }
            // Fallback: Use default credentials (when deployed to Firebase Functions)
            else {
                console.log('⚠️ Using default credentials (fallback mode)');
                firebaseApp = admin.initializeApp({
                    projectId: 'exerciseapp-b4f9d' // Fallback project ID
                });
            }

            console.log('🔥 Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Firebase:', error);
            throw error;
        }
    }
    return firebaseApp;
};

// Get Firebase services
const getAuth = () => {
    const app = initializeFirebase();
    return admin.auth(app);
};

const getFirestore = () => {
    const app = initializeFirebase();
    return admin.firestore(app);
};

module.exports = {
    initializeFirebase,
    getAuth,
    getFirestore,
    admin
}; 