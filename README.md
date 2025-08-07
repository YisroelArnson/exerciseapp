# 🏃‍♂️ Voice-Driven Fitness App

> **"A personal trainer who's always with you — no scheduling, no thinking, no friction."**

An AI-driven iOS fitness app that provides personalized workout guidance, logging, and feedback through voice interaction. Simply speak to it, and it builds your workout, coaches you through it, and tracks everything automatically.

## ✨ Features

### 🎤 Voice-First Interaction
- **Voice-activated logging**: "I did 15 push-ups" - just speak and it logs
- **Freeform voice mode**: Ask questions, set timers, get coaching
- **Manual text input**: Alternative input method when voice isn't convenient
- **Wake word support**: "Hey FitBot" with auto-ducking for music

### 🧠 AI-Powered Intelligence
- **Personalized workout guidance** and coaching
- **Real-time muscle tagging** for each logged exercise
- **Intelligent workout planning** based on your goals and progress
- **Form feedback** and step-by-step audio/visual guidance

### ⏱️ Smart Timing & Tracking
- **Voice-controlled timers**: Intervals, countdowns, pacing reps with tempo
- **Preset timer management**: Save and load your favorite timing patterns
- **Multi-modal feedback**: Audio pings, voice guidance, haptics, visual cues
- **Freeform timeline view** for comprehensive workout tracking

### 📊 Progress & Analytics
- **Body maps** showing muscle engagement and progress
- **Insightful feedback** and progress analysis
- **Training balance tracking** over time
- **Social and competitive features** for motivation

## 🛠️ Tech Stack

### 📱 iOS App (SwiftUI)
- **Language**: Swift
- **UI Framework**: SwiftUI
- **Voice Processing**: On-device transcription and parsing
- **Audio Features**: Text-to-speech, haptics, visual feedback
- **Local LLM Tools**: For privacy-focused on-device processing

### 🖥️ Backend (Node.js)
- **Runtime**: Node.js (JavaScript)
- **Framework**: Express.js
- **Database**: Firebase (document-based schema)
- **Authentication**: JWT/Firebase Auth with Apple ID integration
- **AI Integration**: 
  - OpenAI/OpenRouter for advanced LLM tasks
  - Local models for simple parsing/transcription
  - Tool-use for structured JSON generation

## 📱 Usage

### Voice Commands Examples
- **Logging**: "I did 15 push-ups"
- **Timers**: "Set a 30-second plank timer"
- **Questions**: "How do I do a proper squat?"
- **Coaching**: "Guide me through a 5-minute HIIT workout"

### Workout Modes
- **Freeform Mode**: Speak naturally and let AI guide your workout
- **Structured Mode**: Follow pre-built workout plans
- **Run Tracking**: GPS-based run tracking with voice coaching

## 🎯 Key Objectives

- Enable intuitive voice or text interaction for logging and performing exercises
- Provide intelligent workout guidance and coaching using AI
- Support both freeform and structured workout modes
- Offer engaging run tracking and pacing tools
- Deliver insightful feedback via body maps and progress analysis
- Integrate social, competitive, and recovery experiences for full-body wellness
