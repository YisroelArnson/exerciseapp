import SwiftUI
import AVFoundation

struct VoiceRecordingView: View {
    @StateObject private var audioRecorder = AudioRecorder()
    @StateObject private var whisperTranscriber: WhisperTranscriber
    
    @State private var isProcessing = false
    @State private var showPermissionAlert = false
    @State private var lastRecordingURL: URL?
    
    init() {
        let transcriber = WhisperTranscriber() ?? WhisperTranscriber(createDummy: true)
        _whisperTranscriber = StateObject(wrappedValue: transcriber)
    }
    
    var body: some View {
        ZStack {
            Color.white
                .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 40) {
                Spacer()
                
                // Record Button
                Button(action: toggleRecording) {
                    ZStack {
                        Circle()
                            .fill(audioRecorder.isRecording ? Color.red : Color.blue)
                            .frame(width: 80, height: 80)
                            .shadow(color: (audioRecorder.isRecording ? Color.red : Color.blue).opacity(0.3), radius: 10, x: 0, y: 5)
                        
                        if audioRecorder.isRecording {
                            Image(systemName: "stop.fill")
                                .font(.title)
                                .foregroundColor(.white)
                        } else {
                            Image(systemName: "mic.fill")
                                .font(.title)
                                .foregroundColor(.white)
                        }
                    }
                }
                .scaleEffect(audioRecorder.isRecording ? 1.1 : 1.0)
                .animation(.easeInOut(duration: 0.2), value: audioRecorder.isRecording)
                
                // Status Text
                if isProcessing {
                    ProgressView("Processing audio...")
                        .padding()
                } else if whisperTranscriber.isTranscribing {
                    VStack(spacing: 8) {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text(whisperTranscriber.progressMessage.isEmpty ? "Transcribing..." : whisperTranscriber.progressMessage)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    .padding()
                } else if let errorMessage = audioRecorder.errorMessage ?? whisperTranscriber.errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                } else {
                    Text(audioRecorder.isRecording ? "Listening..." : "Tap to start recording")
                        .font(.headline)
                        .foregroundColor(.gray)
                }
                
                // Transcription Display
                if !whisperTranscriber.transcription.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Transcription:")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ScrollView {
                            Text(whisperTranscriber.transcription)
                                .font(.body)
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(10)
                        }
                        .frame(maxHeight: 200)
                        .padding(.horizontal)
                    }
                }
                
                Spacer()
                
                // Clear Button
                if !whisperTranscriber.transcription.isEmpty {
                    VStack(spacing: 12) {
                        Button("Clear Transcription") {
                            whisperTranscriber.clearTranscription()
                            if let url = lastRecordingURL {
                                try? FileManager.default.removeItem(at: url)
                                lastRecordingURL = nil
                            }
                        }
                        .foregroundColor(.red)
                        
                        // Performance test button (for debugging)
                        Button("Test Performance") {
                            testPerformance()
                        }
                        .foregroundColor(.blue)
                        .font(.caption)
                    }
                    .padding(.bottom)
                }
            }
        }
        .alert("Microphone Access", isPresented: $showPermissionAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("Please enable microphone access in Settings to use voice recording.")
        }
    }
    
    private func toggleRecording() {
        if audioRecorder.isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    private func startRecording() {
        if audioRecorder.startRecording() {
            // Recording started successfully
            whisperTranscriber.clearTranscription()
            if let url = lastRecordingURL {
                try? FileManager.default.removeItem(at: url)
                lastRecordingURL = nil
            }
        } else if let errorMessage = audioRecorder.errorMessage, errorMessage.contains("denied") {
            showPermissionAlert = true
        }
    }
    
    private func stopRecording() {
        guard let recordingURL = audioRecorder.stopRecording() else {
            return
        }
        
        lastRecordingURL = recordingURL
        isProcessing = true
        
        Task {
            // Add a small delay to show processing state
            try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
            
            await whisperTranscriber.transcribeAudio(recordingURL)
            
            await MainActor.run {
                isProcessing = false
            }
        }
    }
    
    private func testPerformance() {
        guard let url = lastRecordingURL else { return }
        
        Task {
            let startTime = Date()
            print("=== PERFORMANCE TEST START ===")
            
            // Test audio processing only
            do {
                let pcmData = try await AudioProcessor.prepareAudioForWhisper(audioURL: url)
                let audioTime = Date().timeIntervalSince(startTime)
                print("Audio processing time: \(audioTime) seconds")
                print("PCM samples: \(pcmData.count)")
                
                // Test Whisper only
                let whisperStart = Date()
                if let whisper = whisperTranscriber.whisper {
                    let segments = try await whisper.transcribe(audioFrames: pcmData)
                    let whisperTime = Date().timeIntervalSince(whisperStart)
                    print("Whisper processing time: \(whisperTime) seconds")
                }
                
                let totalTime = Date().timeIntervalSince(startTime)
                print("Total test time: \(totalTime) seconds")
                print("=== PERFORMANCE TEST END ===")
                
            } catch {
                print("Performance test failed: \(error)")
            }
        }
    }
}

struct VoiceRecordingView_Previews: PreviewProvider {
    static var previews: some View {
        VoiceRecordingView()
    }
}