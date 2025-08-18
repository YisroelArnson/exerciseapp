'use strict';

const admin = require('firebase-admin');

// Ensure we target the local emulators by default
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'exerciseapp-b4f9d';

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const auth = admin.auth();

function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgo(numDays) {
  const d = new Date();
  d.setDate(d.getDate() - numDays);
  return d;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildMuscleActivation(groups) {
  const selected = groups.sort(() => 0.5 - Math.random()).slice(0, 3);
  // Create weights that sum to 1
  const weights = [Math.random(), Math.random(), Math.random()];
  const total = weights.reduce((a, b) => a + b, 0);
  return selected.map((id, idx) => ({
    id,
    share: Math.round((weights[idx] / total) * 100) / 100,
    confidence_0to1: Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
  }));
}

async function waitForUserDoc(uid, timeoutMs = 15000) {
  const start = Date.now();
  const userRef = db.collection('users').doc(uid);
  while (Date.now() - start < timeoutMs) {
    const snap = await userRef.get();
    if (snap.exists) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for Firestore user document for uid=${uid}. Ensure the Functions emulator is running.`);
}

async function seedUser(uid) {
  const userRef = db.collection('users').doc(uid);

  // 1) User root is created by Cloud Function on Auth user creation.
  // Wait until it exists to attach subcollections beneath it.
  await waitForUserDoc(uid);

  // 1a) Measurements time series (and latest acts as current snapshot)
  const measurements = [
    { sex: 'male', dob: '1992-07-14', height_cm: 178, weight_kg: 78.2, body_fat_pct: 19.5 },
    { sex: 'male', dob: '1992-07-14', height_cm: 178, weight_kg: 77.5, body_fat_pct: 19.0 },
    { sex: 'male', dob: '1992-07-14', height_cm: 178, weight_kg: 76.9, body_fat_pct: 18.7 },
    { sex: 'male', dob: '1992-07-14', height_cm: 178, weight_kg: 76.4, body_fat_pct: 18.5 },
  ];
  for (let i = 0; i < measurements.length; i++) {
    const ts = daysAgo((measurements.length - i) * 7);
    const tsId = `${ts.getTime()}`;
    await userRef.collection('measurements').doc(tsId).set({
      ...measurements[i],
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // Add an explicit current snapshot example matching requested values
  const nowTsId = `${Date.now()}`;
  await userRef.collection('measurements').doc(nowTsId).set({
    sex: 'male',
    dob: '1992-07-14',
    height_cm: 178,
    weight_kg: 76.0,
    body_fat_pct: 18.5,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 2) Goals
  const categoryWeights = [
    // Match requested example shape; use label string "Strength"
    { category: 'Strength', weight: 0.25 },
  ];
  const muscleGroups = [
    'abs', 'back', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings', 'quadriceps', 'shoulders', 'triceps', 'lower_back', 'upper_back'
  ];
  const perGroupWeight = Math.round((1 / muscleGroups.length) * 10000) / 10000;
  await userRef.collection('goals').doc('current').set({
    categories_and_weights: categoryWeights,
    muscle_groups_and_weights: muscleGroups.map((g) => ({ group: g, weight: perGroupWeight })),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 3) Category catalog & preferences
  const categoriesCatalog = [
    { id: 'strength', label: 'Strength', units: 'sets', description: 'Lifting-focused work', enabled: true, source: 'preset' },
    { id: 'zone2', label: 'Zone 2 Cardio', units: 'min', description: 'Steady-state aerobic work', enabled: true, source: 'preset' },
    { id: 'yoga', label: 'Yoga / Mobility', units: 'min', description: 'Flexibility and mobility work', enabled: true, source: 'preset' },
  ];
  for (const cat of categoriesCatalog) {
    await userRef.collection('categoryCatalog').doc(cat.id).set({
      ...cat,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await userRef.collection('categoryPreferences').doc('current').set({
    selected_preset_id: null,
    weekly_pools: { min: 210, sets: 24 },
    weights: { strength: 0.4, zone2: 0.35, yoga: 0.25 },
    allow_custom_categories: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 4) Workout history: explicit example session + randomized sessions
  // 4a) Explicit example session
  const exampleSessionDate = new Date();
  const exampleSessionId = `example_session_${formatYMD(exampleSessionDate)}`;
  await userRef.collection('sessions').doc(exampleSessionId).set({
    date: admin.firestore.Timestamp.fromDate(exampleSessionDate),
    location: 'home',
    duration_min: 38,
    mode: 'guided',
    createdAt: FieldValue.serverTimestamp(),
  });
  await userRef.collection('sessions').doc(exampleSessionId).collection('exercises').doc('ex_1_bb_back_squat').set({
    exercise_id: 'bb_back_squat',
    name_original: 'Back Squat (barbell)',
    sets: 4,
    reps: [8, 8, 6, 6],
    duration_min: 0,
    load_kg_each: [100, 105, 110, 110],
    muscle_groups_activated: [
      { id: 'quadriceps', share: 0.5, confidence_0to1: 0.92 },
      { id: 'glutes', share: 0.3, confidence_0to1: 0.9 },
      { id: 'lower_back', share: 0.2, confidence_0to1: 0.85 },
    ],
    category_tags: [
      { id: 'strength', share: 1.0, confidence_0to1: 0.95 },
    ],
    muscle_ids: ['quadriceps', 'glutes', 'lower_back'],
    category_tag_ids: ['strength'],
    date: admin.firestore.Timestamp.fromDate(exampleSessionDate),
    createdAt: FieldValue.serverTimestamp(),
  });

  // 4b) Randomized sessions: create 12 sessions with 3 exercises each = 36 exercises
  const exerciseLibrary = [
    { id: 'bb_back_squat', name: 'Back Squat (barbell)', defaultLoad: 100, category: 'strength' },
    { id: 'db_bench_press', name: 'Bench Press (dumbbell)', defaultLoad: 30, category: 'strength' },
    { id: 'bb_deadlift', name: 'Deadlift (barbell)', defaultLoad: 120, category: 'strength' },
    { id: 'pull_up', name: 'Pull-Up (bodyweight)', defaultLoad: 0, category: 'strength' },
    { id: 'oh_press', name: 'Overhead Press (barbell)', defaultLoad: 45, category: 'strength' },
    { id: 'rower_zone2', name: 'Rowing (ergometer) - Zone 2', defaultLoad: 0, category: 'zone2' },
    { id: 'treadmill_zone2', name: 'Treadmill Walk - Zone 2', defaultLoad: 0, category: 'zone2' },
    { id: 'yoga_flow', name: 'Yoga Flow', defaultLoad: 0, category: 'yoga' },
  ];
  const locations = ['home', 'gym', 'park'];
  const musclesUniverse = ['quadriceps', 'glutes', 'lower_back', 'hamstrings', 'calves', 'chest', 'shoulders', 'upper_back', 'biceps', 'triceps', 'abs'];

  for (let s = 0; s < 12; s++) {
    const sessionDate = daysAgo(2 * s + 1);
    const sessionId = `session_${formatYMD(sessionDate)}_${s + 1}`;
    await userRef.collection('sessions').doc(sessionId).set({
      date: admin.firestore.Timestamp.fromDate(sessionDate),
      location: randomChoice(locations),
      duration_min: 30 + Math.floor(Math.random() * 40),
      mode: Math.random() > 0.5 ? 'guided' : 'free',
      createdAt: FieldValue.serverTimestamp(),
    });

    const chosenExercises = exerciseLibrary.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (let e = 0; e < chosenExercises.length; e++) {
      const ex = chosenExercises[e];
      const sets = 3 + Math.floor(Math.random() * 2);
      const reps = Array.from({ length: sets }, () => (ex.category === 'zone2' || ex.category === 'yoga') ? 0 : 6 + Math.floor(Math.random() * 5));
      const duration = (ex.category === 'zone2' || ex.category === 'yoga') ? 10 + Math.floor(Math.random() * 25) : 0;
      const loadEach = Array.from({ length: sets }, (_, i) => (ex.category === 'strength') ? ex.defaultLoad + i * 2.5 : 0);
      const muscleActivation = buildMuscleActivation(musclesUniverse);
      const categoryTag = { id: ex.category, share: 1.0, confidence_0to1: 0.95 };

      const exerciseId = `ex_${e + 1}_${ex.id}`;
      await userRef.collection('sessions').doc(sessionId).collection('exercises').doc(exerciseId).set({
        exercise_id: ex.id,
        name_original: ex.name,
        sets,
        reps,
        duration_min: duration,
        load_kg_each: loadEach,
        muscle_groups_activated: muscleActivation,
        category_tags: [categoryTag],
        muscle_ids: muscleActivation.map((m) => m.id),
        category_tag_ids: [ex.category],
        date: admin.firestore.Timestamp.fromDate(sessionDate),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // 5) Activity maps (7-day windows for the last two weeks)
  for (let w = 0; w < 2; w++) {
    const end = daysAgo(w * 7);
    const start = daysAgo(w * 7 + 6);
    const key = `${formatYMD(start)}__7d`;
    await userRef.collection('activityCategory').doc(key).set({
      date_range: { start: formatYMD(start), end: formatYMD(end), window_days: 7 },
      categories: [
        { id: 'strength', units: 'sets', actual: 18 + w, target: 12, score_pct: 150, last_done: formatYMD(end), status: 'over' },
        { id: 'zone2', units: 'min', actual: 120 + w * 10, target: 150, score_pct: 80, last_done: formatYMD(end), status: 'under' },
        { id: 'yoga', units: 'min', actual: 45 + w * 10, target: 60, score_pct: 75, last_done: formatYMD(end), status: 'under' },
      ],
      summary: {
        last_updated: new Date().toISOString(),
        bias_signal: { zone2: 0.22, strength: -0.12 },
        most_underworked: ['zone2', 'yoga'],
        most_worked: ['strength'],
      },
    });

    await userRef.collection('activityMuscle').doc(key).set({
      schema_version: '1.0',
      date_range: { start: formatYMD(start), end: formatYMD(end), window_days: 7 },
      scoring: { unit: 'score_pct', target_hard_sets_per_group: 10, method: 'hard_sets_weighted' },
      groups: muscleGroups.map((g) => ({ id: g, name: g.charAt(0).toUpperCase() + g.slice(1).replace('_', ' '), score_pct: Math.floor(Math.random() * 120), hard_sets: Math.floor(Math.random() * 12), last_trained: formatYMD(end), status: Math.random() > 0.5 ? 'under' : 'over' })),
      summary: { last_updated: new Date().toISOString(), most_underworked_top3: [], most_worked_top3: [] },
    });
  }

  // 6) Locations
  const locationsDocs = [
    { id: 'home', name: 'Home', latitude: 37.7749, longitude: -122.4194, available_equipment: ['adjustable_dumbbells_5-50lb', 'pullup_bar', 'yoga_mat'], description: 'Garage gym' },
    { id: 'gym', name: 'Local Gym', latitude: 37.78, longitude: -122.42, available_equipment: ['barbells', 'plates', 'cable_machine', 'rower'], description: 'Commercial gym' },
  ];
  for (const loc of locationsDocs) {
    await userRef.collection('locations').doc(loc.id).set({
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      available_equipment: loc.available_equipment,
      description: loc.description,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // 7) Preferences
  await userRef.collection('preferencesPermanent').doc('avoid_burpees').set({
    type: 'exercise_dislike',
    name: 'burpees',
    condition_preference: 'Avoid burpees in recommendations',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await userRef.collection('preferencesCurrent').doc('time_constraint_week').set({
    type: 'time_constraint',
    condition_preference: '25 minutes available; favor low-impact',
    expiresAt: admin.firestore.Timestamp.fromDate(expires),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function main() {
  try {
    // Determine UID and create an Auth user in the emulator to trigger the CF that creates /users/{uid}
    const uid = process.env.SEED_UID || `seed_${Date.now()}`;
    const email = process.env.SEED_EMAIL || `${uid}@example.com`;
    const password = process.env.SEED_PASSWORD || 'Passw0rd!';

    console.log(`Ensuring Auth user exists in emulator on ${process.env.FIREBASE_AUTH_EMULATOR_HOST} (project ${PROJECT_ID})`);
    try {
      await auth.createUser({ uid, email, password, displayName: 'Seed User' });
      console.log(`✅ Created Auth user ${email} (${uid})`);
    } catch (e) {
      if (e.code === 'auth/uid-already-exists' || e.code === 'auth/email-already-exists') {
        console.log(`ℹ️ Auth user already exists (${uid}). Proceeding.`);
      } else {
        throw e;
      }
    }

    console.log(`Waiting for Cloud Function to create Firestore /users/${uid} ...`);
    await waitForUserDoc(uid);

    console.log(`Seeding Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} for project ${PROJECT_ID} with uid=${uid}`);
    await seedUser(uid);
    console.log('✅ Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

main();


