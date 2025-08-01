import Foundation
import SwiftWhisper

class WhisperTranscriber: ObservableObject {
    internal var whisper: Whisper?
    
    @Published var isTranscribing = false
    @Published var transcription: String = ""
    @Published var errorMessage: String?
    @Published var progressMessage: String = ""
    
    init?() {
        guard let modelURL = Bundle.main.url(forResource: "tiny", withExtension: "bin") else {
            print("Failed to find tiny.bin model file")
            return nil
        }
        
        do {
            self.whisper = try Whisper(fromFileURL: modelURL)
            print("Whisper model loaded successfully")
        } catch {
            print("Failed to load Whisper model: \(error)")
            return nil
        }
    }
    
    // Fallback initializer for development/testing
    init(createDummy: Bool) {
        self.whisper = nil
        self.errorMessage = "Whisper model not available"
    }
    
    func transcribeAudio(_ audioURL: URL) async {
        guard let whisper = whisper else {
            await MainActor.run {
                errorMessage = "Whisper not initialized"
            }
            return
        }
        
        let startTime = Date()
        
        await MainActor.run {
            isTranscribing = true
            errorMessage = nil
            progressMessage = "Loading audio file..."
        }
        
        print("Starting transcription of audio file: \(audioURL)")
        print("File exists: \(FileManager.default.fileExists(atPath: audioURL.path))")
        
        do {
            let fileSize = try FileManager.default.attributesOfItem(atPath: audioURL.path)[.size] as? NSNumber
            print("Audio file size: \(fileSize?.intValue ?? 0) bytes")
            
            await MainActor.run {
                progressMessage = "Processing audio data..."
            }
            
            let pcmData = try await AudioProcessor.prepareAudioForWhisper(audioURL: audioURL)
            print("PCM data prepared, samples count: \(pcmData.count)")
            
            let audioProcessingTime = Date().timeIntervalSince(startTime)
            print("Audio processing took: \(audioProcessingTime) seconds")
            
            await MainActor.run {
                progressMessage = "Transcribing with Whisper..."
            }
            
            let whisperStartTime = Date()
            let segments = try await whisper.transcribe(audioFrames: pcmData)
            let whisperTime = Date().timeIntervalSince(whisperStartTime)
            print("Whisper transcription took: \(whisperTime) seconds")
            
            let transcribedText = segments.map { $0.text }.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
            
            let totalTime = Date().timeIntervalSince(startTime)
            print("Total transcription time: \(totalTime) seconds")
            print("Transcription completed: \(transcribedText)")
            
            await MainActor.run {
                self.transcription = transcribedText
                self.isTranscribing = false
                self.progressMessage = ""
            }
            
        } catch {
            print("Transcription error: \(error)")
            print("Error details: \(error.localizedDescription)")
            
            await MainActor.run {
                self.errorMessage = "Transcription failed: \(error.localizedDescription)"
                self.isTranscribing = false
                self.progressMessage = ""
            }
        }
    }
    
    func transcribeAudioFrames(_ pcmData: [Float]) async {
        guard let whisper = whisper else {
            errorMessage = "Whisper not initialized"
            return
        }
        
        isTranscribing = true
        errorMessage = nil
        
        do {
            let segments = try await whisper.transcribe(audioFrames: pcmData)
            let transcribedText = segments.map { $0.text }.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
            
            await MainActor.run {
                self.transcription = transcribedText
                self.isTranscribing = false
            }
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Transcription failed: \(error.localizedDescription)"
                self.isTranscribing = false
            }
        }
    }
    
    func clearTranscription() {
        transcription = ""
        errorMessage = nil
        progressMessage = ""
    }
}