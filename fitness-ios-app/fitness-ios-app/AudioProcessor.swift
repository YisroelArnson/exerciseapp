import AVFoundation
import Foundation

class AudioProcessor {
    
    static func prepareAudioForWhisper(audioURL: URL) async throws -> [Float] {
        return try await withCheckedThrowingContinuation { continuation in
            convertAudioFileToPCMArray(fileURL: audioURL) { result in
                continuation.resume(with: result)
            }
        }
    }
    
    static func convertAudioFileToPCMArray(fileURL: URL, completion: @escaping (Result<[Float], Error>) -> Void) {
        print("Converting audio file: \(fileURL)")
        
        // Run on background queue to avoid blocking UI
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let pcmData = try extractPCMDataDirectly(from: fileURL)
                print("Direct PCM extraction successful, samples: \(pcmData.count)")
                completion(.success(pcmData))
            } catch {
                print("PCM extraction failed: \(error)")
                completion(.failure(error))
            }
        }
    }
    
    private static func extractPCMDataDirectly(from audioURL: URL) throws -> [Float] {
        let file = try AVAudioFile(forReading: audioURL)
        
        // Check if we need format conversion
        let targetFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: 16000,
            channels: 1,
            interleaved: false
        )!
        
        if file.processingFormat.sampleRate == 16000 && 
           file.processingFormat.channelCount == 1 &&
           file.processingFormat.commonFormat == .pcmFormatFloat32 {
            // Already in correct format, read directly
            let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: AVAudioFrameCount(file.length))!
            try file.read(into: buffer)
            
            let frameLength = Int(buffer.frameLength)
            let channelData = buffer.floatChannelData![0]
            
            // Use direct memory access without copying
            return Array(UnsafeBufferPointer(start: channelData, count: frameLength))
        } else {
            // Need format conversion
            print("Converting audio format from \(file.processingFormat) to 16kHz mono float32")
            
            guard let converter = AVAudioConverter(from: file.processingFormat, to: targetFormat) else {
                throw AudioProcessingError.formatConversionFailed
            }
            
            // Calculate output frame count
            let ratio = 16000.0 / file.processingFormat.sampleRate
            let outputFrameCount = AVAudioFrameCount(Double(file.length) * ratio)
            
            let outputBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: outputFrameCount)!
            let inputBuffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: AVAudioFrameCount(file.length))!
            
            try file.read(into: inputBuffer)
            
            var error: NSError?
            let inputBlock: AVAudioConverterInputBlock = { inNumPackets, outStatus in
                outStatus.pointee = .haveData
                return inputBuffer
            }
            
            converter.convert(to: outputBuffer, error: &error, withInputFrom: inputBlock)
            
            if let error = error {
                throw error
            }
            
            let frameLength = Int(outputBuffer.frameLength)
            let channelData = outputBuffer.floatChannelData![0]
            
            return Array(UnsafeBufferPointer(start: channelData, count: frameLength))
        }
    }
}

enum AudioProcessingError: Error, LocalizedError {
    case conversionFailed
    case formatConversionFailed
    case cancelled
    case unknownError
    
    var errorDescription: String? {
        switch self {
        case .conversionFailed:
            return "Failed to convert audio file"
        case .formatConversionFailed:
            return "Failed to convert audio format"
        case .cancelled:
            return "Audio processing was cancelled"
        case .unknownError:
            return "An unknown error occurred during audio processing"
        }
    }
}