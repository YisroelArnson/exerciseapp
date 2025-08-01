# Whisper.cpp Setup Instructions

## Overview
This document provides instructions for integrating whisper.cpp with the iOS app for local speech-to-text transcription.

## Current Status
The app currently uses iOS built-in speech recognition as a placeholder. To fully integrate whisper.cpp:

## Setup Steps

### 1. Download whisper.cpp
```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
```

### 2. Download Model
Download a whisper model (e.g., ggml-base.bin):
```bash
./models/download-ggml-model.sh base
```

### 3. Add Files to Xcode Project
1. Copy `whisper.cpp` source files to your project
2. Add the model file `ggml-base.bin` to your project bundle
3. Set file reference type to "Data" for the model file

### 4. Update Build Settings
In Xcode project settings:
- Add whisper.cpp source files to "Compile Sources"
- Add required frameworks: Accelerate, CoreML, Metal
- Set C++ language standard to C++17

### 5. Bridge Header Configuration
The project includes:
- `WhisperBridge.h` - Objective-C interface
- `WhisperBridge.mm` - Objective-C++ implementation
- `WhisperTranscriber.swift` - Swift wrapper

### 6. Model Loading
The model should be placed in:
```
Exercise app/
├── Resources/
│   └── ggml-base.bin
```

### 7. Usage
Replace the current `VoiceTranscriptionManager` with whisper.cpp:
```swift
// In VoiceTranscriptionManager.swift
private let whisperEngine = VoiceTranscriptionEngine()
```

## Testing
Test the integration by:
1. Running the app
2. Tapping the voice orb
3. Speaking commands like "I did 15 push-ups"
4. Verifying transcription appears in real-time

## Next Steps
- Add whisper.cpp as a Swift Package Manager dependency
- Implement real-time streaming transcription
- Add exercise parsing logic
- Integrate with backend API for exercise logging