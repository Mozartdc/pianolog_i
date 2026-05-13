import AVFoundation
import Foundation

final class MetronomeEngine {
    var onBeatChange: ((Int) -> Void)?
    var onStop: (() -> Void)?
    var onTrainingStatusChange: ((String?) -> Void)?

    struct TrainingConfig {
        var mode: RhythmTrainingMode
        var songLengthBasis: TrainingBasis
        var songLengthBars: Int
        var songLengthDurationSeconds: Int
        var progressiveBasis: TrainingBasis
        var progressiveBarsStep: Int
        var progressiveBarsInterval: Int
        var progressiveBarsLimit: Int
        var progressiveDurationStep: Int
        var progressiveDurationInterval: Int
        var progressiveDurationLimit: Int
        var muteBasis: TrainingBasis
        var muteBarsPlayLength: Int
        var muteBarsMuteLength: Int
        var muteDurationPlayLength: Int
        var muteDurationMuteLength: Int
    }

    struct SoundConfig {
        var preset: MetronomeSoundPreset
        var soundEnabled: Bool
        var volume: Double
        var accentGain: Double
    }

    private let audioEngine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private let schedulerQueue = DispatchQueue(label: "metronome.scheduler", qos: .userInteractive)
    private let callbackStateLock = NSLock()
    private let renderFormat = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
    private var schedulerTimer: DispatchSourceTimer?
    private var isPrepared = false

    private var accentBuffer: AVAudioPCMBuffer?
    private var strongBuffer: AVAudioPCMBuffer?
    private var weakBuffer: AVAudioPCMBuffer?
    private var mechanicalStrongSampleBuffer: AVAudioPCMBuffer?
    private var mechanicalAccentSampleBuffer: AVAudioPCMBuffer?
    private var mechanicalWeakSampleBuffer: AVAudioPCMBuffer?

    private var isPlaying = false
    private var bpm = 120
    private var baseBPM = 120
    private var effectiveBPM = 120
    private var signature = TimeSignature(numerator: 4, denominator: 4)
    private var subdivision: RhythmSubdivision = .oneBeat
    private var beatPattern: [BeatStrength] = [.accent, .strong, .strong, .strong]
    private var trainingConfig = TrainingConfig(
        mode: .none,
        songLengthBasis: .off,
        songLengthBars: 1,
        songLengthDurationSeconds: 0,
        progressiveBasis: .off,
        progressiveBarsStep: 1,
        progressiveBarsInterval: 1,
        progressiveBarsLimit: 120,
        progressiveDurationStep: 1,
        progressiveDurationInterval: 5,
        progressiveDurationLimit: 120,
        muteBasis: .off,
        muteBarsPlayLength: 1,
        muteBarsMuteLength: 1,
        muteDurationPlayLength: 1,
        muteDurationMuteLength: 1
    )
    // PWA default sound settings: mechanical / volume 0.7 / accentGain 1.5
    private var soundConfig = SoundConfig(preset: .mechanical, soundEnabled: true, volume: 0.7, accentGain: 1.5)

    private var beatIndex = 0
    private var tickIndex = 0
    private var beatsScheduled = 0
    private var startHostTime: UInt64 = 0
    private var nextEventHostTime: UInt64 = 0
    private var beatCallbackSessionID: UInt64 = 0
    private var callbackStateIsPlaying = false
    private var callbackStateSessionID: UInt64 = 0

    private let foregroundLookaheadSeconds: Double = 0.20
    private let backgroundLookaheadSeconds: Double = 12.0
    private let foregroundSchedulerTickSeconds: Double = 0.025
    private let backgroundSchedulerTickSeconds: Double = 0.20
    private let initialLeadSeconds: Double = 0.10
    private var isBackgroundPlaybackPhase = false

    init() {
        // 지연 초기화: TabView 사전 로드시 오디오 엔진 선기동을 막아 UI 랙을 줄인다.
    }

    private func syncCallbackStateLocked() {
        callbackStateLock.lock()
        callbackStateIsPlaying = isPlaying
        callbackStateSessionID = beatCallbackSessionID
        callbackStateLock.unlock()
    }

    private func isValidCallbackSession(_ sessionID: UInt64) -> Bool {
        callbackStateLock.lock()
        defer { callbackStateLock.unlock() }
        return callbackStateIsPlaying && callbackStateSessionID == sessionID
    }

