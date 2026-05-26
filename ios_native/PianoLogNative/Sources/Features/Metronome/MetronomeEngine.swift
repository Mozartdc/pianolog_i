import AVFoundation
import Foundation

final class MetronomeEngine {
    var onBeatChange: ((Int, UInt64, UInt64) -> Void)?
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
    private let callbackQueue = DispatchQueue(label: "metronome.callback", qos: .userInteractive)
    private let callbackStateLock = NSLock()
    private let beatTimerLock = NSLock()
    private let renderFormat = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
    private var schedulerTimer: DispatchSourceTimer?
    private var beatCallbackTimers: [UInt64: DispatchSourceTimer] = [:]
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
    private var callbackStateUIUpdatesEnabled = true
    private var uiUpdatesEnabled = true

    private let foregroundLookaheadSeconds: Double = 0.20
    private let backgroundLookaheadSeconds: Double = 90.0
    private let foregroundSchedulerTickSeconds: Double = 0.025
    private let backgroundSchedulerTickSeconds: Double = 0.20
    private let initialLeadSeconds: Double = 0.10
    private var isBackgroundPlaybackPhase = false

    private var interruptionObserver: NSObjectProtocol?
    private var engineConfigObserver: NSObjectProtocol?
    private var routeChangeObserver: NSObjectProtocol?
    // 인터럽션 시작 시점에 재생 중이었는지 기록한다.
    // iOS가 인터럽션 중에 MPRemoteCommandCenter.pauseCommand를 보내면
    // ViewModel → engine.stop() → isPlaying = false가 되어
    // 인터럽션 종료 시 recoverAfterInterruption()의 guard isPlaying이 통과하지 못한다.
    // wasPlayingBeforeInterruption으로 인터럽션 시작 당시 상태를 보존해 이 문제를 해결한다.
    private var wasPlayingBeforeInterruption = false

    init() {
        // 지연 초기화: TabView 사전 로드시 오디오 엔진 선기동을 막아 UI 랙을 줄인다.

        // 오디오 세션 인터럽션 복구 (전화, Siri, 시스템 사운드 등)
        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: nil,
            queue: nil
        ) { [weak self] notification in
            guard let self,
                  let info = notification.userInfo,
                  let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: typeValue)
            else { return }

