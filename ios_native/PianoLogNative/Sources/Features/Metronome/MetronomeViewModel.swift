import Foundation
import SwiftUI
import UIKit
import Combine
import AVFoundation

@MainActor
final class MetronomeBeatState: ObservableObject {
    @Published var activeBeat: Int = 0
    @Published var beatTick: Int = 0
    @Published var pulseDuration: Double = 0.10
    @Published var flashPulseOpacity: Double = 0

    func reset() {
        activeBeat = 0
        beatTick = 0
        pulseDuration = 0.10
        flashPulseOpacity = 0
    }
}

private struct ScheduledBeatEvent {
    let beat: Int
    let scheduledHostTime: UInt64
    let deliveredHostTime: UInt64
}

private final class BeatEventBuffer {
    private let lock = NSLock()
    private var events: [ScheduledBeatEvent] = []

    func append(_ event: ScheduledBeatEvent) {
        lock.lock()
        events.append(event)
        lock.unlock()
    }

    func drain(through hostTime: UInt64) -> [ScheduledBeatEvent] {
        lock.lock()
        defer { lock.unlock() }
        guard !events.isEmpty else { return [] }
        var consumed = 0
        while consumed < events.count, events[consumed].scheduledHostTime <= hostTime {
            consumed += 1
        }
        guard consumed > 0 else { return [] }
        let drained = Array(events.prefix(consumed))
        events.removeFirst(consumed)
        return drained
    }

    func clear() {
        lock.lock()
        events.removeAll(keepingCapacity: true)
        lock.unlock()
    }
}

private final class DisplayLinkProxy: NSObject {
    let onTick: () -> Void

    init(onTick: @escaping () -> Void) {
        self.onTick = onTick
    }

    @objc func tick(_ sender: CADisplayLink) {
        onTick()
    }
}

@MainActor
final class MetronomeViewModel: ObservableObject {
    struct MetronomeSession: Identifiable, Codable, Equatable {
        var id: UUID
        var title: String
        var bpm: Int
        var numerator: Int
        var denominator: Int
        var subdivision: RhythmSubdivision
        var createdAt: Date
    }

    struct TrackMetronomeSetting: Codable, Equatable {
        var trackId: Int
        var bpm: Int
        var numerator: Int
        var denominator: Int
        var updatedAt: Date
    }

    struct SessionBaseline: Equatable {
        var bpm: Int
        var numerator: Int
        var denominator: Int
    }

    enum SessionSource: String, Codable, Equatable {
        case none
        case today
        case saved
    }

    struct ActiveSession: Equatable {
        var source: SessionSource = .none
        var id: String?
        var title: String = String(localized: "metronome.session.defaultTitle")
        var hasStoredConfig: Bool = false
        var baseline: SessionBaseline?
    }

    struct LibraryItem: Identifiable, Equatable {
        enum Source: String {
            case today
            case saved
        }

        var id: String
        var source: Source
        var title: String
        var bpm: Int?
        var numerator: Int?
        var denominator: Int?
    }

    struct LastViewedSession: Codable, Equatable {
        var source: SessionSource
        var id: String
    }

    @Published var store = MetronomeStore()
    @Published var activeSession = ActiveSession()
    @Published var trainingStatusText: String?
    @Published var savedSessions: [MetronomeSession] = []
    @Published var trackSettings: [String: TrackMetronomeSetting] = [:]
    @Published var libraryItems: [LibraryItem] = []
    @Published var hasUnsavedSessionChange: Bool = true
    let beatState = MetronomeBeatState()

    private var engine: MetronomeEngine?
    private var taps: [Date] = []

    private let savedSessionsKey = "metronome.saved.sessions.v2"
    private let trackSettingsKey = "metronome.track.settings.v2"
    private let lastViewedKey = "metronome.last.viewed.session.v2"
    private let userPreferencesKey = "metronome.user.preferences.v1"
    private var didResolveLastViewed = false
    private var foregroundObserver: NSObjectProtocol?
    private var backgroundObserver: NSObjectProtocol?
    private var activeObserver: NSObjectProtocol?
    private var inactiveObserver: NSObjectProtocol?
    private var storeChangeCancellable: AnyCancellable?
    private var preferencesSaveCancellable: AnyCancellable?
    private let nowPlaying = MetronomeNowPlayingController()
    private let beatEventBuffer = BeatEventBuffer()
    private var beatDisplayLink: CADisplayLink?
    private var beatDisplayLinkProxy: DisplayLinkProxy?
    private var lastVisualizedScheduledHostTime: UInt64 = 0

