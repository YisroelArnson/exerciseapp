/**
 * Test script to:
 * 1. Create a new user in the Firebase Auth emulator.
 * 2. Create a Firestore measurements document for that user.
 * 3. Fetch the most recent measurement doc via the backend API, authenticating as the user (simulating frontend).
 * 
 * Run with: node backend/testing/test-auth.js
 */

const { getAuth, getFirestore } = require('../firebase/config');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Helper to generate random user data
function generateTestUser() {
  const uid = uuidv4();
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Test1234!';
  return { uid, email, password };
}

// Helper to generate random measurement data
function generateMeasurement() {
  return {
    sex: Math.random() > 0.5 ? 'male' : 'female',
    dob: new Date(Date.now() - Math.floor(Math.random() * 30 * 365 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10), // random DOB in last 30 years
    height_cm: Math.floor(Math.random() * 50) + 150, // 150-200cm
    weight_kg: Math.floor(Math.random() * 50) + 50,  // 50-100kg
    body_fat_pct: Math.round((Math.random() * 20 + 10) * 10) / 10 // 10-30%
  };
}

async function createUserWithEmulator(email, password) {
  // Use Auth emulator REST API
  const url = 'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ? data.error.message : 'Unknown error');
  }
  return data; // contains localId (uid), idToken, etc.
}

async function loginUserWithEmulator(email, password) {
  // Use Auth emulator REST API for signInWithPassword
  const url = 'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ? data.error.message : 'Unknown error');
  }
  return data; // contains idToken, localId, etc.
}

// Simulate a frontend request to fetch the most recent measurement for the user
async function fetchMostRecentMeasurement(idToken) {
  // This endpoint should exist in your backend, e.g. /api/measurements/recent or similar
  // For this example, let's assume you have /api/users/me/measurements/recent
  // If not, adjust the endpoint accordingly.
  const url = 'http://localhost:3000/api/users/me/measurements/recent';
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ? data.error : 'Unknown error');
  }
  return data;
}

async function main() {
  try {
    // 1. Generate user data and create user in Auth emulator
    const user = generateTestUser();
    console.log('Creating user in Auth emulator:', user.email);
    const authRes = await createUserWithEmulator(user.email, user.password);
    const uid = authRes.localId;
    console.log('User created with UID:', uid);

    // 2. Create a measurement document for this user in Firestore emulator
    const db = getFirestore();
    const measurement = generateMeasurement();
    const tsId = new Date().toISOString().replace(/[:.]/g, '-');
    const docRef = db.collection('users').doc(uid).collection('measurements').doc(tsId);

    await docRef.set({
      ...measurement,
      createdAt: new Date()
    });

    console.log('Measurement document created for user:', {
      uid,
      measurementId: tsId,
      ...measurement
    });

    // 3. Optionally, fetch and print the measurement back directly from Firestore
    const snap = await docRef.get();
    if (snap.exists) {
      console.log('Fetched measurement from Firestore:', snap.data());
    } else {
      console.error('Failed to fetch measurement document');
    }

    // 4. Simulate frontend: login to get idToken, then fetch most recent measurement via backend API
    const loginRes = await loginUserWithEmulator(user.email, user.password);
    const idToken = loginRes.idToken;
    console.log('Obtained idToken for user:', user.email);

    // Fetch most recent measurement via backend API (auth required)
    try {
      const recentMeasurement = await fetchMostRecentMeasurement(idToken);
      console.log('Fetched most recent measurement via backend API:', recentMeasurement);
    } catch (apiErr) {
      console.error('Failed to fetch most recent measurement via backend API:', apiErr.message);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

if (require.main === module) {
  main();
}
