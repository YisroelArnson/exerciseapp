import Foundation
import Speech
import AVFoundation

class OptimizedSpeechTranscriber: NSObject, ObservableObject {
    private var speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    @Published var isTranscribing = false
    @Published var transcription: String = ""
    @Published var errorMessage: String?
    @Published var isListening = false
    @Published var confidence: Float = 0.0
    @Published var isFinal: Bool = false
    
    override init() {
        super.init()
        setupSpeechRecognition()
    }
    
    private func setupSpeechRecognition() {
        speechRecognizer?.delegate = self
        
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    print("Speech recognition authorized")
                case .denied:
                    self?.errorMessage = "Speech recognition access denied"
                case .restricted:
                    self?.errorMessage = "Speech recognition restricted on this device"
                case .notDetermined:
                    self?.errorMessage = "Speech recognition not yet authorized"
                @unknown default:
                    self?.errorMessage = "Speech recognition authorization unknown"
                }
            }
        }
    }
    
    func startLiveTranscription() {
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            errorMessage = "Speech recognition not available"
            return
        }
        
        // Cancel any existing recognition task
        recognitionTask?.cancel()
        recognitionTask = nil
        
        // Configure audio session for optimal performance
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            errorMessage = "Failed to configure audio session: \(error.localizedDescription)"
            return
        }
        
        // Create and configure recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            errorMessage = "Unable to create speech recognition request"
            return
        }
        
        // Optimize for real-time performance
        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.taskHint = .dictation
        recognitionRequest.requiresOnDeviceRecognition = false // Use cloud for better accuracy
        
        // Configure audio input with optimized settings
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        // Use smaller buffer size for lower latency
        inputNode.installTap(onBus: 0, bufferSize: 512, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        // Start audio engine
        do {
            audioEngine.prepare()
            try audioEngine.start()
        } catch {
            errorMessage = "Failed to start audio engine: \(error.localizedDescription)"
            return
        }
        
        // Start recognition task with optimized settings
        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = "Recognition error: \(error.localizedDescription)"
                    self.isTranscribing = false
                    self.isListening = false
                }
                return
            }
            
            if let result = result {
                DispatchQueue.main.async {
                    self.transcription = result.bestTranscription.formattedString
                    self.confidence = result.bestTranscription.segments.first?.confidence ?? 0.0
                    self.isTranscribing = true
                    self.isListening = true
                    self.isFinal = result.isFinal
                }
                
                if result.isFinal {
                    DispatchQueue.main.async {
                        self.isTranscribing = false
                        self.isListening = false
                    }
                }
            }
        }
        
        isListening = true
        isTranscribing = true
        errorMessage = nil
        transcription = "" // Clear previous transcription
    }
    
    func stopLiveTranscription() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        
        isTranscribing = false
        isListening = false
    }
    
    func clearTranscription() {
        transcription = ""
        errorMessage = nil
        confidence = 0.0
        isFinal = false
    }
    
    // Additional optimization methods
    func setLanguage(_ locale: Locale) {
        if let newRecognizer = SFSpeechRecognizer(locale: locale) {
            speechRecognizer = newRecognizer
            speechRecognizer?.delegate = self
        }
    }
    
    func enableOnDeviceRecognition(_ enabled: Bool) {
        recognitionRequest?.requiresOnDeviceRecognition = enabled
    }
}

extension OptimizedSpeechTranscriber: SFSpeechRecognizerDelegate {
    func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        DispatchQueue.main.async {
            if !available {
                self.errorMessage = "Speech recognition became unavailable"
                self.isTranscribing = false
                self.isListening = false
            }
        }
    }
}

// MARK: - Legacy fallback (keeping for compatibility)
class LegacySpeechTranscriber: NSObject, ObservableObject {
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    @Published var isTranscribing = false
    @Published var transcription: String = ""
    @Published var errorMessage: String?
    @Published var isListening = false
    @Published var confidence: Float = 0.0
    @Published var isFinal: Bool = false
    
    override init() {
        super.init()
        setupSpeechRecognition()
    }
    
    private func setupSpeechRecognition() {
        speechRecognizer?.delegate = self
        
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    print("Speech recognition authorized")
                case .denied:
                    self?.errorMessage = "Speech recognition access denied"
                case .restricted:
                    self?.errorMessage = "Speech recognition restricted on this device"
                case .notDetermined:
                    self?.errorMessage = "Speech recognition not yet authorized"
                @unknown default:
                    self?.errorMessage = "Speech recognition authorization unknown"
                }
            }
        }
    }
    
    func startLiveTranscription() {
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            errorMessage = "Speech recognition not available"
            return
        }
        
        recognitionTask?.cancel()
        recognitionTask = nil
        
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            errorMessage = "Failed to configure audio session: \(error.localizedDescription)"
            return
        }
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            errorMessage = "Unable to create speech recognition request"
            return
        }
        
        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.taskHint = .dictation
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 512, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        do {
            audioEngine.prepare()
            try audioEngine.start()
        } catch {
            errorMessage = "Failed to start audio engine: \(error.localizedDescription)"
            return
        }
        
        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = "Recognition error: \(error.localizedDescription)"
                    self.isTranscribing = false
                    self.isListening = false
                }
                return
            }
            
            if let result = result {
                DispatchQueue.main.async {
                    self.transcription = result.bestTranscription.formattedString
                    self.confidence = result.bestTranscription.segments.first?.confidence ?? 0.0
                    self.isTranscribing = true
                    self.isListening = true
                    self.isFinal = result.isFinal
                }
                
                if result.isFinal {
                    DispatchQueue.main.async {
                        self.isTranscribing = false
                        self.isListening = false
                    }
                }
            }
        }
    }
    
    func stopLiveTranscription() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        
        isTranscribing = false
        isListening = false
    }
    
    func clearTranscription() {
        transcription = ""
        errorMessage = nil
        confidence = 0.0
        isFinal = false
    }
}

extension LegacySpeechTranscriber: SFSpeechRecognizerDelegate {
    func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        DispatchQueue.main.async {
            if !available {
                self.errorMessage = "Speech recognition became unavailable"
                self.isTranscribing = false
                self.isListening = false
            }
        }
    }
} 