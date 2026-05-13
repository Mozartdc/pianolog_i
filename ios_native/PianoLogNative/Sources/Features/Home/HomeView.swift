import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var dateStore: SelectedDateStore
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @EnvironmentObject private var practiceDataStore: PracticeDataStore
    @Environment(\.scenePhase) private var scenePhase

    @State private var nickname: String = UserDefaults.standard.string(forKey: "nickname") ?? "디붕이"
    @State private var avatarPath: String = UserDefaults.standard.string(forKey: "avatar") ?? ""
    @State private var editStartDate: Date = .now
    @State private var editEndDate: Date = .now
    @State private var isEditSheetPresented = false
    @State private var isCompleteAlertPresented = false
    @State private var isTimerSheetPresented = false
    @State private var isExportSheetPresented = false

    private let calendar = Calendar(identifier: .gregorian)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    homeHeader
                    streakCard
                    statsSection
                    WeeklyCalendarModule(themeColor: AppPalette.homeTheme)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    startPracticeSection
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Color(uiColor: .systemBackground))
            .toolbar(.hidden, for: .navigationBar)
            .onAppear {
                syncProfile()
            }
            .onChange(of: scenePhase) { phase in
                if phase == .active {
                    syncProfile()
                }
            }
            .onChange(of: practiceDataStore.timerActive) { active in
                if !active {
                    isTimerSheetPresented = false
                }
            }
            .sheet(isPresented: $isTimerSheetPresented) {
                timerSheet
            }
            .sheet(isPresented: $isEditSheetPresented) {
                editTimeSheet
            }
            .sheet(isPresented: $isExportSheetPresented) {
                exportSheet
            }
            .alert("연습 종료", isPresented: $isCompleteAlertPresented) {
                Button("취소", role: .cancel) {
                    AppHaptics.tap()
                }
                Button("완료") {
                    AppHaptics.tap()
                    practiceDataStore.completeSession()
                }
            } message: {
                Text("현재 세션을 종료하고 기록에 반영합니다.")
            }
        }
    }

    private var homeHeader: some View {
        VStack(spacing: 10) {
            Text("digital piano gallery 피출앱")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AppPalette.homeTheme)
                .frame(maxWidth: .infinity, alignment: .center)

            Text(selectedDateText)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .center)

            HStack(spacing: 12) {
                avatarView

                VStack(alignment: .leading, spacing: 2) {
                    Text(nickname)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    Text(todayCheer)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                Spacer(minLength: 0)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color(uiColor: .secondarySystemBackground))
            )
        }
    }

    private var avatarView: some View {
        Group {
            if let image = loadAvatarImage() {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                Image(systemName: "person.fill")
                    .foregroundStyle(AppPalette.homeTheme)
            }
        }
        .frame(width: 44, height: 44)
        .clipShape(Circle())
        .overlay(
            Circle()
                .strokeBorder(AppPalette.homeTheme.opacity(0.18), lineWidth: 1)
        )
    }

    private var streakCard: some View {
        HStack(spacing: 10) {
            Image(systemName: "flame.fill")
                .foregroundStyle(AppPalette.homeTheme)
            Text("\(practiceDataStore.streakDays())일 연속 피출")
                .font(.headline)
                .foregroundStyle(.primary)
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(AppPalette.homeTheme.opacity(0.16))
        )
    }

    private var statsSection: some View {
        VStack(spacing: 8) {
            HStack {
                Text("요약")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                Button {
                    AppHaptics.tap()
                    isExportSheetPresented = true
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .hoverEffect(.lift)
                .accessibilityLabel(Text("기록 내보내기"))
            }

            StatRow(
                iconName: "pianokeys",
                iconTint: AppPalette.homeTheme,
                title: isTodaySelected ? "오늘의 피출 기록" : "\(shortSelectedDate) 피출 기록",
                value: "\(selectedDateMinutes / 60)시간 \(selectedDateMinutes % 60)분"
            )
            StatRow(
                iconName: "music.note.list",
                iconTint: AppPalette.homeTheme,
                title: isTodaySelected ? "오늘 연습한 곡" : "\(shortSelectedDate) 연습한 곡",
                value: "\(selectedDateChecked.numerator)/\(selectedDateChecked.denominator) 곡"
            )
            StatRow(
                iconName: "trophy.fill",
                iconTint: AppPalette.homeTheme,
                title: "누적 연습 시간",
                value: "\(practiceDataStore.totalMinutes() / 60)시간"
            )
        }
    }

    private var startPracticeSection: some View {
        Group {
            if practiceDataStore.timerActive {
                Button {
                    AppHaptics.tap()
                    isTimerSheetPresented = true
                } label: {
                    VStack(spacing: 4) {
                        Text("진행 중 세션")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(elapsedText)
                            .font(.title3.monospacedDigit().weight(.bold))
                            .foregroundStyle(.primary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(Color(uiColor: .secondarySystemBackground))
                    )
                }
                .buttonStyle(.plain)
                .hoverEffect(.lift)
            } else {
                Button {
                    AppHaptics.tap()
                    practiceDataStore.startSession()
                    isTimerSheetPresented = true
                } label: {
                    Image(systemName: "play.circle.fill")
                        .font(.system(size: 76))
                        .symbolRenderingMode(.monochrome)
                        .foregroundStyle(AppPalette.homeTheme)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.plain)
                .hoverEffect(.lift)
            }
        }
    }

    private var timerSheet: some View {
        NavigationStack {
            Form {
                Section("현재 경과 시간") {
                    Text(elapsedText)
                        .font(.title3.monospacedDigit().weight(.bold))
                        .frame(maxWidth: .infinity, alignment: .center)
                }

                Section("세션 제어") {
                    if practiceDataStore.timerRunning {
                        Button("일시정지") {
                            AppHaptics.tap()
                            practiceDataStore.pauseSession()
                        }
                    } else {
                        Button("재시작") {
                            AppHaptics.tap()
                            practiceDataStore.resumeSession()
                        }
                    }

                    Button("시간 수정") {
                        AppHaptics.tap()
                        prepareEditSheetValues()
                        isEditSheetPresented = true
                    }

                    Button("연습 완료", role: .destructive) {
                        AppHaptics.tap()
                        isCompleteAlertPresented = true
                    }
                }
            }
            .navigationTitle("연습 세션")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") {
                        AppHaptics.tap()
                        isTimerSheetPresented = false
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var editTimeSheet: some View {
        NavigationStack {
            Form {
                DatePicker("시작", selection: $editStartDate, displayedComponents: [.date, .hourAndMinute])
                DatePicker("종료", selection: $editEndDate, displayedComponents: [.date, .hourAndMinute])
            }
            .navigationTitle("시간 수정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소") {
                        AppHaptics.tap()
                        isEditSheetPresented = false
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") {
                        AppHaptics.tap()
                        saveEditedPracticeWindow()
                        isEditSheetPresented = false
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var exportSheet: some View {
        NavigationStack {
            List {
                Section("내보내기 미리보기") {
                    Text(exportSummaryText)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .textSelection(.enabled)
                }
            }
            .navigationTitle("기록 내보내기")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") {
                        AppHaptics.tap()
                        isExportSheetPresented = false
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(item: exportSummaryText) {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }

    private var selectedDateText: String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy. MM. dd EEE"
        return formatter.string(from: dateStore.selectedDate).lowercased()
    }

    private var shortSelectedDate: String {
        dateStore.selectedDate.formatted(
            Date.FormatStyle()
                .year(.twoDigits)
                .month(.twoDigits)
                .day(.twoDigits)
        )
    }

    private var isTodaySelected: Bool {
        calendar.isDate(dateStore.selectedDate, inSameDayAs: .now)
    }

    private var selectedDateKey: String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: dateStore.selectedDate)
    }

    private var selectedDateMinutes: Int {
        practiceDataStore.records(for: selectedDateKey).reduce(0) { $0 + max(0, $1.practiceTime) }
    }

    private var selectedDateChecked: (numerator: Int, denominator: Int) {
        let visibleTracks = tracksStore.tracks(for: dateStore.selectedDate)
        let denominator = visibleTracks.count
        let numerator = visibleTracks.filter { tracksStore.hasChecked(trackId: $0.id, on: selectedDateKey) }.count
        return (numerator, denominator)
    }

    private var elapsedText: String {
        let totalSec = max(0, Int(practiceDataStore.timerMilliseconds / 1000))
        let hour = totalSec / 3600
        let min = (totalSec % 3600) / 60
        let sec = totalSec % 60
        return String(format: "%02d:%02d:%02d", hour, min, sec)
    }

    private var todayCheer: String {
        if let temp = temporaryCheerMessage() {
            return temp
        }
        if let special = specialCheerMessage() {
            return special
        }
        return fallbackCheerMessage()
    }

    private var exportSummaryText: String {
        let dateText = shortSelectedDate
        let tracked = "\(selectedDateChecked.numerator)/\(selectedDateChecked.denominator) 곡"
        let timeText = "\(selectedDateMinutes / 60)시간 \(selectedDateMinutes % 60)분"
        return """
        \(nickname)
        \(dateText) 피출 기록
        연습 시간: \(timeText)
        연습한 곡: \(tracked)
        """
    }

    private func prepareEditSheetValues() {
        let nowMs = Int64(Date().timeIntervalSince1970 * 1000)
        let startMs = practiceDataStore.timerStartTime ?? nowMs
        let elapsedMs = practiceDataStore.timerMilliseconds
        let endMs = max(startMs + elapsedMs, startMs)
        editStartDate = Date(timeIntervalSince1970: TimeInterval(startMs) / 1000)
        editEndDate = Date(timeIntervalSince1970: TimeInterval(endMs) / 1000)
    }

    private func saveEditedPracticeWindow() {
        let startMs = Int64(editStartDate.timeIntervalSince1970 * 1000)
        let endMs = Int64(editEndDate.timeIntervalSince1970 * 1000)
        guard endMs >= startMs else { return }

        if practiceDataStore.timerActive {
            practiceDataStore.updateTimerStartTime(startMs)
        } else {
            practiceDataStore.upsertManualRecord(
                id: nil,
                startTimeMs: startMs,
                endTimeMs: endMs,
                memo: nil
            )
        }
    }

    private func syncProfile() {
        nickname = UserDefaults.standard.string(forKey: "nickname") ?? "디붕이"
        avatarPath = UserDefaults.standard.string(forKey: "avatar") ?? ""
    }

    private func loadAvatarImage() -> UIImage? {
        guard !avatarPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        if avatarPath.hasPrefix("data:image"),
           let base64 = avatarPath.components(separatedBy: ",").last,
           let data = Data(base64Encoded: base64) {
            return UIImage(data: data)
        }
        if FileManager.default.fileExists(atPath: avatarPath) {
            return UIImage(contentsOfFile: avatarPath)
        }
        return nil
    }

    private func fallbackCheerMessage() -> String {
        let hour = calendar.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "좋은 아침이에요. 오늘도 피출!"
        case 12..<18: return "집중이 잘 되는 시간이에요."
        case 18..<24: return "오늘 마무리 피출까지 화이팅!"
        default: return "늦은 시간에도 꾸준함이 최고예요."
        }
    }

    private func specialCheerMessage() -> String? {
        let todayKey = monthDayKey(for: .now)
        return specialCheerByMonthDay[todayKey]
    }

    private func monthDayKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "MM-dd"
        return formatter.string(from: date)
    }

    private func temporaryCheerMessage() -> String? {
        let defaults = UserDefaults.standard
        guard let data = defaults.data(forKey: "temporaryCheers"),
              let items = try? JSONDecoder().decode([TemporaryCheer].self, from: data) else {
            return nil
        }

        let now = Date()
        let valid = items.filter { item in
            guard let expires = item.expiresAt else { return true }
            return expires > now
        }
        if valid.count != items.count,
           let encoded = try? JSONEncoder().encode(valid) {
            defaults.set(encoded, forKey: "temporaryCheers")
        }
        guard let latest = valid.sorted(by: { ($0.date ?? .distantPast) > ($1.date ?? .distantPast) }).first else {
            return nil
        }
        return latest.message?.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private let specialCheerByMonthDay: [String: String] = [
        "01-01": "Happy New Year! 새해 복 많이 받으세요!",
        "01-27": "모차르트 탄생일! 천재의 하루를 함께 피출해요.",
        "03-01": "삼일절 - 대한독립만세!",
        "05-05": "어린이날, 오늘도 즐겁게 피출!",
        "06-06": "현충일 - 순국선열을 기립니다.",
        "06-21": "세계 음악의 날, 더 깊게 연습해봐요.",
        "08-15": "광복절, 오늘의 피출도 완주!",
        "10-03": "개천절, 차분하게 한 곡 완성해봐요.",
        "10-09": "한글날, 악보 읽기 리듬도 업!",
        "12-25": "메리 크리스마스! 따뜻한 연습 되세요."
    ]
}

#Preview {
    HomeView()
        .environmentObject(SelectedDateStore())
        .environmentObject(PracticeTracksStore())
        .environmentObject(PracticeDataStore())
}

private struct TemporaryCheer: Codable {
    let message: String?
    let date: Date?
    let expiresAt: Date?
}

private struct StatRow<Trailing: View>: View {
    let iconName: String
    let iconTint: Color
    let title: String
    let value: String
    @ViewBuilder let trailingButton: () -> Trailing

    init(
        iconName: String,
        iconTint: Color,
        title: String,
        value: String,
        @ViewBuilder trailingButton: @escaping () -> Trailing = { EmptyView() }
    ) {
        self.iconName = iconName
        self.iconTint = iconTint
        self.title = title
        self.value = value
        self.trailingButton = trailingButton
    }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: iconName)
                .foregroundStyle(iconTint)
                .frame(width: 28, height: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.headline)
                    .foregroundStyle(.primary)
            }

            Spacer(minLength: 0)
            trailingButton()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }
}