    init() {
        // 사용자 환경설정 복원 (동기 로드 — 경량 UserDefaults 읽기)
        let prefs = Self.loadUserPreferences(key: userPreferencesKey)
        store.soundPreset = prefs.soundPreset
        store.soundEnabled = prefs.soundEnabled
        store.soundVolume = prefs.soundVolume
        store.accentGain = prefs.accentGain
        store.flashEnabled = prefs.flashEnabled

        storeChangeCancellable = store.objectWillChange
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in
                self?.objectWillChange.send()
            }

        // 환경설정 관련 속성 변경 시 debounce 후 저장.
        // 불필요한 쓰기를 줄이기 위해 300ms 디바운스를 사용한다.
        preferencesSaveCancellable = Publishers.MergeMany([
            store.$flashEnabled.map { _ in }.eraseToAnyPublisher(),
            store.$soundPreset.map { _ in }.eraseToAnyPublisher(),
            store.$soundEnabled.map { _ in }.eraseToAnyPublisher(),
            store.$soundVolume.map { _ in }.eraseToAnyPublisher(),
            store.$accentGain.map { _ in }.eraseToAnyPublisher()
        ])
        .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
        .sink { [weak self] in
            self?.saveUserPreferences()
        }

        nowPlaying.onPlayRequested = { [weak self] in
            Task { @MainActor in
                guard let self, !self.store.isPlaying else { return }
                self.togglePlay()
            }
        }
        nowPlaying.onPauseRequested = { [weak self] in
            Task { @MainActor in
                guard let self, self.store.isPlaying else { return }
                self.togglePlay()
            }
        }
        nowPlaying.onToggleRequested = { [weak self] in
            Task { @MainActor in
                self?.togglePlay()
            }
        }

        backgroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.engine?.setUIUpdatesEnabled(false)
                self?.engine?.setApplicationBackgroundState(true)
            }
        }

        foregroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.engine?.setApplicationBackgroundState(false)
                // recoverAfterInterruption은 여기서 호출하지 않는다.
                // 실제 인터럽션(전화, Siri 등)은 MetronomeEngine.interruptionObserver가 처리한다.
                // 포그라운드 복귀마다 무조건 호출하면 재생 중인 스케줄을 리셋해
                // 소리 겹침·깜빡임 불일치를 유발한다.
                self?.engine?.setUIUpdatesEnabled(true)
            }
        }

        activeObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.engine?.setUIUpdatesEnabled(true)
            }
        }

        inactiveObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.willResignActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.engine?.setUIUpdatesEnabled(false)
            }
        }

        Task(priority: .userInitiated) { [weak self] in
            guard let self else { return }
            let (loadedSavedSessions, loadedTrackSettings) = Self.loadPersistedState(
                savedSessionsKey: self.savedSessionsKey,
                trackSettingsKey: self.trackSettingsKey
            )
            await MainActor.run {
                self.savedSessions = loadedSavedSessions
                self.trackSettings = loadedTrackSettings
                self.syncTodayTracksFromLibraryOnly()
                self.resolveInitialSessionIfNeeded()
                self.evaluateUnsavedChange()
                self.syncNowPlaying()
            }
        }
    }

    deinit {
        beatDisplayLink?.invalidate()
        beatDisplayLink = nil
        beatDisplayLinkProxy = nil
        if let backgroundObserver {
            NotificationCenter.default.removeObserver(backgroundObserver)
        }
        if let foregroundObserver {
            NotificationCenter.default.removeObserver(foregroundObserver)
        }
        if let activeObserver {
            NotificationCenter.default.removeObserver(activeObserver)
        }
        if let inactiveObserver {
            NotificationCenter.default.removeObserver(inactiveObserver)
        }
        nowPlaying.clear()
    }

    func syncTodayTracks(_ tracks: [PracticeTrack]) {
        let todayItems: [LibraryItem] = tracks.map { track in
            let key = String(track.id)
            let setting = trackSettings[key]
            return LibraryItem(
                id: key,
                source: .today,
                title: track.title,
                bpm: setting?.bpm,
                numerator: setting?.numerator,
                denominator: setting?.denominator
            )
        }

        let savedItems: [LibraryItem] = savedSessions.map {
            LibraryItem(
                id: $0.id.uuidString,
                source: .saved,
                title: $0.title,
                bpm: $0.bpm,
                numerator: $0.numerator,
                denominator: $0.denominator
            )
        }

        libraryItems = todayItems + savedItems
        resolveInitialSessionIfNeeded()
        evaluateUnsavedChange()
    }

    func togglePlay() {
        let engine = ensureEngine()
        if store.isPlaying {
            // UI 상태를 즉시 내리고 엔진 중지는 비동기로 수행한다.
            store.isPlaying = false
            engine.stop()
            stopBeatDisplayLink()
            beatEventBuffer.clear()
            lastVisualizedScheduledHostTime = 0
            beatState.reset()
        } else {
            beatState.reset()
            beatEventBuffer.clear()
            lastVisualizedScheduledHostTime = 0
            startBeatDisplayLinkIfNeeded()
            // UI 상태를 즉시 올려 아이콘 상태 레이스를 제거한다.
            store.isPlaying = true
            engine.start(
                bpm: store.bpm,
                signature: store.timeSignature,
                subdivision: store.subdivision,
                beatPattern: store.beatPattern,
                training: trainingConfig(),
                sound: soundConfig()
            )
        }
        syncNowPlaying()
        postMetronomeStateChange()
    }

    func onViewAppear() {
        guard store.isPlaying else { return }
        beatEventBuffer.clear()
        lastVisualizedScheduledHostTime = 0
        startBeatDisplayLinkIfNeeded()
    }

    func onViewDisappear() {
        stopBeatDisplayLink()
        beatEventBuffer.clear()
    }

    func onConfigChanged() {
        guard let engine else {
            evaluateUnsavedChange()
            syncNowPlaying()
            return
        }
        // Subdivision/signature/pattern 변경 시 이전 beat 이벤트를 모두 버린다.
        // 버퍼에 남은 구 패턴 인덱스가 새 패턴과 섞이면 시각/음향이 따로 논다.
        if store.isPlaying {
            beatEventBuffer.clear()
            lastVisualizedScheduledHostTime = 0
            beatState.reset()
        }
        engine.updateConfig(
            bpm: store.bpm,
            signature: store.timeSignature,
            subdivision: store.subdivision,
            beatPattern: store.beatPattern,
            training: trainingConfig(),
            sound: soundConfig()
        )
        evaluateUnsavedChange()
        syncNowPlaying()
        if store.isPlaying { postMetronomeStateChange() }
    }

    func setTimeSignature(_ signature: TimeSignature) {
        store.setTimeSignature(signature)
        onConfigChanged()
    }

    func setSubdivision(_ value: RhythmSubdivision) {
        store.setSubdivision(value)
        onConfigChanged()
    }

    func cycleBeatStrength(at index: Int) {
        store.cycleBeatStrength(at: index)
        onConfigChanged()
    }

    func tapTempo() -> String {
        let now = Date()
        taps.append(now)
        taps = taps.filter { now.timeIntervalSince($0) <= 3.0 }
        if taps.count < 2 { return String(localized: "metronome.taptempo.keepTapping") }

        let intervals = zip(taps.dropFirst(), taps).map { $0.timeIntervalSince($1) }
        let average = intervals.reduce(0, +) / Double(intervals.count)
        guard average > 0 else { return String(localized: "metronome.taptempo.keepTapping") }
        let bpm = Int(round(60.0 / average))
        store.setBpm(bpm)
        onConfigChanged()
        // When BPM is resolved, UI should reflect only the dial value,
        // not keep an extra temporary text message.
        return ""
    }

    func setTrainingMode(_ mode: RhythmTrainingMode) {
        store.setTrainingMode(mode)
        onConfigChanged()
    }

    func applyLibraryItem(_ item: LibraryItem) {
        switch item.source {
        case .today:
            let key = item.id
            if let setting = trackSettings[key] {
                store.setBpm(setting.bpm)
                store.setTimeSignature(.init(numerator: setting.numerator, denominator: setting.denominator))
                activeSession = ActiveSession(
                    source: .today,
                    id: key,
                    title: item.title,
                    hasStoredConfig: true,
                    baseline: .init(bpm: setting.bpm, numerator: setting.numerator, denominator: setting.denominator)
                )
            } else {
                activeSession = ActiveSession(
                    source: .today,
                    id: key,
                    title: item.title,
                    hasStoredConfig: false,
                    baseline: nil
                )
            }
            persistLastViewed(.today, id: key)

        case .saved:
            guard let session = savedSessions.first(where: { $0.id.uuidString == item.id }) else { return }
            store.setBpm(session.bpm)
            store.setTimeSignature(.init(numerator: session.numerator, denominator: session.denominator))
            store.setSubdivision(session.subdivision)
            activeSession = ActiveSession(
                source: .saved,
                id: session.id.uuidString,
                title: session.title,
                hasStoredConfig: true,
                baseline: .init(bpm: session.bpm, numerator: session.numerator, denominator: session.denominator)
            )
            persistLastViewed(.saved, id: session.id.uuidString)
        }
        onConfigChanged()
    }

    func saveSession(name: String?) {
        let now = Date()
        let current = SessionBaseline(bpm: store.bpm, numerator: store.timeSignature.numerator, denominator: store.timeSignature.denominator)
        let trimmed = name?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        if activeSession.source == .today, let key = activeSession.id, let id = Int(key) {
            let setting = TrackMetronomeSetting(trackId: id, bpm: current.bpm, numerator: current.numerator, denominator: current.denominator, updatedAt: now)
            trackSettings[key] = setting
            saveTrackSettings()
            activeSession.hasStoredConfig = true
            activeSession.baseline = current
            persistLastViewed(.today, id: key)

            if !trimmed.isEmpty, trimmed != activeSession.title {
                let newSaved = MetronomeSession(
                    id: UUID(),
                    title: trimmed,
                    bpm: current.bpm,
                    numerator: current.numerator,
                    denominator: current.denominator,
                    subdivision: store.subdivision,
                    createdAt: now
                )
                savedSessions.insert(newSaved, at: 0)
                saveSavedSessions()
            }

        } else if activeSession.source == .saved, let id = activeSession.id, let uuid = UUID(uuidString: id),
                  let idx = savedSessions.firstIndex(where: { $0.id == uuid }) {
            savedSessions[idx].bpm = current.bpm
            savedSessions[idx].numerator = current.numerator
            savedSessions[idx].denominator = current.denominator
            savedSessions[idx].subdivision = store.subdivision
            if !trimmed.isEmpty { savedSessions[idx].title = trimmed }
            savedSessions[idx].createdAt = now
            saveSavedSessions()
            activeSession.title = savedSessions[idx].title
            activeSession.baseline = current
            activeSession.hasStoredConfig = true
            persistLastViewed(.saved, id: uuid.uuidString)
        } else {
            let fallback = trimmed.isEmpty
                ? String(
                    format: String(localized: "metronome.session.fallback.format"),
                    DateFormatter.localizedString(from: now, dateStyle: .short, timeStyle: .short)
                )
                : trimmed
            let newSaved = MetronomeSession(
                id: UUID(),
                title: fallback,
                bpm: current.bpm,
                numerator: current.numerator,
                denominator: current.denominator,
                subdivision: store.subdivision,
                createdAt: now
            )
            savedSessions.insert(newSaved, at: 0)
            saveSavedSessions()
            activeSession = ActiveSession(
                source: .saved,
                id: newSaved.id.uuidString,
                title: newSaved.title,
                hasStoredConfig: true,
                baseline: current
            )
            persistLastViewed(.saved, id: newSaved.id.uuidString)
        }

        syncTodayTracksFromLibraryOnly()
        evaluateUnsavedChange()
    }

    func deleteLibraryItem(_ item: LibraryItem) {
        switch item.source {
        case .today:
            trackSettings[item.id] = nil
            saveTrackSettings()
            if activeSession.source == .today, activeSession.id == item.id {
                activeSession.hasStoredConfig = false
                activeSession.baseline = nil
            }
        case .saved:
            savedSessions.removeAll { $0.id.uuidString == item.id }
            saveSavedSessions()
            if activeSession.source == .saved, activeSession.id == item.id {
                activeSession = ActiveSession()
                UserDefaults.standard.removeObject(forKey: lastViewedKey)
            }
        }
        syncTodayTracksFromLibraryOnly()
        evaluateUnsavedChange()
    }

    private func syncTodayTracksFromLibraryOnly() {
        let todayItems = libraryItems.filter { $0.source == .today }.map { item -> LibraryItem in
            let setting = trackSettings[item.id]
            return LibraryItem(
                id: item.id,
                source: .today,
                title: item.title,
                bpm: setting?.bpm,
                numerator: setting?.numerator,
                denominator: setting?.denominator
            )
        }
        let savedItems = savedSessions.map {
            LibraryItem(
                id: $0.id.uuidString,
                source: .saved,
                title: $0.title,
                bpm: $0.bpm,
                numerator: $0.numerator,
                denominator: $0.denominator
            )
        }
        libraryItems = todayItems + savedItems
    }

    private func resolveInitialSessionIfNeeded() {
        guard !didResolveLastViewed else { return }
        defer { didResolveLastViewed = true }

        guard let data = UserDefaults.standard.data(forKey: lastViewedKey),
              let last = try? JSONDecoder().decode(LastViewedSession.self, from: data) else { return }

        if last.source == .today {
            if let item = libraryItems.first(where: { $0.source == .today && $0.id == last.id }) {
                applyLibraryItem(item)
            }
            return
        }

        if last.source == .saved,
           let item = libraryItems.first(where: { $0.source == .saved && $0.id == last.id }) {
            applyLibraryItem(item)
        }
    }

    private func persistLastViewed(_ source: SessionSource, id: String) {
        let payload = LastViewedSession(source: source, id: id)
        if let data = try? JSONEncoder().encode(payload) {
            UserDefaults.standard.set(data, forKey: lastViewedKey)
        }
    }

    private func loadSavedSessions() {
        guard let data = UserDefaults.standard.data(forKey: savedSessionsKey) else { return }
        if let decoded = try? JSONDecoder().decode([MetronomeSession].self, from: data) {
            savedSessions = decoded.sorted { $0.createdAt > $1.createdAt }
        }
    }

    private func saveSavedSessions() {
        if let data = try? JSONEncoder().encode(savedSessions) {
            UserDefaults.standard.set(data, forKey: savedSessionsKey)
        }
    }

    private func loadTrackSettings() {
        guard let data = UserDefaults.standard.data(forKey: trackSettingsKey) else { return }
        if let decoded = try? JSONDecoder().decode([String: TrackMetronomeSetting].self, from: data) {
            trackSettings = decoded
        }
    }

    private func saveTrackSettings() {
        if let data = try? JSONEncoder().encode(trackSettings) {
            UserDefaults.standard.set(data, forKey: trackSettingsKey)
        }
    }

    private func evaluateUnsavedChange() {
        guard activeSession.source != .none else {
            hasUnsavedSessionChange = true
            return
        }
        guard let baseline = activeSession.baseline else {
            hasUnsavedSessionChange = true
            return
        }
        hasUnsavedSessionChange =
            baseline.bpm != store.bpm ||
            baseline.numerator != store.timeSignature.numerator ||
            baseline.denominator != store.timeSignature.denominator
    }

    private func trainingConfig() -> MetronomeEngine.TrainingConfig {
        .init(
            mode: store.trainingMode,
            songLengthBasis: store.songLength.basis,
            songLengthBars: store.songLength.bars,
            songLengthDurationSeconds: store.songLength.durationSeconds,
            progressiveBasis: store.incrementalTempo.basis,
            progressiveBarsStep: store.incrementalTempo.barsStep,
            progressiveBarsInterval: store.incrementalTempo.barsInterval,
            progressiveBarsLimit: store.incrementalTempo.barsLimit,
            progressiveDurationStep: store.incrementalTempo.durationStep,
            progressiveDurationInterval: store.incrementalTempo.durationInterval,
            progressiveDurationLimit: store.incrementalTempo.durationLimit,
            muteBasis: store.mutePattern.basis,
            muteBarsPlayLength: store.mutePattern.barsSoundLength,
            muteBarsMuteLength: store.mutePattern.barsMuteLength,
            muteDurationPlayLength: store.mutePattern.durationSoundLength,
            muteDurationMuteLength: store.mutePattern.durationMuteLength
        )
    }

    private func soundConfig() -> MetronomeEngine.SoundConfig {
        .init(
            preset: store.soundPreset,
            soundEnabled: store.soundEnabled,
            volume: store.soundVolume,
            accentGain: store.accentGain
        )
    }

    private func triggerFlash(for beat: Int, durationHint: Double? = nil) {
        guard store.flashEnabled else {
            if beatState.flashPulseOpacity != 0 {
                beatState.flashPulseOpacity = 0
            }
            return
        }

        let strength = store.beatPattern.indices.contains(beat) ? store.beatPattern[beat] : .strong
        let peak: Double
        switch strength {
        case .accent: peak = 0.32
        case .strong: peak = 0.24
        case .weak: peak = 0.15
        case .silent: return  // silent beat → flash 없음
        }

        let fadeDuration = max(0.03, min(0.12, durationHint ?? 0.08))
        // peak를 현재 run loop에서 즉시 렌더한 뒤,
        // 다음 run loop에서 0으로 fade out한다.
        // withAnimation과 같은 run loop에서 peak를 설정하면 SwiftUI가 두 변경을
        // 합쳐 peak를 렌더링하지 않으므로 반드시 비동기로 분리해야 한다.
        beatState.flashPulseOpacity = peak
        DispatchQueue.main.async { [weak self] in
            withAnimation(.easeOut(duration: fadeDuration)) {
                self?.beatState.flashPulseOpacity = 0
            }
        }
    }

    private func ensureEngine() -> MetronomeEngine {
        if let engine {
            return engine
        }
        let engine = MetronomeEngine()
        let beatBuffer = beatEventBuffer
        engine.onBeatChange = { beat, scheduledHostTime, deliveredHostTime in
            beatBuffer.append(
                ScheduledBeatEvent(
                    beat: beat,
                    scheduledHostTime: scheduledHostTime,
                    deliveredHostTime: deliveredHostTime
                )
            )
        }
        engine.onStop = { [weak self, weak engine] in
            guard let self, let engine else { return }
            if !engine.isPlayingNow {
                self.store.isPlaying = false
                self.stopBeatDisplayLink()
                self.beatEventBuffer.clear()
                self.lastVisualizedScheduledHostTime = 0
                self.beatState.reset()
                self.syncNowPlaying()
            }
        }
        engine.onTrainingStatusChange = { [weak self] text in
            self?.trainingStatusText = text
        }
        self.engine = engine
        return engine
    }

    private func startBeatDisplayLinkIfNeeded() {
        guard beatDisplayLink == nil else { return }
        let proxy = DisplayLinkProxy { [weak self] in
            // CADisplayLink는 main thread에서 호출되므로 MainActor.assumeIsolated로
            // Task 없이 동기 실행한다. Task { @MainActor in }은 최소 1 run loop 지연이
            // 발생해 flash가 한 프레임 늦어지고 소리와 시각적 타이밍이 어긋난다.
            MainActor.assumeIsolated {
                self?.drainBeatEventsForCurrentFrame()
            }
        }
        let link = CADisplayLink(target: proxy, selector: #selector(DisplayLinkProxy.tick(_:)))
        link.add(to: .main, forMode: .common)
        beatDisplayLinkProxy = proxy
        beatDisplayLink = link
    }

    private func stopBeatDisplayLink() {
        beatDisplayLink?.invalidate()
        beatDisplayLink = nil
        beatDisplayLinkProxy = nil
    }

    private func drainBeatEventsForCurrentFrame() {
        guard store.isPlaying else { return }
        let nowHost = mach_absolute_time()
        let dueEvents = beatEventBuffer.drain(through: nowHost)
        guard !dueEvents.isEmpty else { return }
        for event in dueEvents {
            processDueBeatEvent(event, nowHost: nowHost)
        }
    }

    private func processDueBeatEvent(_ event: ScheduledBeatEvent, nowHost: UInt64) {
        if event.scheduledHostTime <= lastVisualizedScheduledHostTime {
            return
        }
        lastVisualizedScheduledHostTime = event.scheduledHostTime

        let beatCount = max(1, store.beatPattern.count)
        let beatDuration = (60.0 / Double(max(1, store.bpm)))
            * (4.0 / Double(max(1, store.timeSignature.denominator)))

        let baseDisplayBeat = ((event.beat % beatCount) + beatCount) % beatCount
        var displayBeat = baseDisplayBeat
        var phaseDelaySeconds = 0.0
        if nowHost > event.scheduledHostTime, beatDuration > 0 {
            let lagHost = nowHost - event.scheduledHostTime
            let lagSeconds = AVAudioTime.seconds(forHostTime: lagHost)
            let wholeBeatLag = Int(floor(lagSeconds / beatDuration))
            if wholeBeatLag > 0 {
                displayBeat = (displayBeat + wholeBeatLag) % beatCount
            }
            let staleVisualCutoff = 0.12
            if lagSeconds >= staleVisualCutoff {
                return
            }
            phaseDelaySeconds = lagSeconds.truncatingRemainder(dividingBy: beatDuration)
        } else if event.deliveredHostTime > event.scheduledHostTime, beatDuration > 0 {
            let lagHost = event.deliveredHostTime - event.scheduledHostTime
            phaseDelaySeconds = AVAudioTime.seconds(forHostTime: lagHost).truncatingRemainder(dividingBy: beatDuration)
        }

        let remainingBeatSeconds = max(0.01, beatDuration - phaseDelaySeconds)
        let pulseDuration = max(0.04, min(0.16, remainingBeatSeconds * 0.35))
        if abs(beatState.pulseDuration - pulseDuration) > 0.002 {
            beatState.pulseDuration = pulseDuration
        }

        if beatState.activeBeat != displayBeat {
            beatState.activeBeat = displayBeat
        }
        beatState.beatTick &+= 1
        triggerFlash(for: displayBeat, durationHint: pulseDuration)
    }

    private func saveUserPreferences() {
        let prefs = MetronomeUserPreferences(
            soundPreset: store.soundPreset,
            soundEnabled: store.soundEnabled,
            soundVolume: store.soundVolume,
            accentGain: store.accentGain,
            flashEnabled: store.flashEnabled
        )
        guard let data = try? JSONEncoder().encode(prefs) else { return }
        UserDefaults.standard.set(data, forKey: userPreferencesKey)
    }

    private static func loadUserPreferences(key: String) -> MetronomeUserPreferences {
        guard let data = UserDefaults.standard.data(forKey: key),
              let prefs = try? JSONDecoder().decode(MetronomeUserPreferences.self, from: data)
        else { return .default }
        return prefs
    }

    private static func loadPersistedState(
        savedSessionsKey: String,
        trackSettingsKey: String
    ) -> ([MetronomeSession], [String: TrackMetronomeSetting]) {
        let defaults = UserDefaults.standard

        let loadedSavedSessions: [MetronomeSession] = {
            guard let data = defaults.data(forKey: savedSessionsKey),
                  let decoded = try? JSONDecoder().decode([MetronomeSession].self, from: data) else {
                return []
            }
            return decoded.sorted { $0.createdAt > $1.createdAt }
        }()

        let loadedTrackSettings: [String: TrackMetronomeSetting] = {
            guard let data = defaults.data(forKey: trackSettingsKey),
                  let decoded = try? JSONDecoder().decode([String: TrackMetronomeSetting].self, from: data) else {
                return [:]
            }
            return decoded
        }()

        return (loadedSavedSessions, loadedTrackSettings)
    }

    private func syncNowPlaying() {
        nowPlaying.update(isPlaying: store.isPlaying, bpm: store.bpm, signature: store.timeSignature)
    }

    /// 메트로놈 상태 변경 시 PracticeDataStore에 알린다 (Live Activity 상태 동기화용).
    private func postMetronomeStateChange() {
        NotificationCenter.default.post(
            name: .metronomeStateDidChange,
            object: nil,
            userInfo: ["isRunning": store.isPlaying, "bpm": store.bpm]
        )
    }

}

private final class MetronomeNowPlayingController {
    // MPNowPlayingInfoCenter / MPRemoteCommandCenter 비활성화.
    // Dynamic Island는 PianoLogLiveActivityWidget(PracticeDataStore)이 담당한다.
    // NowPlaying으로 노출하면 iOS가 Dynamic Island에 회색 스피커 pill을 추가로 표시하므로
    // 메트로놈은 Live Activity 상태 업데이트만 사용하고 NowPlaying은 쓰지 않는다.

    // init에서 설정된 콜백 — 현재는 호출되지 않으나 API 호환성을 위해 유지
    var onPlayRequested: (() -> Void)?
    var onPauseRequested: (() -> Void)?
    var onToggleRequested: (() -> Void)?

    func update(isPlaying: Bool, bpm: Int, signature: TimeSignature) {
        // NowPlaying 미사용 — Live Activity만으로 상태 표시
    }

    func clear() {
        // NowPlaying 미사용 — 정리할 것 없음
    }
}
