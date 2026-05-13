import Foundation

struct PracticeRecord: Identifiable, Hashable, Codable {
    let id: String
    let date: String
    let practiceTime: Int
    let startTime: Int64
    let endTime: Int64
    var memo: String?
    var track: String?
}

private struct TimerStateV2: Codable {
    var version: Int = 2
    var startTimeMs: Int64?
    var pausedAccumMs: Int64
    var pausedAtMs: Int64?
    var isActive: Bool
    var isRunning: Bool
    var memo: String
    var sessionId: String
    var lastUpdatedMs: Int64

    static func idle(nowMs: Int64) -> TimerStateV2 {
        TimerStateV2(
            version: 2,
            startTimeMs: nil,
            pausedAccumMs: 0,
            pausedAtMs: nil,
            isActive: false,
            isRunning: false,
            memo: "",
            sessionId: "",
            lastUpdatedMs: nowMs
        )
    }
}

@MainActor
final class PracticeDataStore: ObservableObject {
    @Published private(set) var practiceRecords: [PracticeRecord] = []
    @Published private(set) var timerActive = false
    @Published private(set) var timerRunning = false
    @Published private(set) var timerMilliseconds: Int64 = 0
    @Published private(set) var timerStartTime: Int64?
    @Published private(set) var timerMemo = ""
    @Published private(set) var timerSessionId = ""

    private let recordsKey = "practiceRecords"
    private let timerV2Key = "timerV2"
    private let defaults = UserDefaults.standard
    private var timerState: TimerStateV2
    private var ticker: Timer?

    private let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    init() {
        let now = Self.nowMs()
        timerState = Self.loadTimerState(from: defaults, key: timerV2Key) ?? .idle(nowMs: now)
        loadPracticeRecords()
        syncPublishedState(nowMs: now)
        restoreTickerIfNeeded()
    }

    deinit {
        ticker?.invalidate()
    }

    func startSession() {
        guard !timerState.isActive else { return }
        let now = Self.nowMs()
        timerState = TimerStateV2(
            version: 2,
            startTimeMs: now,
            pausedAccumMs: 0,
            pausedAtMs: nil,
            isActive: true,
            isRunning: true,
            memo: "",
            sessionId: "\(now)-\(UUID().uuidString.prefix(6))",
            lastUpdatedMs: now
        )
        saveTimerState()
        syncPublishedState(nowMs: now)
        startTicker()
    }

    func pauseSession() {
        guard timerState.isActive, timerState.isRunning else { return }
        let now = Self.nowMs()
        timerState.isRunning = false
        timerState.pausedAtMs = now
        timerState.lastUpdatedMs = now
        saveTimerState()
        syncPublishedState(nowMs: now)
        stopTicker()
    }

    func resumeSession() {
        guard timerState.isActive, !timerState.isRunning else { return }
        let now = Self.nowMs()
        if let pausedAt = timerState.pausedAtMs {
            timerState.pausedAccumMs += max(0, now - pausedAt)
        }
        timerState.pausedAtMs = nil
        timerState.isRunning = true
        timerState.lastUpdatedMs = now
        saveTimerState()
        syncPublishedState(nowMs: now)
        startTicker()
    }

    func completeSession(memo: String? = nil) {
        let now = Self.nowMs()
        guard let start = timerState.startTimeMs, timerState.isActive else {
            timerState = .idle(nowMs: now)
            saveTimerState()
            syncPublishedState(nowMs: now)
            stopTicker()
            return
        }

        let finalMemo = memo ?? timerState.memo
        let elapsedMs = max(0, now - start - timerState.pausedAccumMs)
        let minutes = max(0, Int(elapsedMs / 60_000))
        let date = dayFormatter.string(from: Date(timeIntervalSince1970: TimeInterval(start) / 1000))
        let record = PracticeRecord(
            id: timerState.sessionId.isEmpty ? UUID().uuidString : timerState.sessionId,
            date: date,
            practiceTime: minutes,
            startTime: start,
            endTime: now,
            memo: finalMemo.isEmpty ? nil : finalMemo,
            track: nil
        )
        upsert(record: record)

        timerState = .idle(nowMs: now)
        saveTimerState()
        savePracticeRecords()
        syncPublishedState(nowMs: now)
        stopTicker()
    }

    func updateTimerStartTime(_ newStartTimeMs: Int64) {
        guard timerState.isActive else { return }
        timerState.startTimeMs = newStartTimeMs
        timerState.lastUpdatedMs = Self.nowMs()
        saveTimerState()
        syncPublishedState(nowMs: Self.nowMs())
    }

