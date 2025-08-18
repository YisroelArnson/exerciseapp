'use strict';

const admin = require('firebase-admin');

// Target local Firestore emulator by default
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'exerciseapp-b4f9d';

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function seedPublicExercises() {
  const exercises = [
    {
      id: 'bb_back_squat',
      canonical_name: 'Barbell Back Squat',
      movement_pattern: 'squat',
      equipment: ['barbell', 'rack'],
      primary_muscles: ['quadriceps', 'glutes'],
      secondary_muscles: ['lower_back'],
      aliases: ['back squat', 'bb back squat'],
    },
    {
      id: 'bb_deadlift',
      canonical_name: 'Barbell Deadlift',
      movement_pattern: 'hinge',
      equipment: ['barbell'],
      primary_muscles: ['hamstrings', 'glutes'],
      secondary_muscles: ['lower_back', 'upper_back'],
      aliases: ['deadlift', 'conventional deadlift'],
    },
    {
      id: 'db_bench_press',
      canonical_name: 'Dumbbell Bench Press',
      movement_pattern: 'press_horizontal',
      equipment: ['dumbbells', 'bench'],
      primary_muscles: ['chest'],
      secondary_muscles: ['triceps', 'shoulders'],
      aliases: ['db bench press', 'dumbbell bench'],
    },
    {
      id: 'oh_press',
      canonical_name: 'Overhead Press',
      movement_pattern: 'press_vertical',
      equipment: ['barbell'],
      primary_muscles: ['shoulders'],
      secondary_muscles: ['triceps', 'upper_back'],
      aliases: ['OHP', 'bb overhead press'],
    },
    {
      id: 'pull_up',
      canonical_name: 'Pull-Up',
      movement_pattern: 'pull_vertical',
      equipment: ['pullup_bar'],
      primary_muscles: ['upper_back'],
      secondary_muscles: ['biceps', 'forearms'],
      aliases: ['chin-up (variant)'],
    },
    {
      id: 'rower_zone2',
      canonical_name: 'Rowing Ergometer - Zone 2',
      movement_pattern: 'cardio',
      equipment: ['rower'],
      primary_muscles: ['cardiovascular'],
      secondary_muscles: [],
      aliases: ['rower steady state', 'rower zone2'],
    },
    {
      id: 'treadmill_zone2',
      canonical_name: 'Treadmill Walking - Zone 2',
      movement_pattern: 'cardio',
      equipment: ['treadmill'],
      primary_muscles: ['cardiovascular'],
      secondary_muscles: [],
      aliases: ['treadmill steady state', 'treadmill zone2'],
    },
    {
      id: 'yoga_flow',
      canonical_name: 'Yoga Flow',
      movement_pattern: 'mobility',
      equipment: ['yoga_mat'],
      primary_muscles: ['full_body'],
      secondary_muscles: [],
      aliases: ['vinyasa flow', 'mobility flow'],
    },
  ];

  for (const ex of exercises) {
    await db.collection('publicExercises').doc(ex.id).set({
      canonical_name: ex.canonical_name,
      movement_pattern: ex.movement_pattern,
      equipment: ex.equipment,
      primary_muscles: ex.primary_muscles,
      secondary_muscles: ex.secondary_muscles,
      aliases: ex.aliases,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`Seeded publicExercises/${ex.id}`);
  }
}

async function main() {
  try {
    console.log(`Seeding public exercises into Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} (project ${PROJECT_ID})`);
    await seedPublicExercises();
    console.log('✅ Public reference data seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding public reference data failed:', err);
    process.exit(1);
  }
}

main();


