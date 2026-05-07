import Foundation
import UIKit
import Combine

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
        var title: String = "Practice Session"
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
    @Published var flashPulseOpacity: Double = 0
    @Published var savedSessions: [MetronomeSession] = []
    @Published var trackSettings: [String: TrackMetronomeSetting] = [:]
    @Published var libraryItems: [LibraryItem] = []
    @Published var hasUnsavedSessionChange: Bool = true

    private var engine: MetronomeEngine?
    private var taps: [Date] = []

    private let savedSessionsKey = "metronome.saved.sessions.v2"
    private let trackSettingsKey = "metronome.track.settings.v2"
    private let lastViewedKey = "metronome.last.viewed.session.v2"
    private var didResolveLastViewed = false
    private var foregroundObserver: NSObjectProtocol?
    private var storeChangeCancellable: AnyCancellable?

    init() {
        storeChangeCancellable = store.objectWillChange
            .sink { [weak self] _ in
                self?.objectWillChange.send()
            }

        foregroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.engine?.recoverAfterInterruption()
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
            }
        }
    }

    deinit {
        if let foregroundObserver {
            NotificationCenter.default.removeObserver(foregroundObserver)
        }
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
            store.currentBeat = -1
        } else {
            store.currentBeat = -1
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
    }

    func onConfigChanged() {
        guard let engine else {
            evaluateUnsavedChange()
            return
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
        if taps.count < 2 { return "계속 탭하십시오" }

        let intervals = zip(taps.dropFirst(), taps).map { $0.timeIntervalSince($1) }
        let average = intervals.reduce(0, +) / Double(intervals.count)
        guard average > 0 else { return "계속 탭하십시오" }
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
            let fallback = trimmed.isEmpty ? "세션 \(DateFormatter.localizedString(from: now, dateStyle: .short, timeStyle: .short))" : trimmed
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

    private func triggerFlash(for beat: Int) {
        guard store.flashEnabled else {
            flashPulseOpacity = 0
            return
        }

        let strength = store.beatPattern.indices.contains(beat) ? store.beatPattern[beat] : .strong
        let peak: Double
        switch strength {
        case .accent: peak = 0.32
        case .strong: peak = 0.24
        case .weak: peak = 0.15
        case .silent: peak = 0.0
        }

        flashPulseOpacity = peak
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
            self?.flashPulseOpacity = 0
        }
    }

    private func ensureEngine() -> MetronomeEngine {
        if let engine {
            return engine
        }
        let engine = MetronomeEngine()
        engine.onBeatChange = { [weak self] beat in
            guard let self else { return }
            // Update active beat first so the pulse consumer reads the correct beat
            // in the same callback turn.
            self.store.currentBeat = beat
            self.store.beatTick &+= 1
            self.triggerFlash(for: beat)
        }
        engine.onStop = { [weak self, weak engine] in
            guard let self, let engine else { return }
            if !engine.isPlayingNow {
                self.store.isPlaying = false
            }
        }
        engine.onTrainingStatusChange = { [weak self] text in
            self?.trainingStatusText = text
        }
        self.engine = engine
        return engine
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
}
