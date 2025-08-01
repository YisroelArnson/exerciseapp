import AVFoundation
import AVFAudio
import Foundation

class AudioRecorder: NSObject, ObservableObject {
    private var audioRecorder: AVAudioRecorder?
    private var audioEngine: AVAudioEngine?
    private var audioFile: AVAudioFile?
    
    @Published var isRecording = false
    @Published var errorMessage: String?
    
    private var recordingURL: URL?
    
    override init() {
        super.init()
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try audioSession.setActive(true)
        } catch {
            errorMessage = "Failed to setup audio session: \(error.localizedDescription)"
        }
    }
    
    func startRecording() -> Bool {
        let recordPermission: AVAudioSession.RecordPermission
        
        if #available(iOS 17.0, *) {
            recordPermission = AVAudioSession.sharedInstance().recordPermission
        } else {
            recordPermission = AVAudioSession.sharedInstance().recordPermission
        }
        
        switch recordPermission {
        case .undetermined:
            if #available(iOS 17.0, *) {
                AVAudioApplication.requestRecordPermission { [weak self] granted in
                    DispatchQueue.main.async {
                        if granted {
                            _ = self?.startRecording()
                        } else {
                            self?.errorMessage = "Microphone access denied"
                        }
                    }
                }
            } else {
                AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
                    DispatchQueue.main.async {
                        if granted {
                            _ = self?.startRecording()
                        } else {
                            self?.errorMessage = "Microphone access denied"
                        }
                    }
                }
            }
            return false
        case .denied:
            errorMessage = "Microphone access denied"
            return false
        case .granted:
            break
        @unknown default:
            errorMessage = "Unknown microphone permission status"
            return false
        }
        
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "recording_\(UUID().uuidString).wav"  // Use .wav extension
        let fileURL = tempDir.appendingPathComponent(fileName)
        
        // Use PCM format instead of AAC
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 16000,
            AVNumberOfChannelsKey: 1,
            AVLinearPCMBitDepthKey: 32,  // Use 32-bit float for better compatibility
            AVLinearPCMIsFloatKey: true,  // Use float format
            AVLinearPCMIsBigEndianKey: false
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: fileURL, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.prepareToRecord()
            audioRecorder?.record()
            
            recordingURL = fileURL
            isRecording = true
            errorMessage = nil
            
            return true
        } catch {
            errorMessage = "Failed to start recording: \(error.localizedDescription)"
            return false
        }
    }
    
    func stopRecording() -> URL? {
        audioRecorder?.stop()
        isRecording = false
        
        let url = recordingURL
        recordingURL = nil
        audioRecorder = nil
        
        return url
    }
    
    func cleanup() {
        if let url = recordingURL {
            try? FileManager.default.removeItem(at: url)
        }
        recordingURL = nil
        audioRecorder = nil
    }
}

extension AudioRecorder: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if !flag {
            errorMessage = "Recording failed"
            isRecording = false
        }
    }
    
    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        if let error = error {
            errorMessage = "Recording error: \(error.localizedDescription)"
            isRecording = false
        }
    }
}