    func updateTimerMemo(_ memo: String) {
        timerState.memo = memo
        timerState.lastUpdatedMs = Self.nowMs()
        saveTimerState()
        syncPublishedState(nowMs: Self.nowMs())
    }

    func upsertManualRecord(
        id: String?,
        startTimeMs: Int64,
        endTimeMs: Int64,
        memo: String?
    ) {
        let safeEnd = max(endTimeMs, startTimeMs)
        let minutes = max(0, Int((safeEnd - startTimeMs) / 60_000))
        let date = dayFormatter.string(from: Date(timeIntervalSince1970: TimeInterval(startTimeMs) / 1000))
        let record = PracticeRecord(
            id: id ?? UUID().uuidString,
            date: date,
            practiceTime: minutes,
            startTime: startTimeMs,
            endTime: safeEnd,
            memo: memo?.isEmpty == true ? nil : memo,
            track: nil
        )
        upsert(record: record)
        savePracticeRecords()
    }

    func records(for dateKey: String) -> [PracticeRecord] {
        practiceRecords.filter { $0.date == dateKey }
    }

    func totalMinutes() -> Int {
        practiceRecords.reduce(0) { $0 + max(0, $1.practiceTime) }
    }

    func streakDays(today: Date = .now) -> Int {
        guard !practiceRecords.isEmpty else { return 0 }
        let practicedDays = Set(practiceRecords.map(\.date))
        let calendar = Calendar(identifier: .gregorian)
        var day = calendar.startOfDay(for: today)
        var streak = 0

        let todayKey = dayFormatter.string(from: day)
        if practicedDays.contains(todayKey) {
            while practicedDays.contains(dayFormatter.string(from: day)) {
                streak += 1
                guard let previous = calendar.date(byAdding: .day, value: -1, to: day) else { break }
                day = previous
                if streak > 366 { break }
            }
            return streak
        }

        guard let yesterday = calendar.date(byAdding: .day, value: -1, to: day) else { return 0 }
        day = yesterday
        while practicedDays.contains(dayFormatter.string(from: day)) {
            streak += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: day) else { break }
            day = previous
            if streak > 366 { break }
        }
        return streak
    }

    private func upsert(record: PracticeRecord) {
        if let index = practiceRecords.firstIndex(where: { $0.id == record.id }) {
            practiceRecords[index] = record
        } else {
            practiceRecords.append(record)
        }
    }

    private func loadPracticeRecords() {
        guard let data = defaults.data(forKey: recordsKey),
              let decoded = try? JSONDecoder().decode([PracticeRecord].self, from: data) else {
            practiceRecords = []
            return
        }
        practiceRecords = decoded
    }

    private func savePracticeRecords() {
        if let encoded = try? JSONEncoder().encode(practiceRecords) {
            defaults.set(encoded, forKey: recordsKey)
        }
    }

    private func saveTimerState() {
        if let encoded = try? JSONEncoder().encode(timerState) {
            defaults.set(encoded, forKey: timerV2Key)
        }
    }

    private func syncPublishedState(nowMs: Int64) {
        timerActive = timerState.isActive
        timerRunning = timerState.isRunning
        timerStartTime = timerState.startTimeMs
        timerMemo = timerState.memo
        timerSessionId = timerState.sessionId
        timerMilliseconds = currentElapsedMs(nowMs: nowMs)
    }

    private func restoreTickerIfNeeded() {
        if timerState.isActive, timerState.isRunning {
            startTicker()
        }
    }

    private func startTicker() {
        stopTicker()
        ticker = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self else { return }
            let now = Self.nowMs()
            self.timerMilliseconds = self.currentElapsedMs(nowMs: now)
        }
    }

    private func stopTicker() {
        ticker?.invalidate()
        ticker = nil
    }

    private func currentElapsedMs(nowMs: Int64) -> Int64 {
        guard timerState.isActive, let start = timerState.startTimeMs else { return 0 }
        if timerState.isRunning {
            return max(0, nowMs - start - timerState.pausedAccumMs)
        }
        if let pausedAt = timerState.pausedAtMs {
            return max(0, pausedAt - start - timerState.pausedAccumMs)
        }
        return max(0, nowMs - start - timerState.pausedAccumMs)
    }

    private static func loadTimerState(from defaults: UserDefaults, key: String) -> TimerStateV2? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(TimerStateV2.self, from: data)
    }

    private static func nowMs() -> Int64 {
        Int64(Date().timeIntervalSince1970 * 1000)
    }
}