            switch type {
            case .began:
                // 인터럽션 시작: 현재 재생 상태를 저장한다.
                // 이 시점에서 isPlaying을 읽어야 하므로 schedulerQueue에서 실행한다.
                self.schedulerQueue.async { [weak self] in
                    guard let self else { return }
                    self.wasPlayingBeforeInterruption = self.isPlaying
                }
            case .ended:
                // 인터럽션 종료: 인터럽션 전에 재생 중이었으면 강제 복구한다.
                // shouldResume = false 여도 메트로놈은 항상 재개 — 사용자가 명시적으로 시작한 것.
                // isPlaying이 pauseCommand로 인해 false가 되어 있어도 복구해야 하므로
                // wasPlayingBeforeInterruption을 기준으로 판단한다.
                self.schedulerQueue.async { [weak self] in
                    guard let self else { return }
                    guard self.wasPlayingBeforeInterruption else { return }
                    self.wasPlayingBeforeInterruption = false
                    // pauseCommand로 인해 isPlaying이 false가 된 경우 복원한다.
                    if !self.isPlaying {
                        self.isPlaying = true
                        self.syncCallbackStateLocked()
                    }
                    self.recoverAfterInterruptionLocked()
                }
            @unknown default:
                break
            }
        }

        // AVAudioEngine 구성 변경 복구 (블루투스 연결/해제 등)
        // 엔진이 실제로 멈춘 경우에만 전체 복구한다.
        // 실행 중이면 세션 재활성화만 수행한다 — 불필요한 전체 복구는
        // beatCallbackSessionID를 올려 깜빡임·박자 동기화를 깨뜨린다.
        engineConfigObserver = NotificationCenter.default.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: nil,
            queue: nil
        ) { [weak self] _ in
            guard let self else { return }
            self.schedulerQueue.async { [weak self] in
                guard let self else { return }
                guard self.isPlaying else { return }
                if self.audioEngine.isRunning {
                    // 엔진이 살아있으면 세션만 재활성화
                    self.reactivateAudioSessionLocked()
                } else {
                    // 엔진이 멈췄을 때만 완전 복구
                    self.recoverAfterInterruptionLocked()
                }
            }
        }

        // 오디오 라우팅 변경 복구 (블루투스 헤드폰 해제, 기기 깨어남 등)
        // routeChangeNotification은 interruptionNotification 없이 발생하는 경우가 많아
        // 별도로 처리해야 1분 후 재생 중단을 방지할 수 있다.
        routeChangeObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: nil,
            queue: nil
        ) { [weak self] notification in
            guard let self,
                  let info = notification.userInfo,
                  let reasonValue = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue)
            else { return }
            switch reason {
            case .oldDeviceUnavailable, .wakeFromSleep:
                // 이전 장치 제거(블루투스 해제) 또는 화면 잠금 해제 시 복구
                self.recoverAfterInterruption()
            default:
                break
            }
        }
    }

    deinit {
        if let interruptionObserver { NotificationCenter.default.removeObserver(interruptionObserver) }
        if let engineConfigObserver { NotificationCenter.default.removeObserver(engineConfigObserver) }
        if let routeChangeObserver { NotificationCenter.default.removeObserver(routeChangeObserver) }
    }

    private func syncCallbackStateLocked() {
        callbackStateLock.lock()
        callbackStateIsPlaying = isPlaying
        callbackStateSessionID = beatCallbackSessionID
        callbackStateUIUpdatesEnabled = uiUpdatesEnabled
        callbackStateLock.unlock()
    }

    private func isValidCallbackSession(_ sessionID: UInt64) -> Bool {
        callbackStateLock.lock()
        defer { callbackStateLock.unlock() }
        return callbackStateIsPlaying && callbackStateSessionID == sessionID && callbackStateUIUpdatesEnabled
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
            cancelAllBeatCallbacksLocked()
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
            cancelAllBeatCallbacksLocked()
            playerNode.stop()
            // 재생 종료 시 오디오 세션을 비활성화하여 다른 앱(음악, 팟캐스트 등)이
            // 오디오를 재개할 수 있도록 .notifyOthersOnDeactivation 옵션을 사용한다.
            do {
                try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            } catch {}
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
            // 재생 중 BPM 변경 시 player 큐와 beat callback을 모두 초기화한다.
            // backgroundLookaheadSeconds = 90 이므로 큐에 최대 90초치가 쌓일 수 있다.
            // beatCallbackSessionID를 올리지 않으면 이전 BPM의 beat callback이 계속 발화해
            // flash 타이밍이 어긋나고 시각 동기화가 깨진다.
            if previousBpm != self.bpm {
                beatCallbackSessionID &+= 1
                syncCallbackStateLocked()
                cancelAllBeatCallbacksLocked()
                playerNode.stop()
                playerNode.play()
                nextEventHostTime = mach_absolute_time() + AVAudioTime.hostTime(forSeconds: 0.03)
                scheduleLookaheadLocked()
            }
        }
    }

    // schedulerQueue 내부에서 호출하는 동기 복구. 외부에서 직접 호출 금지.
    private func recoverAfterInterruptionLocked() {
        reactivateAudioSessionLocked()
        startAudioEngineIfNeededLocked()
        // 이전 beatCallback 타이머들을 모두 무효화한다.
        // sessionID를 올리지 않으면 이전 콜백과 새 콜백이 동시에 실행되어
        // 소리가 겹치고 깜빡임이 어긋난다.
        beatCallbackSessionID &+= 1
        syncCallbackStateLocked()
        cancelAllBeatCallbacksLocked()
        // 기존 스케줄 큐를 비우고 재시작
        playerNode.stop()
        playerNode.play()
        nextEventHostTime = mach_absolute_time() + AVAudioTime.hostTime(forSeconds: initialLeadSeconds)
        restartSchedulerLocked()
        scheduleLookaheadLocked()
    }

    func recoverAfterInterruption() {
        schedulerQueue.async { [self] in
            guard isPlaying else { return }
            recoverAfterInterruptionLocked()
        }
    }

    func setApplicationBackgroundState(_ isBackground: Bool) {
        schedulerQueue.async { [self] in
            isBackgroundPlaybackPhase = isBackground
            guard isPlaying else { return }

            if isBackground {
                // 백그라운드 진입: 세션 재활성화 후 90초치 오디오 선예약
                reactivateAudioSessionLocked()
                restartSchedulerLocked()
                scheduleLookaheadLocked()
            } else {
                // 포그라운드 복귀:
                // setUIUpdatesEnabled(true)가 별도 async로 나중에 도착하므로,
                // 여기서 먼저 uiUpdatesEnabled를 true로 올려야
                // 아래 scheduleLookaheadLocked()에서 beat callback이 정상 생성된다.
                // 순서가 틀리면 callbackStateUIUpdatesEnabled = false 상태로
                // scheduleBeatCallback()이 호출되어 콜백이 만들어지지 않고,
                // nextEventHostTime이 90초 앞에 있어 이후 스케줄러도 콜백을 안 만든다.
                uiUpdatesEnabled = true
                syncCallbackStateLocked()
                // 백그라운드에서 쌓인 기존 콜백 정리 후 오디오 큐 플러시+재시작.
                // playerNode.stop() → 100ms 갭 후 재개되지만
                // 포그라운드 복귀 시 즉각적인 flash 동기화가 더 중요하다.
                cancelAllBeatCallbacksLocked()
                playerNode.stop()
                playerNode.play()
                nextEventHostTime = mach_absolute_time() + AVAudioTime.hostTime(forSeconds: initialLeadSeconds)
                restartSchedulerLocked()
                scheduleLookaheadLocked()
            }
        }
    }

    func setUIUpdatesEnabled(_ enabled: Bool) {
        schedulerQueue.async { [self] in
            uiUpdatesEnabled = enabled
            syncCallbackStateLocked()
        }
    }

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            // .mixWithOthers: iOS가 이 앱을 "보조 오디오 소스"로 분류해
            // NowPlaying 앱 자동 등록을 막는다 → Dynamic Island 회색 스피커 pill 방지.
            // UIBackgroundModes.audio(Info.plist)가 설정되어 있으므로
            // .mixWithOthers를 사용해도 백그라운드에서 무제한 재생이 보장된다.
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
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

    private func callbackKey(hostTime: UInt64, sessionID: UInt64) -> UInt64 {
        (sessionID &* 11400714819323198485) ^ hostTime
    }

    private func cancelAllBeatCallbacksLocked() {
        beatTimerLock.lock()
        let timers = beatCallbackTimers
        beatCallbackTimers.removeAll()
        beatTimerLock.unlock()

        for (_, timer) in timers {
            timer.cancel()
        }
    }

    private func scheduleLookaheadLocked() {
        guard isPlaying else { return }

        // 백그라운드에서 엔진이 notification 없이 조용히 멈추는 경우를 감지하여 복구한다.
        if isBackgroundPlaybackPhase && !audioEngine.isRunning {
            reactivateAudioSessionLocked()
            startAudioEngineIfNeededLocked()
            // 엔진 재시작 시 이전 sessionID의 beat callback이 살아있으면
            // 타이밍이 어긋난 콜백이 중복 발화하므로 반드시 먼저 무효화한다.
            beatCallbackSessionID &+= 1
            syncCallbackStateLocked()
            cancelAllBeatCallbacksLocked()
            // 엔진이 멈췄다 재시작되면 playerNode 큐도 초기화해야 한다.
            playerNode.stop()
            playerNode.play()
            nextEventHostTime = mach_absolute_time() + AVAudioTime.hostTime(forSeconds: initialLeadSeconds)
        }

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
                    cancelAllBeatCallbacksLocked()
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
        guard isValidCallbackSession(sessionID) else { return }
        let nowHost = mach_absolute_time()
        let delayHost = hostTime > nowHost ? hostTime - nowHost : 0
        let delay = AVAudioTime.seconds(forHostTime: delayHost)

        let key = callbackKey(hostTime: hostTime, sessionID: sessionID)
        let timer = DispatchSource.makeTimerSource(queue: callbackQueue)
        beatTimerLock.lock()
        beatCallbackTimers[key] = timer
        beatTimerLock.unlock()
        timer.schedule(deadline: .now() + delay, leeway: .nanoseconds(0))
        timer.setEventHandler { [weak self] in
            guard let self else {
                timer.cancel()
                return
            }
            self.beatTimerLock.lock()
            self.beatCallbackTimers[key] = nil
            self.beatTimerLock.unlock()
            guard self.isValidCallbackSession(sessionID) else {
                timer.cancel()
                return
            }
            let firedHostTime = mach_absolute_time()
            if firedHostTime > hostTime {
                let lagSeconds = AVAudioTime.seconds(forHostTime: firedHostTime - hostTime)
                // Drop stale callbacks aggressively before touching main.
                // At 120 BPM this keeps visual lag under roughly one quarter-beat.
                if lagSeconds >= 0.12 {
                    timer.cancel()
                    return
                }
            }
            guard self.isValidCallbackSession(sessionID) else {
                timer.cancel()
                return
            }
            let deliveredHostTime = mach_absolute_time()
            self.onBeatChange?(beat, hostTime, deliveredHostTime)
#if DEBUG
            self.logBeatCallbackTiming(
                beat: beat,
                scheduledHostTime: hostTime,
                deliveredHostTime: deliveredHostTime
            )
#endif
            timer.cancel()
        }
        timer.resume()
    }

