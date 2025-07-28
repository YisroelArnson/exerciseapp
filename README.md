# 🏃‍♂️ Voice-Driven Fitness App

> **A personal trainer who's always with you — no scheduling, no thinking, no friction.**

An AI-driven iOS fitness app that provides personalized workout guidance, logging, and feedback through voice interaction. Simply speak to it, and it builds your workout, coaches you through it, and tracks everything automatically.

## 🎯 Project Overview

This project consists of two main components:
- **iOS App** (Swift/SwiftUI): Voice-activated fitness tracking and coaching
- **Backend API** (Node.js/Express): AI-powered exercise processing and data management

## ✨ Key Features

### 🎤 Voice-Driven Interaction
- **Voice-activated logging**: "I did 15 push-ups"
- **Freeform voice mode**: Natural conversation with your AI trainer
- **Timer control via voice**: Set intervals, countdowns, and pacing
- **Wake word detection**: "Hey FitBot" to activate voice commands

### 🧠 AI-Powered Intelligence
- **Personalized workout guidance** using OpenAI integration
- **Real-time muscle tagging** for logged exercises
- **Intelligent form feedback** and coaching
- **Adaptive workout plans** based on your progress

### 📱 Multi-Modal Interface
- **Voice + text entry** for maximum flexibility
- **Audio feedback**: Voice, ping, vibration, visual cues
- **Music playback support** with auto-ducking
- **Silent mode** for quiet environments

### 📊 Smart Tracking & Analytics
- **Freeform timeline view** for exercise logging
- **Progress tracking** with detailed analytics
- **Body map visualization** showing muscle engagement
- **Social and competitive features** for motivation

## 🛠️ Tech Stack

### 📱 Frontend (iOS)
- **Language**: Swift
- **UI Framework**: SwiftUI
- **Voice Interaction**: SiriKit, AVFoundation
- **Audio Processing**: AVSpeechSynthesizer, haptics
- **Local AI**: `llama.cpp`, `whisper.cpp` for on-device processing
- **Health Integration**: CoreLocation, HealthKit

### 🖥️ Backend
- **Runtime**: Node.js (JavaScript)
- **Framework**: Express.js
- **Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth
- **AI Integration**: OpenAI API
- **Security**: Helmet, CORS, Rate Limiting

### 🔌 Third-Party Integrations
- **GPS/Motion**: CoreLocation, HealthKit
- **Audio Streaming**: ReplayKit
- **Real-time Sync**: Firebase WebSocket

## 📁 Project Structure

```
exerciseapp/
├── backend/                          # Node.js API server
│   ├── controllers/                  # Request handlers
│   │   ├── authController.js        # Authentication logic
│   │   └── userController.js        # User management
│   ├── firebase/                    # Firebase configuration
│   │   └── config.js               # Firebase setup
│   ├── middleware/                  # Express middleware
│   │   ├── auth.js                 # Authentication middleware
│   │   └── validation.js           # Input validation
│   ├── models/                      # Data models
│   │   ├── Exercise.js             # Exercise schema
│   │   └── User.js                 # User schema
│   ├── routes/                      # API endpoints
│   │   ├── auth.js                 # Authentication routes
│   │   ├── exercises.js            # Exercise management
│   │   └── voice.js                # Voice processing
│   ├── services/                    # Business logic
│   │   ├── databaseService.js      # Database operations
│   │   └── voiceService.js         # Voice AI processing
│   ├── server.js                   # Express server setup
│   └── package.json                # Node.js dependencies
│
└── Exercise app/                    # iOS SwiftUI application
    ├── Exercise app/
    │   ├── Assets.xcassets/        # App icons and colors
    │   ├── ContentView.swift       # Main app interface
    │   └── Exercise_appApp.swift   # App entry point
    ├── Exercise app.xcodeproj/     # Xcode project files
    ├── Exercise appTests/          # Unit tests
    └── Exercise appUITests/        # UI tests
```

## 🚀 Getting Started

### Prerequisites
- **iOS Development**: Xcode 15+, iOS 17+
- **Backend**: Node.js 18+, npm
- **Firebase**: Firebase project with Authentication and Firestore enabled
- **OpenAI**: OpenAI API key

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exerciseapp/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   OPENAI_API_KEY=your-openai-key
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### iOS App Setup

1. **Open the project in Xcode**
   ```bash
   open "Exercise app/Exercise app.xcodeproj"
   ```

2. **Configure Firebase**
   - Add your `GoogleService-Info.plist` to the project
   - Update Firebase configuration in the app

3. **Configure API endpoints**
   - Update the backend URL in your app configuration
   - Set up proper CORS settings for your domain

4. **Build and run**
   - Select your target device/simulator
   - Press `Cmd+R` to build and run

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Exercise Endpoints
- `GET /api/exercises` - Get user exercises
- `POST /api/exercises` - Log new exercise
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Voice Processing Endpoints
- `POST /api/voice/process` - Process voice input
- `POST /api/voice/analyze` - Analyze exercise form

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# iOS tests
# Run in Xcode: Cmd+U
```

### Code Quality
- **Backend**: ESLint, Prettier
- **iOS**: SwiftLint (recommended)

## 📈 Success Metrics

- Daily/weekly active users
- Exercise streaks maintained
- Number of workouts completed via voice
- AI plan satisfaction ratings
- Improvement in training balance over time

## 🆘 Support

- **Documentation**: Check the `backend/` folder for detailed guides
- **Authentication**: See `AUTHENTICATION_GUIDE.md`
- **Firebase Setup**: See `FIREBASE_SETUP.md`
- **Issues**: Create an issue in the GitHub repository

## 🔮 Roadmap

- [ ] Advanced voice recognition improvements
- [ ] Social features and challenges
- [ ] Integration with wearable devices
- [ ] Advanced analytics and insights
- [ ] Multi-language support
- [ ] Android version

---

**Built with ❤️ for fitness enthusiasts who want a smarter way to train.** 