# 📄 Product Requirements Document (PRD): Voice-Driven Fitness App

## 🧠 1. Product Overview

An AI-driven iOS fitness app that provides personalized workout guidance, logging, and feedback through voice interaction. The app emphasizes ease, intelligence, and minimal user friction.

> Vision: "A personal trainer who’s always with you — no scheduling, no thinking, no friction."
> 

The app delivers on this promise by allowing users to simply speak to it — and it builds the workout, coaches them through it, and tracks everything automatically.

---

## 🎯 2. Key Objectives

- Enable intuitive voice or text interaction for logging and performing exercises.
- Provide intelligent workout guidance and coaching using AI.
- Support both freeform and structured workout modes.
- Offer engaging run tracking and pacing tools.
- Deliver insightful feedback via body maps and progress analysis.
- Integrate social, competitive, and recovery experiences for full-body wellness.

---

## 🧰 3. Tech Stack

### 📱 Frontend (iOS App)

- **Language:** Swift
- **UI Framework:** SwiftUI
- **Voice Interaction:** SiriKit, AVFoundation, wake-word detection (e.g., Picovoice)
- **Audio Feedback:** AVSpeechSynthesizer, haptics, visual pings
- **Local LLM Tools:** `llama.cpp`, `whisper.cpp` for on-device transcription and parsing

### 🖥️ Backend

- **Runtime:** Node.js (JavaScript, no TypeScript)
- **Framework:** Express.js
- **Database:** Firebase (document-based schema for logs, users, plans)
- **Authentication:** Firebase Auth
- **AI Integration:**
    - OpenAI / OpenRouter for advanced LLM tasks
    - Local models for simple parsing/transcription
    - Tool-use for structured JSON generation from prompts

### 🔌 3rd Party & Native Integrations

- **Audio Streaming:** ReplayKit + audio session handling

---

## 🧩 4. Feature Breakdown

### 🔵 A. Capture Data

**Core Features:**

- Voice-activated logging: e.g., “I did 15 push-ups”
- Manual text input alternative
- Freeform Timeline View
- Timer control via voice:
    - Intervals, countdowns, pacing reps with tempo
    - Save/load preset timers
    - Feedback: ping, voice, vibration, visual
- Real-time AI muscle tagging per logged exercise
- Multi-modal logging interface (voice/text/buttons)

---

### 🟩 B. Perform Exercises

### 🗣️ Freeform Voice Mode

- Log reps/duration
- Set timers
- Ask exercise form questions
- Receive step-by-step audio/visual feedback


## 📈 7. Success Metrics

- Daily/weekly active users
- Exercise streaks maintained
- Number of workouts completed via voice
- AI plan satisfaction ratings
- Improvement in training balance over time