#if DEBUG
    private enum BeatSyncThresholds {
        static let warnMs: Double = 8.0
        static let criticalMs: Double = 16.0
    }

    /// BeatSync 로그는 기본 OFF.
    /// 필요할 때만 Scheme Environment에서 `METRONOME_BEATSYNC_LOG=1`로 활성화.
    private static let beatSyncLogEnabled =
        ProcessInfo.processInfo.environment["METRONOME_BEATSYNC_LOG"] == "1"

    private func logBeatCallbackTiming(
        beat: Int,
        scheduledHostTime: UInt64,
        deliveredHostTime: UInt64
    ) {
        let skewMs: Double
        if deliveredHostTime >= scheduledHostTime {
            let delta = deliveredHostTime - scheduledHostTime
            skewMs = AVAudioTime.seconds(forHostTime: delta) * 1000.0
        } else {
            let delta = scheduledHostTime - deliveredHostTime
            skewMs = -AVAudioTime.seconds(forHostTime: delta) * 1000.0
        }

        let absSkew = abs(skewMs)
        let mark: String
        if absSkew >= BeatSyncThresholds.criticalMs {
            mark = " ⚠️16ms+"
        } else if absSkew >= BeatSyncThresholds.warnMs {
            mark = " ⚠️8ms+"
        } else {
            mark = ""
        }

        guard Self.beatSyncLogEnabled else { return }
        guard !mark.isEmpty else { return }
        print("[BeatSync] beat=\(beat) skew=\(String(format: "%.2f", skewMs))ms\(mark)")
    }
#endif

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
                text = String(
                    format: String(localized: "metronome.training.status.bars.format"),
                    min(currentBarIndexLocked(), total),
                    total
                )
            case .duration:
                let remain = max(0, trainingConfig.songLengthDurationSeconds - Int(floor(elapsedSecondsLocked())))
                let minPart = remain / 60
                let secPart = remain % 60
                text = String(
                    format: String(localized: "metronome.training.status.remaining.format"),
                    minPart,
                    secPart
                )
            }
        case .progressiveTempo:
            text = nil  // BPM은 다이얼에서 직접 표시되므로 여기선 불필요
        case .mutePattern:
            text = trainingConfig.muteBasis == .off
                ? nil
                : String(
                    localized: isCurrentTrainingBarMutedLocked()
                        ? "metronome.training.mute.state.silent"
                        : "metronome.training.mute.state.sound"
                )
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
