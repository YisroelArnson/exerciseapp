import SwiftUI
import AVFoundation
import WhisperKit

struct VoiceRecordingView: View {
    @StateObject private var speechTranscriber: SpeechTranscriberWrapper
    
    @State private var showPermissionAlert = false
    
    init() {
        _speechTranscriber = StateObject(wrappedValue: SpeechTranscriberWrapper())
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
                            .fill(speechTranscriber.isListening ? Color.red : Color.blue)
                            .frame(width: 80, height: 80)
                            .shadow(color: (speechTranscriber.isListening ? Color.red : Color.blue).opacity(0.3), radius: 10, x: 0, y: 5)
                        
                        if speechTranscriber.isListening {
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
                .scaleEffect(speechTranscriber.isListening ? 1.1 : 1.0)
                .animation(.easeInOut(duration: 0.2), value: speechTranscriber.isListening)
                
                // Status Text
                if speechTranscriber.isTranscribing {
                    VStack(spacing: 8) {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Listening and transcribing...")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    .padding()
                } else if let errorMessage = speechTranscriber.errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                } else {
                    Text(speechTranscriber.isListening ? "Listening..." : "Tap to start recording")
                        .font(.headline)
                        .foregroundColor(.gray)
                }
                
                // Live Transcription Display
                if !speechTranscriber.transcription.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Live Transcription:")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ScrollView {
                            Text(speechTranscriber.transcription)
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
                if !speechTranscriber.transcription.isEmpty {
                    Button("Clear Transcription") {
                        speechTranscriber.clearTranscription()
                    }
                    .foregroundColor(.red)
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
        if speechTranscriber.isListening {
            speechTranscriber.stopLiveTranscription()
        } else {
            speechTranscriber.startLiveTranscription()
        }
    }
}

// Wrapper class to handle iOS version compatibility
class SpeechTranscriberWrapper: ObservableObject {
    @Published var isTranscribing = false
    @Published var transcription: String = ""
    @Published var errorMessage: String?
    @Published var isListening = false
    @Published var confidence: Float = 0.0
    @Published var isFinal: Bool = false
    
    private var optimizedTranscriber: OptimizedSpeechTranscriber?
    private var legacyTranscriber: LegacySpeechTranscriber?
    
    init() {
        // Use the optimized transcriber for all iOS versions
        optimizedTranscriber = OptimizedSpeechTranscriber()
        setupOptimizedBindings()
    }
    
    private func setupOptimizedBindings() {
        guard let transcriber = optimizedTranscriber else { return }
        
        transcriber.$isTranscribing
            .assign(to: &$isTranscribing)
        transcriber.$transcription
            .assign(to: &$transcription)
        transcriber.$errorMessage
            .assign(to: &$errorMessage)
        transcriber.$isListening
            .assign(to: &$isListening)
        transcriber.$confidence
            .assign(to: &$confidence)
        transcriber.$isFinal
            .assign(to: &$isFinal)
    }
    
    func startLiveTranscription() {
        optimizedTranscriber?.startLiveTranscription()
        
        // Initialize WhisperKit with default settings
        Task {
            let pipe = try? await WhisperKit()
            let transcription = try? await pipe!.transcribe(audioPath: "path/to/your/audio.{wav,mp3,m4a,flac}")?.text
            print(transcription)
        }
    }
    
    func stopLiveTranscription() {
        optimizedTranscriber?.stopLiveTranscription()
    }
    
    func clearTranscription() {
        optimizedTranscriber?.clearTranscription()
    }
}

struct VoiceRecordingView_Previews: PreviewProvider {
    static var previews: some View {
        VoiceRecordingView()
    }
}