    // UI thread에서 재생 상태를 읽을 때 사용 (schedulerQueue 내부에서는 호출 금지).
    var isPlayingNow: Bool {
        schedulerQueue.sync { isPlaying }
    }

    func start(
        bpm: Int,
        signature: TimeSignature,
        subdivision: RhythmSubdivision,
        beatPattern: [BeatStrength],
        training: TrainingConfig,
        sound: SoundConfig
    ) {
        schedulerQueue.async { [self] in
            self.bpm = max(20, min(400, bpm))
            baseBPM = self.bpm
            effectiveBPM = self.bpm
            self.signature = signature
            self.subdivision = subdivision
            self.beatPattern = beatPattern
            trainingConfig = training
            soundConfig = sound
            beatIndex = 0
            tickIndex = 0
            beatsScheduled = 0
            beatCallbackSessionID &+= 1
            syncCallbackStateLocked()

            stopSchedulerLocked()
            prepareIfNeededLocked()
            startAudioEngineIfNeededLocked()
            buildDefaultBuffers()
            playerNode.stop()
            playerNode.play()

            isPlaying = true
            syncCallbackStateLocked()
            startHostTime = mach_absolute_time()
            nextEventHostTime = startHostTime + AVAudioTime.hostTime(forSeconds: initialLeadSeconds)
            // 첫 박도 타이머 첫 틱 대기 없이 즉시 lookahead 스케줄링한다.
            scheduleLookaheadLocked()
            scheduleLoopLocked()
        }
    }

    func stop() {
        schedulerQueue.async { [self] in
            beatCallbackSessionID &+= 1
            isPlaying = false
            syncCallbackStateLocked()
            stopSchedulerLocked()
            playerNode.stop()
            DispatchQueue.main.async { [weak self] in
                self?.onStop?()
            }
        }
    }

    func updateConfig(
        bpm: Int,
        signature: TimeSignature,
        subdivision: RhythmSubdivision,
        beatPattern: [BeatStrength],
        training: TrainingConfig,
        sound: SoundConfig
    ) {
        schedulerQueue.async { [self] in
            let previousBpm = self.bpm
            let previousSound = soundConfig
            self.bpm = max(20, min(400, bpm))
            baseBPM = self.bpm
            self.signature = signature
            self.subdivision = subdivision
            self.beatPattern = beatPattern
            trainingConfig = training
            soundConfig = sound

            guard isPlaying else { return }
            prepareIfNeededLocked()
            if previousSound.preset != sound.preset || abs(previousSound.volume - sound.volume) > 0.0001 {
                buildDefaultBuffers()
            }
            // Phase 1-4: 재생 중 BPM 변경 시 lookahead 즉시 플러시
            if previousBpm != self.bpm {
                nextEventHostTime = mach_absolute_time() + AVAudioTime.hostTime(forSeconds: 0.03)
            }
        }
    }

    func recoverAfterInterruption() {
        schedulerQueue.async { [self] in
            guard isPlaying else { return }
            prepareIfNeededLocked()
            reactivateAudioSessionLocked()
            startAudioEngineIfNeededLocked()
            if !playerNode.isPlaying {
                playerNode.play()
            }
        }
    }

