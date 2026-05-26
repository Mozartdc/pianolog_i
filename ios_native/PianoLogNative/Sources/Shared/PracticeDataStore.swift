import Foundation
import ActivityKit

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
    /// ticker가 몇 번 fired 됐는지 — 10회(=1초)마다 Live Activity 갱신용
    private var tickerCount = 0
    /// Activity<PianoLogActivityAttributes> — iOS 16.1+ 만 사용, Any?로 타입 소거
    private var _practiceActivity: Any?

    // ── 메트로놈 상태 (Live Activity 공유용) ──
    private var metronomeIsRunning = false
    private var metronomeBpm = 0
    private var metronomeObserver: NSObjectProtocol?

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

        // MetronomeViewModel → PracticeDataStore 단방향 알림 구독
        metronomeObserver = NotificationCenter.default.addObserver(
            forName: .metronomeStateDidChange,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let self,
                  let isRunning = note.userInfo?["isRunning"] as? Bool,
                  let bpm = note.userInfo?["bpm"] as? Int else { return }
            Task { @MainActor [weak self] in
                self?.handleMetronomeStateChange(isRunning: isRunning, bpm: bpm)
            }
        }
    }

    /// 앱 UI가 준비된 뒤 호출 — init()에서 호출하면 크래시
    /// HomeView.onAppear마다 반복 호출되므로 중복 생성을 방지한다.
    func restoreLiveActivityIfNeeded() {
        guard #available(iOS 16.1, *) else { return }

        let allActive = Activity<PianoLogActivityAttributes>.activities
            .filter { $0.activityState == .active }

        guard timerState.isActive else {
            // 타이머 없음: 메트로놈도 없으면 남은 orphan 전부 정리
            if !metronomeIsRunning {
                _practiceActivity = nil
                for activity in allActive {
                    Task { await activity.end(dismissalPolicy: .immediate) }
                }
            }
            return
        }

        // 1) 현재 추적 중인 Activity가 살아있으면 상태 갱신 + 중복 orphan 정리
        if let existing = _practiceActivity as? Activity<PianoLogActivityAttributes>,
           existing.activityState == .active {
            for orphan in allActive where orphan.id != existing.id {
                Task { await orphan.end(dismissalPolicy: .immediate) }
            }
            updateLiveActivity()
            return
        }

        // 2) orphan이 하나라도 있으면 첫 번째만 이어받고 나머지 종료
        if let orphan = allActive.first {
            for extra in allActive.dropFirst() {
                Task { await extra.end(dismissalPolicy: .immediate) }
            }
            _practiceActivity = orphan
            updateLiveActivity()
            return
        }

        // 3) 완전히 없을 때만 신규 생성
        startLiveActivity()
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
        startLiveActivity()
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
        updateLiveActivity()
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
        updateLiveActivity()
    }

    func completeSession(memo: String? = nil) {
        let now = Self.nowMs()
        guard let start = timerState.startTimeMs, timerState.isActive else {
            timerState = .idle(nowMs: now)
            saveTimerState()
            syncPublishedState(nowMs: now)
            stopTicker()
            endLiveActivity()
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
        // 메트로놈이 재생 중이면 Activity를 종료하지 않고 상태만 갱신
        if metronomeIsRunning {
            updateLiveActivity()
        } else {
            endLiveActivity()
        }
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

    func deleteRecord(id: String) {
        practiceRecords.removeAll { $0.id == id }
        savePracticeRecords()
    }

    func updateRecordTimes(id: String, startTimeMs: Int64, endTimeMs: Int64) {
        guard let index = practiceRecords.firstIndex(where: { $0.id == id }) else { return }
        let safeStart = min(startTimeMs, endTimeMs)
        let safeEnd = max(startTimeMs, endTimeMs)
        let minutes = max(0, Int((safeEnd - safeStart) / 60_000))
        let date = dayFormatter.string(from: Date(timeIntervalSince1970: TimeInterval(safeStart) / 1000))
        let existing = practiceRecords[index]
        practiceRecords[index] = PracticeRecord(
            id: existing.id,
            date: date,
            practiceTime: minutes,
            startTime: safeStart,
            endTime: safeEnd,
            memo: existing.memo,
            track: existing.track
        )
        savePracticeRecords()
    }

    func updateRecordMemo(id: String, memo: String) {
        guard let index = practiceRecords.firstIndex(where: { $0.id == id }) else { return }
        let trimmed = memo.trimmingCharacters(in: .whitespacesAndNewlines)
        practiceRecords[index].memo = trimmed.isEmpty ? nil : trimmed
        savePracticeRecords()
    }

    func records(for dateKey: String) -> [PracticeRecord] {
        practiceRecords.filter { $0.date == dateKey }
    }

    func exportRecords() -> [PracticeRecord] {
        practiceRecords
    }

    func importRecords(_ records: [PracticeRecord]) {
        practiceRecords = records
        savePracticeRecords()
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
        tickerCount = 0
        ticker = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor [weak self] in
                guard let self else { return }
                let now = Self.nowMs()
                self.timerMilliseconds = self.currentElapsedMs(nowMs: now)
                self.tickerCount += 1
                // compact 뷰는 Text(.timer) 스타일 대신 정적 문자열을 사용하므로
                // 1초(=10틱)마다 ContentState를 갱신해 시간이 멈춰 보이지 않게 한다.
                if self.tickerCount % 10 == 0 {
                    self.updateLiveActivity()
                }
            }
        }
    }

    private func stopTicker() {
        ticker?.invalidate()
        ticker = nil
        tickerCount = 0
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

    private nonisolated static func nowMs() -> Int64 {
        Int64(Date().timeIntervalSince1970 * 1000)
    }

    // MARK: - 메트로놈 상태 변경 핸들러

    private func handleMetronomeStateChange(isRunning: Bool, bpm: Int) {
        let wasRunning = metronomeIsRunning
        metronomeIsRunning = isRunning
        metronomeBpm = isRunning ? bpm : 0

        if isRunning && !timerState.isActive && !wasRunning {
            // 메트로놈만 시작: Activity 없으면 새로 시작
            startLiveActivity()
        } else if !isRunning && !timerState.isActive {
            // 메트로놈 종료 & 타이머도 없음: Activity 종료
            endLiveActivity()
        } else {
            // 타이머 진행 중이거나 상태만 바뀐 경우: 상태 업데이트
            updateLiveActivity()
        }
    }

    // MARK: - Live Activity (iOS 16.1+)

    @available(iOS 16.1, *)
    private func makeActivityState() -> PianoLogActivityAttributes.ContentState {
        let elapsed = Double(timerMilliseconds) / 1000.0
        let timerStartDate = timerRunning
            ? Date(timeIntervalSinceNow: -elapsed)
            : Date()
        return PianoLogActivityAttributes.ContentState(
            isTimerActive: timerState.isActive,
            isTimerRunning: timerRunning,
            timerStart: timerStartDate,
            elapsedSeconds: elapsed,
            isMetronomeRunning: metronomeIsRunning,
            bpm: metronomeBpm
        )
    }

    private func startLiveActivity() {
        guard #available(iOS 16.1, *) else { return }

        // 신규 시작 전 기존 Activity(orphan 포함) 전부 종료
        // → 중복 Activity로 인한 Dynamic Island 전체 폭 pill 방지
        _practiceActivity = nil
        for activity in Activity<PianoLogActivityAttributes>.activities {
            Task { await activity.end(dismissalPolicy: .immediate) }
        }

        let info = ActivityAuthorizationInfo()
        print("🟡 Live Activity areActivitiesEnabled:", info.areActivitiesEnabled)
        guard info.areActivitiesEnabled else { return }

        let state = makeActivityState()
        let attrs = PianoLogActivityAttributes(sessionId: timerSessionId.isEmpty ? "metronome" : timerSessionId)
        do {
            let activity: Activity<PianoLogActivityAttributes>
            if #available(iOS 16.2, *) {
                let content = ActivityContent(state: state, staleDate: nil, relevanceScore: 100)
                activity = try Activity<PianoLogActivityAttributes>.request(
                    attributes: attrs, content: content, pushType: nil
                )
            } else {
                activity = try Activity<PianoLogActivityAttributes>.request(
                    attributes: attrs, contentState: state, pushType: nil
                )
            }
            _practiceActivity = activity
            print("✅ Live Activity 시작됨 id:", activity.id)
        } catch {
            print("🔴 Live Activity 시작 실패:", error)
        }
    }

    private func updateLiveActivity() {
        guard #available(iOS 16.1, *) else { return }
        guard let activity = _practiceActivity as? Activity<PianoLogActivityAttributes> else { return }
        let state = makeActivityState()
        Task {
            if #available(iOS 16.2, *) {
                let content = ActivityContent(state: state, staleDate: nil, relevanceScore: 100)
                await activity.update(content)
            } else {
                await activity.update(using: state)
            }
        }
    }

    private func endLiveActivity() {
        guard #available(iOS 16.1, *) else { return }
        _practiceActivity = nil
        // orphan 포함 모든 활동 종료
        for activity in Activity<PianoLogActivityAttributes>.activities {
            Task { await activity.end(dismissalPolicy: .immediate) }
        }
    }
}
