# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice-driven fitness app with two main components:
- **iOS App**: Swift/SwiftUI frontend with voice interaction
- **Backend**: Node.js/Express API with OpenAI integration for natural language processing

## Architecture

### Backend (Node.js/Express)
- **Entry**: `backend/server.js` - Express server setup
- **Routes**: 
  - `/api/voice/process` - Natural language exercise parsing
  - `/api/exercises` - CRUD operations for exercise data
  - `/api/auth/*` - Firebase authentication
- **Services**: `voiceService.js` - OpenAI integration for NLP
- **Models**: `Exercise.js`, `User.js` - Firebase/Firestore schemas
- **Middleware**: Input validation, auth, rate limiting

### iOS App (Swift/SwiftUI)
- **Entry**: `Exercise app/Exercise app/Exercise_appApp.swift`
- **Main View**: `ContentView.swift` - Initial SwiftUI interface (placeholder)
- **Voice Processing**: SiriKit + AVFoundation planned
- **Local AI**: llama.cpp, whisper.cpp for on-device processing

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev          # Development server on localhost:3000
npm start           # Production server
npm test            # Jest tests
```

### iOS App
```bash
open "Exercise app/Exercise app.xcodeproj"  # Open in Xcode
Cmd+R             # Build and run
Cmd+U             # Run tests
```

## Environment Setup

### Backend (.env)
```
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project
FIREBASE_PRIVATE_KEY=your_key
FIREBASE_CLIENT_EMAIL=your_email
JWT_SECRET=your_secret
```

### iOS Setup
- Add `GoogleService-Info.plist` to Xcode project
- Configure Firebase in app settings
- Update API endpoint URLs

## Key Features
- Voice-to-exercise logging via OpenAI NLP
- Firebase Auth + Firestore for user data
- Real-time exercise processing and muscle group tagging
- Multi-modal interface (voice + text + visual)

## Dependencies
- **Backend**: Express, OpenAI, Firebase, Joi validation
- **iOS**: SwiftUI, AVFoundation, SiriKit, HealthKit