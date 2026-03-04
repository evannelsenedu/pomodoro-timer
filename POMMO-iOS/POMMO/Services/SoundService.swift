import AVFoundation

/// Sound event types for timer feedback.
enum SoundType {
    case start
    case end
    case pause
    case reset
    case resetSessions
    case confetti
}

/// Plays synthesized sine-wave tones for timer events (start, pause, reset, etc.).
final class SoundService {
    static let shared = SoundService()

    private var audioEngine: AVAudioEngine?
    private var playerNode: AVAudioPlayerNode?

    private init() {}

    func play(_ type: SoundType) {
        let tones: [(frequency: Float, duration: TimeInterval, delay: TimeInterval)]
        switch type {
        case .start:
            tones = [(523.25, 0.15, 0), (659.25, 0.15, 0.12), (783.99, 0.2, 0.24)]
        case .end:
            tones = [(523.25, 0.2, 0), (659.25, 0.2, 0.15), (783.99, 0.2, 0.3), (1046.5, 0.4, 0.45)]
        case .pause:
            tones = [(783.99, 0.12, 0), (659.25, 0.12, 0.1), (523.25, 0.15, 0.2)]
        case .reset:
            tones = [(392, 0.08, 0), (329.63, 0.08, 0.06), (261.63, 0.12, 0.12)]
        case .resetSessions:
            tones = [(523.25, 0.1, 0), (392, 0.15, 0.08)]
        case .confetti:
            tones = [(880, 0.08, 0), (1108.73, 0.08, 0.04), (1318.51, 0.08, 0.08), (1760, 0.12, 0.12), (2093, 0.15, 0.18)]
        }

        playTones(tones)
    }

    private func playTones(_ tones: [(frequency: Float, duration: TimeInterval, delay: TimeInterval)]) {
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            return
        }

        let engine = AVAudioEngine()
        let player = AVAudioPlayerNode()
        let format = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!

        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: format)

        do {
            try engine.start()
        } catch {
            return
        }

        self.audioEngine = engine
        self.playerNode = player

        var lastEndTime: AVAudioFramePosition = 0
        for tone in tones {
            let buffer = createSineBuffer(frequency: tone.frequency, duration: tone.duration, sampleRate: 44100)
            let delayFrames = AVAudioFrameCount(Int(tone.delay * 44100))
            let startFrame = max(0, lastEndTime + Int64(delayFrames))
            player.scheduleBuffer(buffer, at: AVAudioTime(framePosition: startFrame), options: []) {}
            lastEndTime = startFrame + Int64(buffer.frameLength)
        }

        player.play()

        let totalDuration = tones.map { $0.delay + $0.duration }.max() ?? 1.0
        DispatchQueue.main.asyncAfter(deadline: .now() + totalDuration + 0.5) { [weak self] in
            self?.audioEngine?.stop()
            self?.audioEngine = nil
            self?.playerNode = nil
        }
    }

    private func createSineBuffer(frequency: Float, duration: TimeInterval, sampleRate: Double) -> AVAudioPCMBuffer {
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!, frameCapacity: frameCount) else {
            fatalError("Could not create buffer")
        }
        buffer.frameLength = frameCount

        guard let channelData = buffer.floatChannelData?[0] else { return buffer }

        for i in 0..<Int(frameCount) {
            let t = Float(i) / Float(sampleRate)
            let envelope = 1.0 - (Float(i) / Float(frameCount))
            channelData[i] = sin(2 * .pi * frequency * t) * 0.3 * envelope
        }

        return buffer
    }
}
