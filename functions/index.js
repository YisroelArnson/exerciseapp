/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin
admin.initializeApp();

const db = getFirestore();

/**
 * Triggered when a new user is created via Firebase Auth
 * Automatically creates a user document in Firestore
 */
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user document with the same structure as your backend
    const userDoc = {
      uid: user.uid,
      schema_version: '1.0',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Write to Firestore
    await db.collection('users').doc(user.uid).set(userDoc);

    console.log(`✅ User document created for ${user.uid}`);
    return { success: true, uid: user.uid };
  } catch (error) {
    console.error('❌ Error in createUserDocument function:', error);
    throw error;
  }
});

//delete user document when user is deleted
exports.deleteUserDocument = functions.auth.user().onDelete(async (user) => {
  await db.collection('users').doc(user.uid).delete();
  console.log(`✅ User document deleted for ${user.uid}`);
  return { success: true, uid: user.uid };
});

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, e.g.
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });
