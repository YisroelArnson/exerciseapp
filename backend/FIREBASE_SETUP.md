# Firebase Setup Guide

This guide will help you set up Firebase Authentication and Firestore Database for your exercise app.

## Prerequisites

You'll need:
- A Google account
- Node.js installed
- The Firebase CLI (optional but recommended)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "exercise-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase console, go to **Authentication** > **Sign-in method**
2. Enable the authentication providers you want to use:
   - **Email/Password**: For email-based authentication
   - **Google**: For Google OAuth
   - **Anonymous**: For guest users (optional)
3. Save your changes

## Step 3: Set up Firestore Database

1. In your Firebase console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (you can secure it later)
4. Select a location for your database
5. Click "Done"

### Firestore Security Rules

Replace the default rules with these (in the Rules tab):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own exercises
    match /exercises/{exerciseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Step 4: Generate Service Account Key

1. Go to **Project Settings** (gear icon) > **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `service-account-key.json`
5. Place it in the `backend/firebase/` directory
6. **IMPORTANT**: Add this file to your `.gitignore` to keep it secure

## Step 5: Configure Environment Variables

1. Copy the environment example:
   ```bash
   cp backend/firebase/env-example.txt backend/.env
   ```

2. Update your `.env` file with your Firebase configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Firebase Configuration
   FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase/service-account-key.json
   
   # Other configurations...
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Replace `your-project-id` with your actual Firebase project ID.

## Step 6: Install Dependencies

Run the npm install command that was interrupted earlier:

```bash
cd backend
npm install firebase-admin firebase
```

## Step 7: Test the Setup

1. Start your server:
   ```bash
   npm run dev
   ```

2. Check that Firebase initializes successfully in the console logs
3. Test the health endpoint: `http://localhost:3000/health`

## Frontend Integration

For your frontend (React, Vue, etc.), you'll need the Firebase client SDK:

```bash
npm install firebase
```

### Firebase Client Configuration

Create a Firebase configuration file in your frontend:

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

You can find these values in your Firebase console under **Project Settings** > **General** > **Your apps**.

## API Endpoints

Once set up, your backend will have these endpoints:

### Authentication Routes (`/api/auth`)
- `POST /api/auth/profile` - Create/update user profile
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/preferences` - Update preferences
- `DELETE /api/auth/account` - Delete account

### Exercise Routes (`/api/exercises`)
- `GET /api/exercises` - Get user's exercises
- `POST /api/exercises` - Log new exercise
- `GET /api/exercises/stats` - Get exercise statistics
- `GET /api/exercises/search` - Search exercises

### Voice Routes (`/api/voice`)
- `POST /api/voice/process` - Process voice commands

## Security Best Practices

1. **Never commit** your service account key to version control
2. Use **environment variables** for sensitive configuration
3. Implement proper **Firestore security rules**
4. Enable **CORS** only for your domain in production
5. Use **HTTPS** in production
6. Consider implementing **rate limiting** (already included)

## Troubleshooting

### Common Issues

1. **"Firebase project not found"**
   - Check your project ID in the configuration
   - Ensure the service account key is valid

2. **"Permission denied"**
   - Check your Firestore security rules
   - Ensure the user is authenticated

3. **"Module not found"**
   - Run `npm install` to install dependencies
   - Check your import paths

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and logs.

## Next Steps

1. Set up your frontend authentication flow
2. Create user registration/login pages
3. Implement exercise logging UI
4. Add voice command processing
5. Deploy to production (consider Firebase Hosting)

For more details, check the [Firebase Documentation](https://firebase.google.com/docs). 