    func setApplicationBackgroundState(_ isBackground: Bool) {
        schedulerQueue.async { [self] in
            isBackgroundPlaybackPhase = isBackground
            guard isPlaying else { return }

            // 백그라운드 진입 시 세션을 재활성화하고, 더 긴 lookahead를 즉시 채워
            // 타이머 코얼레싱으로 인한 2~3박 후 끊김을 방지한다.
            if isBackground {
                reactivateAudioSessionLocked()
            }
            restartSchedulerLocked()
            scheduleLookaheadLocked()
        }
    }

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            // Dynamic Island / Lock Screen now playing 노출을 위해
            // 보조 믹싱 세션(.mixWithOthers) 대신 주 재생 세션으로 등록한다.
            try session.setCategory(.playback, mode: .default, policy: .longFormAudio, options: [])
            try session.setActive(true)
        } catch {}
    }

    private func reactivateAudioSessionLocked() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setActive(true)
        } catch {}
    }

    private func configureEngine() {
        audioEngine.attach(playerNode)
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: renderFormat)
        audioEngine.prepare()
        startAudioEngineIfNeededLocked()
    }

    private func prepareIfNeededLocked() {
        guard !isPrepared else { return }
        configureAudioSession()
        configureEngine()
        loadMechanicalSampleBuffersIfNeeded()
        buildDefaultBuffers()
        isPrepared = true
    }

    private func startAudioEngineIfNeededLocked() {
        guard !audioEngine.isRunning else { return }
        do {
            try audioEngine.start()
        } catch {}
    }

    private func buildDefaultBuffers() {
        let clampedVolume = soundConfig.soundEnabled ? max(0.0, min(1.0, soundConfig.volume)) : 0.0
        let clampedAccentGain = max(1.0, min(2.0, soundConfig.accentGain))
        let v = Float(clampedVolume)
        let pwaAccentScale = min(2.0, Float(clampedAccentGain))

        if soundConfig.preset == .mechanical {
            loadMechanicalSampleBuffersIfNeeded()

            if let strong = mechanicalStrongSampleBuffer,
               let accent = mechanicalAccentSampleBuffer,
               let weak = mechanicalWeakSampleBuffer
            {
                strongBuffer = scaledBuffer(from: strong, gain: v)
                // PWA mechanical_accent는 재생 시 0.3초까지만 사용한다.
                let trimmedAccent = trimmedBuffer(accent, maxDuration: 0.3) ?? accent
                accentBuffer = scaledBuffer(from: trimmedAccent, gain: pwaAccentScale * v)
                // PWA 약박 기계식은 기본보다 작게 들리도록 감쇠.
                weakBuffer = scaledBuffer(from: weak, gain: 0.58 * v)
                return
            }
        }

        // PWA SoundBank.getSoundParams 기준 주파수/길이와 동기화
        let (baseFrequency, baseDuration): (Double, Double)
        switch soundConfig.preset {
        case .beep:
            (baseFrequency, baseDuration) = (980, 0.08)
        case .click:
            (baseFrequency, baseDuration) = (1800, 0.035)
        case .woodBlock:
            (baseFrequency, baseDuration) = (420, 0.14)
        case .woodClap:
            (baseFrequency, baseDuration) = (680, 0.09)
        case .shaker:
            (baseFrequency, baseDuration) = (6000, 0.06)
        case .tambourine:
            (baseFrequency, baseDuration) = (2400, 0.17)
        case .pendulum:
            (baseFrequency, baseDuration) = (520, 0.18)
        case .marimba:
            (baseFrequency, baseDuration) = (440, 0.24)
        case .xylophone:
            (baseFrequency, baseDuration) = (980, 0.22)
        case .mechanical:
            (baseFrequency, baseDuration) = (1450, 0.065)
        case .mechanicalAccent:
            (baseFrequency, baseDuration) = (1700, 0.06)
        case .mechanicalWeak:
            (baseFrequency, baseDuration) = (1280, 0.07)
        }

        // PWA 규칙: strong/accent는 accentGain 적용, weak는 기본 볼륨
        let baseAmp: Float = 0.88
        let strongOrAccentAmp = min(1.0, baseAmp * pwaAccentScale) * v
        let weakAmp = baseAmp * v

        accentBuffer = makeClickBuffer(format: renderFormat, frequency: baseFrequency, duration: baseDuration, amplitude: strongOrAccentAmp)
        strongBuffer = makeClickBuffer(format: renderFormat, frequency: baseFrequency, duration: baseDuration, amplitude: strongOrAccentAmp)
        weakBuffer = makeClickBuffer(format: renderFormat, frequency: baseFrequency, duration: baseDuration, amplitude: weakAmp)
    }

    private func makeClickBuffer(
        format: AVAudioFormat,
        frequency: Double,
        duration: Double,
        amplitude: Float
    ) -> AVAudioPCMBuffer? {
        let frameCount = AVAudioFrameCount(format.sampleRate * duration)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return nil }
        buffer.frameLength = frameCount
        guard let channel = buffer.floatChannelData?[0] else { return nil }

        let sampleRate = format.sampleRate
        let attack = max(1, Int(sampleRate * 0.0015))
        let release = max(1, Int(sampleRate * 0.008))
        let count = Int(frameCount)

        for i in 0..<count {
            let t = Double(i) / sampleRate
            let base = sin(2 * .pi * frequency * t)
            let env: Float
            if i < attack {
                env = Float(i) / Float(attack)
            } else if i > count - release {
                env = Float(count - i) / Float(release)
            } else {
                env = 1
            }
            channel[i] = Float(base) * amplitude * max(0, env)
        }
        return buffer
    }

    private func loadMechanicalSampleBuffersIfNeeded() {
        guard mechanicalStrongSampleBuffer == nil || mechanicalAccentSampleBuffer == nil || mechanicalWeakSampleBuffer == nil else {
            return
        }

        mechanicalStrongSampleBuffer = loadSampleBuffer(named: "mechanical_strong")
        mechanicalAccentSampleBuffer = loadSampleBuffer(named: "mechanical_accent")
        mechanicalWeakSampleBuffer = loadSampleBuffer(named: "mechanical_weak")
    }

    private func loadSampleBuffer(named fileName: String) -> AVAudioPCMBuffer? {
        let resourceSubdir = "Sounds"
        let url = Bundle.main.url(forResource: fileName, withExtension: "wav", subdirectory: resourceSubdir)
            ?? Bundle.main.url(forResource: fileName, withExtension: "wav")
        guard let url else { return nil }
        guard let audioFile = try? AVAudioFile(forReading: url) else { return nil }

        let sourceFormat = audioFile.processingFormat
        let sourceFrameCount = AVAudioFrameCount(audioFile.length)
        guard let sourceBuffer = AVAudioPCMBuffer(
            pcmFormat: sourceFormat,
            frameCapacity: sourceFrameCount
        ) else { return nil }
        do {
            try audioFile.read(into: sourceBuffer)
        } catch {
            return nil
        }

        if sourceFormat == renderFormat {
            return sourceBuffer
        }
        return convertedBuffer(from: sourceBuffer, to: renderFormat)
    }

    private func convertedBuffer(from input: AVAudioPCMBuffer, to outputFormat: AVAudioFormat) -> AVAudioPCMBuffer? {
        guard let converter = AVAudioConverter(from: input.format, to: outputFormat) else { return nil }
        let ratio = outputFormat.sampleRate / input.format.sampleRate
        let expectedFrames = AVAudioFrameCount(Double(input.frameLength) * ratio) + 8
        guard let outputBuffer = AVAudioPCMBuffer(
            pcmFormat: outputFormat,
            frameCapacity: max(1, expectedFrames)
        ) else { return nil }

        var didProvideInput = false
        var convertError: NSError?
        let status = converter.convert(to: outputBuffer, error: &convertError) { _, outStatus in
            if didProvideInput {
                outStatus.pointee = .noDataNow
                return nil
            }
            didProvideInput = true
            outStatus.pointee = .haveData
            return input
        }

        guard convertError == nil else { return nil }
        guard status == .haveData || status == .inputRanDry || status == .endOfStream else { return nil }
        return outputBuffer
    }

    private func trimmedBuffer(_ source: AVAudioPCMBuffer, maxDuration: Double) -> AVAudioPCMBuffer? {
        let maxFrames = AVAudioFrameCount(renderFormat.sampleRate * maxDuration)
        let frameLength = min(source.frameLength, maxFrames)
        guard frameLength > 0 else { return nil }
        guard let trimmed = AVAudioPCMBuffer(pcmFormat: renderFormat, frameCapacity: frameLength) else { return nil }
        trimmed.frameLength = frameLength
        guard let src = source.floatChannelData?[0], let dst = trimmed.floatChannelData?[0] else { return nil }
        dst.update(from: src, count: Int(frameLength))
        return trimmed
    }

    private func scaledBuffer(from source: AVAudioPCMBuffer, gain: Float) -> AVAudioPCMBuffer? {
        let frameLength = source.frameLength
        guard frameLength > 0 else { return nil }
        guard let out = AVAudioPCMBuffer(pcmFormat: renderFormat, frameCapacity: frameLength) else { return nil }
        out.frameLength = frameLength
        guard let src = source.floatChannelData?[0], let dst = out.floatChannelData?[0] else { return nil }

        let count = Int(frameLength)
        for i in 0..<count {
            let value = src[i] * gain
            dst[i] = min(1.0, max(-1.0, value))
        }
        return out
    }

    private func scheduleLoopLocked() {
        let timer = DispatchSource.makeTimerSource(queue: schedulerQueue)
        timer.schedule(deadline: .now(), repeating: currentSchedulerTickSecondsLocked())
        timer.setEventHandler { [weak self] in
            self?.scheduleLookaheadLocked()
        }
        timer.resume()
        schedulerTimer = timer
    }

    private func restartSchedulerLocked() {
        stopSchedulerLocked()
        scheduleLoopLocked()
    }

    private func stopSchedulerLocked() {
        schedulerTimer?.cancel()
        schedulerTimer = nil
    }

    private func scheduleLookaheadLocked() {
        guard isPlaying else { return }
        let nowHost = mach_absolute_time()
        let lookaheadHost = nowHost + AVAudioTime.hostTime(forSeconds: currentLookaheadSecondsLocked())

        while nextEventHostTime <= lookaheadHost {
            let tickPerBeat = max(1, subdivision.ticksPerBeat)
            let localTick = tickIndex % tickPerBeat
            let isDownbeatTick = localTick == 0
            let shouldSoundTick = subdivision.tickPattern.indices.contains(localTick)
                ? subdivision.tickPattern[localTick] == 1
                : true

            if isDownbeatTick {
                if shouldStopForPhraseLengthLocked() {
                    isPlaying = false
                    stopSchedulerLocked()
                    beatCallbackSessionID &+= 1
                    syncCallbackStateLocked()
                    DispatchQueue.main.async { [weak self] in
                        self?.onStop?()
                    }
                    break
                }
                let beat = beatIndex
                scheduleMainBeatLocked(beat: beat, at: nextEventHostTime, shouldSound: shouldSoundTick)
                scheduleBeatCallback(beat: beat, hostTime: nextEventHostTime, sessionID: beatCallbackSessionID)
                beatIndex = (beatIndex + 1) % max(1, signature.numerator)
                beatsScheduled += 1
                updateTrainingStatusLocked()
            } else {
                scheduleSubdivisionTickLocked(at: nextEventHostTime, shouldSound: shouldSoundTick)
            }

            tickIndex += 1
            nextEventHostTime += AVAudioTime.hostTime(forSeconds: tickDurationSeconds())
        }
    }

    private func tickDurationSeconds() -> Double {
        let beatDuration = (60.0 / Double(effectiveBPM)) * (4.0 / Double(max(1, signature.denominator)))
        return beatDuration / Double(max(1, subdivision.ticksPerBeat))
    }

    private func currentLookaheadSecondsLocked() -> Double {
        isBackgroundPlaybackPhase ? backgroundLookaheadSeconds : foregroundLookaheadSeconds
    }

    private func currentSchedulerTickSecondsLocked() -> Double {
        isBackgroundPlaybackPhase ? backgroundSchedulerTickSeconds : foregroundSchedulerTickSeconds
    }

    private func scheduleMainBeatLocked(beat: Int, at hostTime: UInt64, shouldSound: Bool) {
        updateEffectiveBPMLocked()
        guard shouldSound else { return }
        let strength = strengthForCurrentTrainingBarLocked(beat: beat)
        let buffer: AVAudioPCMBuffer?
        switch strength {
        case .accent:
            buffer = accentBuffer
        case .strong:
            buffer = strongBuffer
        case .weak:
            buffer = weakBuffer
        case .silent:
            buffer = nil
        }
        guard let buffer else { return }
        playerNode.scheduleBuffer(buffer, at: AVAudioTime(hostTime: hostTime), options: [], completionHandler: nil)
    }

    private func scheduleSubdivisionTickLocked(at hostTime: UInt64, shouldSound: Bool) {
        guard shouldSound else { return }
        if isCurrentTrainingBarMutedLocked() { return }
        guard let weakBuffer else { return }
        playerNode.scheduleBuffer(weakBuffer, at: AVAudioTime(hostTime: hostTime), options: [], completionHandler: nil)
    }

    private func scheduleBeatCallback(beat: Int, hostTime: UInt64, sessionID: UInt64) {
        let nowHost = mach_absolute_time()
        let delayHost = hostTime > nowHost ? hostTime - nowHost : 0
        let delay = AVAudioTime.seconds(forHostTime: delayHost)

        // 오디오 hostTime 기준 지연을 그대로 메인 큐에 반영해 UI 시점을 맞춘다.
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self else { return }
            guard self.isValidCallbackSession(sessionID) else { return }
            self.onBeatChange?(beat)
        }
    }

    private func currentBarIndexLocked() -> Int {
        let numerator = max(1, signature.numerator)
        return beatsScheduled / numerator
    }

    private func shouldStopForPhraseLengthLocked() -> Bool {
        guard trainingConfig.mode == .phraseLength else { return false }
        switch trainingConfig.songLengthBasis {
        case .off:
            return false
        case .bars:
            return currentBarIndexLocked() >= max(1, trainingConfig.songLengthBars)
        case .duration:
            let elapsed = elapsedSecondsLocked()
            return elapsed >= Double(max(0, trainingConfig.songLengthDurationSeconds))
        }
    }

    private func isCurrentTrainingBarMutedLocked() -> Bool {
        guard trainingConfig.mode == .mutePattern else { return false }
        switch trainingConfig.muteBasis {
        case .off:
            return false
        case .bars:
            let playBars = max(1, trainingConfig.muteBarsPlayLength)
            let muteBars = max(1, trainingConfig.muteBarsMuteLength)
            let cycle = playBars + muteBars
            let barPhase = currentBarIndexLocked() % cycle
            return barPhase >= playBars
        case .duration:
            let play = max(1, trainingConfig.muteDurationPlayLength)
            let mute = max(1, trainingConfig.muteDurationMuteLength)
            let cycle = play + mute
            let elapsedWhole = Int(floor(elapsedSecondsLocked()))
            let phase = elapsedWhole % cycle
            return phase >= play
        }
    }

    private func strengthForCurrentTrainingBarLocked(beat: Int) -> BeatStrength {
        if isCurrentTrainingBarMutedLocked() { return .silent }
        return beatPattern.indices.contains(beat) ? beatPattern[beat] : (beat == 0 ? .accent : .strong)
    }

    private func updateEffectiveBPMLocked() {
        guard trainingConfig.mode == .progressiveTempo else {
            effectiveBPM = baseBPM
            return
        }
        switch trainingConfig.progressiveBasis {
        case .off:
            effectiveBPM = baseBPM
        case .bars:
            let interval = max(1, trainingConfig.progressiveBarsInterval)
            let step = trainingConfig.progressiveBarsStep
            let steps = currentBarIndexLocked() / interval
            let target = baseBPM + (steps * step)
            let limit = trainingConfig.progressiveBarsLimit
            if step >= 0 {
                effectiveBPM = min(max(baseBPM, limit), target)
            } else {
                effectiveBPM = max(min(baseBPM, limit), target)
            }
            effectiveBPM = max(20, min(400, effectiveBPM))
        case .duration:
            let interval = max(1, trainingConfig.progressiveDurationInterval)
            let step = trainingConfig.progressiveDurationStep
            let steps = Int(floor(elapsedSecondsLocked())) / interval
            let target = baseBPM + (steps * step)
            let limit = trainingConfig.progressiveDurationLimit
            if step >= 0 {
                effectiveBPM = min(max(baseBPM, limit), target)
            } else {
                effectiveBPM = max(min(baseBPM, limit), target)
            }
            effectiveBPM = max(20, min(400, effectiveBPM))
        }
    }

    private func updateTrainingStatusLocked() {
        let text: String?
        switch trainingConfig.mode {
        case .none:
            text = nil
        case .phraseLength:
            switch trainingConfig.songLengthBasis {
            case .off:
                text = nil
            case .bars:
                let total = max(1, trainingConfig.songLengthBars)
                text = "\(min(currentBarIndexLocked(), total))/\(total) 마디"
            case .duration:
                let remain = max(0, trainingConfig.songLengthDurationSeconds - Int(floor(elapsedSecondsLocked())))
                let minPart = remain / 60
                let secPart = remain % 60
                text = "\(minPart):\(String(format: "%02d", secPart)) 남음"
            }
        case .progressiveTempo:
            text = trainingConfig.progressiveBasis == .off ? nil : "\(effectiveBPM) BPM"
        case .mutePattern:
            text = trainingConfig.muteBasis == .off ? nil : (isCurrentTrainingBarMutedLocked() ? "무음 구간" : "소리 구간")
        }
        DispatchQueue.main.async { [weak self] in
            self?.onTrainingStatusChange?(text)
        }
    }

    private func elapsedSecondsLocked() -> Double {
        guard startHostTime > 0 else { return 0 }
        let now = mach_absolute_time()
        let delta = now > startHostTime ? now - startHostTime : 0
        return AVAudioTime.seconds(forHostTime: delta)
    }
}
