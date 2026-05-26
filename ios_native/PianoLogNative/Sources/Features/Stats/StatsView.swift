import SwiftUI
import Charts

struct StatsView: View {
    @EnvironmentObject private var dateStore: SelectedDateStore
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @EnvironmentObject private var practiceDataStore: PracticeDataStore

    @State private var detailDate: Date = .now
    @State private var isCalendarSheetPresented = false
    @State private var expandedRecordID: String?
    @State private var editingTimeRecord: PracticeRecord?
    @State private var editingMemoRecord: PracticeRecord?
    @State private var deletingRecord: PracticeRecord?
    @State private var editedStartDate: Date = .now
    @State private var editedEndDate: Date = .now
    @State private var editedMemo: String = ""
    @State private var isMonthTrendExpanded = false
    @State private var isYearTrendExpanded = false
    @ScaledMetric(relativeTo: .body) private var sectionSpacing: CGFloat = 14
    @ScaledMetric(relativeTo: .body) private var horizontalPadding: CGFloat = 16
    @ScaledMetric(relativeTo: .body) private var cardPadding: CGFloat = 12
    @ScaledMetric(relativeTo: .body) private var heatmapCellSize: CGFloat = 9
    @ScaledMetric(relativeTo: .title3) private var chartHeight: CGFloat = 145
    @ScaledMetric(relativeTo: .title3) private var trendChartHeight: CGFloat = 160

    private let calendar = Calendar(identifier: .gregorian)
    private let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Spacer()
                Image(systemName: "arrow.up.left")
                    .font(.system(size: 32, weight: .thin))
                    .foregroundStyle(.tertiary)
                Text("연습기록 상세 보기에서\n통계를 확인하세요")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(uiColor: .systemBackground))
            .navigationTitle("stats.title")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $isCalendarSheetPresented) {
                calendarDetailSheet
            }
            .sheet(item: $editingTimeRecord) { record in
                editTimeSheet(record: record)
            }
            .sheet(item: $editingMemoRecord) { record in
                editMemoSheet(record: record)
            }
            .confirmationDialog(
                "stats.session.delete.title",
                isPresented: Binding(
                    get: { deletingRecord != nil },
                    set: { value in
                        if !value { deletingRecord = nil }
                    }
                ),
                titleVisibility: .visible
            ) {
                Button("common.delete", role: .destructive) {
                    guard let record = deletingRecord else { return }
                    AppHaptics.tap()
                    practiceDataStore.deleteRecord(id: record.id)
                    deletingRecord = nil
                    if expandedRecordID == record.id {
                        expandedRecordID = nil
                    }
                }
                Button("common.cancel", role: .cancel) {
                    AppHaptics.tap()
                }
            } message: {
                Text("stats.session.delete.message")
            }
            .onAppear {
                detailDate = dateStore.selectedDate
            }
            .onChange(of: dateStore.selectedDate) { newValue in
                detailDate = newValue
            }
        }
    }

    private var streakCards: some View {
        HStack(spacing: 10) {
            streakCard(title: String(localized: "stats.streak.current"), value: currentStreak)
            streakCard(title: String(localized: "stats.streak.best"), value: bestStreak)
        }
    }

    private var totalPracticeBanner: some View {
        HStack(spacing: 4) {
            Text("stats.total.prefix")
                .foregroundStyle(.secondary)
            Text(formatMinutes(totalMinutes))
                .foregroundStyle(AppPalette.todayTheme)
                .fontWeight(.bold)
            Text("stats.total.suffix")
                .foregroundStyle(.secondary)
        }
        .font(.subheadline)
        .frame(maxWidth: .infinity, alignment: .center)
    }

    private func streakCard(title: String, value: Int) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("\(value)")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(AppPalette.todayTheme)
            Text("stats.day.unit")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }

    private var practicedDayStrip: some View {
        HStack(spacing: 8) {
            Text("stats.strip.week")
            Text("\(weekPracticeDays) \(String(localized: "stats.day.unit"))")
                .fontWeight(.bold)
                .foregroundStyle(AppPalette.todayTheme)
            Text("·")
            Text("stats.strip.month")
            Text("\(monthPracticeDays) \(String(localized: "stats.day.unit"))")
                .fontWeight(.bold)
                .foregroundStyle(AppPalette.todayTheme)
            Text("·")
            Text("stats.strip.year")
            Text("\(yearPracticeDays) \(String(localized: "stats.day.unit"))")
                .fontWeight(.bold)
                .foregroundStyle(AppPalette.todayTheme)
        }
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.top, 2)
    }

    private var heatmapSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("stats.heatmap.title")
                    .font(.headline)
                Spacer()
                Button {
                    AppHaptics.tap()
                    detailDate = dateStore.selectedDate
                    isCalendarSheetPresented = true
                } label: {
                    Text("stats.heatmap.detail")
                }
                .buttonStyle(.bordered)
                .hoverEffect(.lift)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHGrid(
                    rows: Array(repeating: GridItem(.fixed(heatmapCellSize), spacing: 2), count: 7),
                    spacing: 2
                ) {
                    ForEach(heatmapDates, id: \.self) { date in
                        let level = heatmapLevel(for: date)
                        RoundedRectangle(cornerRadius: 2, style: .continuous)
                            .fill(heatmapColor(level: level))
                            .frame(width: heatmapCellSize, height: heatmapCellSize)
                            .overlay(
                                RoundedRectangle(cornerRadius: 2, style: .continuous)
                                    .strokeBorder(Color.black.opacity(0.04), lineWidth: 0.5)
                            )
                            .accessibilityLabel(
                                Text(
                                    String(localized: "stats.heatmap.cell.a11y")
                                        .replacingOccurrences(of: "{DATE}", with: dayKey(for: date))
                                        .replacingOccurrences(of: "{LEVEL}", with: "\(level)")
                                )
                            )
                    }
                }
                .frame(height: (heatmapCellSize + 2) * 7)
                .padding(.vertical, 2)
            }

            HStack(spacing: 8) {
                Text("stats.heatmap.less")
                ForEach(0..<4, id: \.self) { level in
                    RoundedRectangle(cornerRadius: 2, style: .continuous)
                        .fill(heatmapColor(level: level))
                        .frame(width: heatmapCellSize + 2, height: heatmapCellSize + 2)
                }
                Text("stats.heatmap.more")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding(cardPadding)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }

    private var chartSection: some View {
        VStack(spacing: 12) {
            weeklyTimeChart
            weeklySongChart
        }
    }

    private var weeklyTimeChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("stats.chart.weekTime")
                .font(.headline)
            Text(weekTimeSummary)
                .font(.caption)
                .foregroundStyle(.secondary)
            Chart {
                ForEach(weekDates, id: \.self) { date in
                    LineMark(
                        x: .value(String(localized: "stats.chart.axis.weekday"), weekdayLetter(for: date)),
                        y: .value(String(localized: "stats.chart.axis.minutes"), minutesByDayKey[dayKey(for: date)] ?? 0)
                    )
                    .foregroundStyle(AppPalette.todayTheme)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value(String(localized: "stats.chart.axis.weekday"), weekdayLetter(for: date)),
                        y: .value(String(localized: "stats.chart.axis.minutes"), minutesByDayKey[dayKey(for: date)] ?? 0)
                    )
                    .symbolSize(40)
                    .foregroundStyle(AppPalette.todayTheme)
                }
            }
            .frame(height: chartHeight)
            .chartYAxis {
                AxisMarks(position: .leading)
            }
        }
        .padding(cardPadding)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }

    private var weeklySongChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("stats.chart.weekSong")
                .font(.headline)
            Text(weekSongSummary)
                .font(.caption)
                .foregroundStyle(.secondary)
            Chart {
                ForEach(weekDates, id: \.self) { date in
                    BarMark(
                        x: .value(String(localized: "stats.chart.axis.weekday"), weekdayLetter(for: date)),
                        y: .value(String(localized: "stats.chart.axis.tracks"), checkedTrackCount(for: dayKey(for: date)))
                    )
                    .foregroundStyle(AppPalette.homeTheme)
                }
            }
            .frame(height: chartHeight)
            .chartYAxis {
                AxisMarks(position: .leading)
            }
        }
        .padding(cardPadding)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }

    private var trendSection: some View {
        VStack(spacing: 8) {
            DisclosureGroup(isExpanded: $isMonthTrendExpanded) {
                Chart {
                    ForEach(Array(monthTrendMinutes.enumerated()), id: \.offset) { index, value in
                        BarMark(
                            x: .value(String(localized: "stats.chart.axis.week"), "W\(index + 1)"),
                            y: .value(String(localized: "stats.chart.axis.minutes"), value)
                        )
                        .foregroundStyle(AppPalette.todayTheme)
                    }
                }
                .frame(height: trendChartHeight)
                .padding(.top, 8)
            } label: {
                HStack {
                    Text("stats.trend.month")
                    Spacer()
                    Text(formatMinutes(currentMonthMinutes))
                        .foregroundStyle(.secondary)
                }
                .font(.subheadline.weight(.semibold))
            }

            Divider()

            DisclosureGroup(isExpanded: $isYearTrendExpanded) {
                Chart {
                    ForEach(Array(yearTrendMinutes.enumerated()), id: \.offset) { index, value in
                        BarMark(
                            x: .value(String(localized: "stats.chart.axis.month"), monthLabel(index: index)),
                            y: .value(String(localized: "stats.chart.axis.minutes"), value)
                        )
                        .foregroundStyle(AppPalette.homeTheme)
                    }
                }
                .frame(height: trendChartHeight)
                .padding(.top, 8)
            } label: {
                HStack {
                    Text("stats.trend.year")
                    Spacer()
                    Text(formatMinutes(currentYearMinutes))
                        .foregroundStyle(.secondary)
                }
                .font(.subheadline.weight(.semibold))
            }
        }
        .padding(cardPadding)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }

    private var todaySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("stats.today.title")
                .font(.headline)
            Text(todayDateText)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("\(String(localized: "stats.today.minutes")): \(formatMinutes(todayMinutes))")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("\(String(localized: "stats.today.songs")): \(todayCheckedCount)/\(todayVisibleTrackCount)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Divider()

            if todayVisibleTracks.isEmpty {
                Text("stats.today.empty")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(todayVisibleTracks) { track in
                        let checked = tracksStore.hasChecked(trackId: track.id, on: todayKey)
                        HStack(spacing: 8) {
                            Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(checked ? AppPalette.todayTheme : .secondary)
                                .font(.system(size: 14))
                            Text(track.title)
                                .font(.footnote)
                                .foregroundStyle(checked ? .primary : .secondary)
                                .lineLimit(1)
                                .truncationMode(.tail)
                        }
                    }
                }
            }
        }
        .padding(cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }

    private var calendarDetailSheet: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Button {
                            AppHaptics.tap()
                            shiftDetailDate(by: -1)
                        } label: {
                            Image(systemName: "chevron.left")
                        }
                        .buttonStyle(.bordered)
                        .hoverEffect(.lift)

                        Spacer()

                        Text(detailDate.formatted(date: .complete, time: .omitted))
                            .font(.subheadline.weight(.semibold))
                            .multilineTextAlignment(.center)

                        Spacer()

                        Button {
                            AppHaptics.tap()
                            shiftDetailDate(by: 1)
                        } label: {
                            Image(systemName: "chevron.right")
                        }
                        .buttonStyle(.bordered)
                        .hoverEffect(.lift)
                    }

                    DatePicker(
                        "stats.calendar.datePicker",
                        selection: Binding(
                            get: { detailDate },
                            set: { newValue in
                                detailDate = newValue
                                dateStore.selectedDate = newValue
                            }
                        ),
                        displayedComponents: [.date]
                    )
                    .datePickerStyle(.graphical)
                }

                Section("stats.calendar.summary") {
                    Text(detailDate.formatted(date: .abbreviated, time: .omitted))
                    Text("\(String(localized: "stats.today.minutes")): \(formatMinutes(detailDateMinutes))")
                    Text("\(String(localized: "stats.calendar.sessions")): \(detailDateRecords.count)\(String(localized: "stats.count.unit"))")
                    Text("\(String(localized: "stats.today.songs")): \(detailCheckedTrackCount)/\(detailVisibleTrackCount)")
                }

                Section("stats.calendar.sessionList") {
                    if detailDateRecords.isEmpty {
                        Text("stats.record.none")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(detailDateRecords) { record in
                            DisclosureGroup(
                                isExpanded: Binding(
                                    get: { expandedRecordID == record.id },
                                    set: { isExpanded in
                                        expandedRecordID = isExpanded ? record.id : nil
                                    }
                                )
                            ) {
                                VStack(alignment: .leading, spacing: 10) {
                                    Text("stats.memo")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                    Text(record.memo?.isEmpty == false ? (record.memo ?? "") : String(localized: "stats.memo.none"))
                                        .font(.subheadline)

                                    HStack(spacing: 8) {
                                        Button("stats.edit.time") {
                                            AppHaptics.tap()
                                            editingTimeRecord = record
                                            editedStartDate = Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000)
                                            editedEndDate = Date(timeIntervalSince1970: TimeInterval(record.endTime) / 1000)
                                        }
                                        .buttonStyle(.bordered)

                                        Button("stats.edit.memo") {
                                            AppHaptics.tap()
                                            editingMemoRecord = record
                                            editedMemo = record.memo ?? ""
                                        }
                                        .buttonStyle(.bordered)

                                        Button("common.delete", role: .destructive) {
                                            AppHaptics.tap()
                                            deletingRecord = record
                                        }
                                        .buttonStyle(.bordered)
                                    }
                                }
                                .padding(.top, 8)
                            } label: {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(sessionTitle(for: record, in: detailDateRecords))
                                        .font(.subheadline.weight(.semibold))
                                    Text(sessionTimeRange(for: record))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }

                Section("stats.today.songs") {
                    if detailVisibleTracks.isEmpty {
                        Text("stats.record.none")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(detailVisibleTracks) { track in
                            let checked = tracksStore.hasChecked(trackId: track.id, on: detailDateKey)
                            HStack(spacing: 8) {
                                Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(checked ? AppPalette.todayTheme : .secondary)
                                Text(track.title)
                                    .foregroundStyle(checked ? .primary : .secondary)
                                    .lineLimit(1)
                            }
                        }
                    }
                }
            }
            .navigationTitle("stats.calendar.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.done") {
                        AppHaptics.tap()
                        dateStore.selectedDate = detailDate
                        isCalendarSheetPresented = false
                    }
                }
            }
        }
        .presentationDetents([.large])
    }

    private func editTimeSheet(record: PracticeRecord) -> some View {
        NavigationStack {
            Form {
                DatePicker("common.start", selection: $editedStartDate, displayedComponents: [.date, .hourAndMinute])
                DatePicker("common.end", selection: $editedEndDate, displayedComponents: [.date, .hourAndMinute])
            }
            .navigationTitle("stats.edit.time")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("common.cancel") {
                        AppHaptics.tap()
                        editingTimeRecord = nil
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.save") {
                        AppHaptics.tap()
                        let startMs = Int64(editedStartDate.timeIntervalSince1970 * 1000)
                        let endMs = Int64(editedEndDate.timeIntervalSince1970 * 1000)
                        practiceDataStore.updateRecordTimes(id: record.id, startTimeMs: startMs, endTimeMs: endMs)
                        editingTimeRecord = nil
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func editMemoSheet(record: PracticeRecord) -> some View {
        NavigationStack {
            Form {
                Section("stats.memo") {
                    TextEditor(text: $editedMemo)
                        .frame(minHeight: 180)
                }
            }
            .navigationTitle("stats.edit.memo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("common.cancel") {
                        AppHaptics.tap()
                        editingMemoRecord = nil
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.save") {
                        AppHaptics.tap()
                        practiceDataStore.updateRecordMemo(id: record.id, memo: editedMemo)
                        editingMemoRecord = nil
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var totalMinutes: Int {
        practiceDataStore.totalMinutes()
    }

    private var minutesByDayKey: [String: Int] {
        Dictionary(grouping: practiceDataStore.practiceRecords, by: normalizedDayKey(for:))
            .mapValues { records in
                records.reduce(0) { $0 + max(0, $1.practiceTime) }
            }
    }

    private var sortedPracticedDateKeys: [String] {
        minutesByDayKey.keys
            .filter { (minutesByDayKey[$0] ?? 0) > 0 }
            .sorted()
    }

    private var currentStreak: Int {
        let practiced = Set(sortedPracticedDateKeys)
        var cursor = calendar.startOfDay(for: .now)
        var streak = 0
        let todayKey = dayKey(for: cursor)
        if !practiced.contains(todayKey) {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: cursor) else { return 0 }
            cursor = yesterday
        }

        while practiced.contains(dayKey(for: cursor)) {
            streak += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
            if streak > 3650 { break }
        }
        return streak
    }

    private var bestStreak: Int {
        let keys = sortedPracticedDateKeys
        guard !keys.isEmpty else { return 0 }
        var best = 1
        var running = 1
        for index in 1..<keys.count {
            guard
                let prev = dayFormatter.date(from: keys[index - 1]),
                let current = dayFormatter.date(from: keys[index])
            else { continue }
            let diff = calendar.dateComponents([.day], from: prev, to: current).day ?? 0
            if diff == 1 {
                running += 1
            } else {
                running = 1
            }
            best = max(best, running)
        }
        return best
    }

    private var weekDates: [Date] {
        let anchor = calendar.startOfDay(for: dateStore.selectedDate)
        let weekday = calendar.component(.weekday, from: anchor)
        let mondayDistance = (weekday + 5) % 7
        guard let weekStart = calendar.date(byAdding: .day, value: -mondayDistance, to: anchor) else { return [] }
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: weekStart) }
    }

    private var previousWeekDates: [Date] {
        weekDates.compactMap { calendar.date(byAdding: .day, value: -7, to: $0) }
    }

    private var weekPracticeDays: Int {
        weekDates.reduce(into: 0) { partial, date in
            if (minutesByDayKey[dayKey(for: date)] ?? 0) > 0 {
                partial += 1
            }
        }
    }

    private var weekTimeSummary: String {
        let currentTotal = weekDates.reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
        let previousTotal = previousWeekDates.reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
        let diff = currentTotal - previousTotal
        if diff == 0 {
            return String(localized: "stats.week.summary.same")
                .replacingOccurrences(of: "{TOTAL}", with: formatMinutes(currentTotal))
        }
        let changeSign = diff > 0 ? "+" : "-"
        return String(localized: "stats.week.summary.diff")
            .replacingOccurrences(of: "{TOTAL}", with: formatMinutes(currentTotal))
            .replacingOccurrences(of: "{SIGN}", with: changeSign)
            .replacingOccurrences(of: "{DIFF}", with: formatMinutes(abs(diff)))
    }

    private var weekSongSummary: String {
        let totalSongs = weekDates.reduce(0) { partial, date in
            partial + checkedTrackCount(for: dayKey(for: date))
        }
        let average = totalSongs / 7
        return String(localized: "stats.week.songSummary")
            .replacingOccurrences(of: "{TOTAL}", with: "\(totalSongs)")
            .replacingOccurrences(of: "{AVERAGE}", with: "\(average)")
    }

    private var monthPracticeDays: Int {
        let today = Date()
        guard let dayRange = calendar.range(of: .day, in: .month, for: today) else { return 0 }
        let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: today)) ?? today
        return dayRange.compactMap { day -> Date? in
            calendar.date(byAdding: .day, value: day - 1, to: monthStart)
        }.reduce(0) { partial, date in
            partial + ((minutesByDayKey[dayKey(for: date)] ?? 0) > 0 ? 1 : 0)
        }
    }

    private var yearPracticeDays: Int {
        let today = Date()
        guard let dayRange = calendar.range(of: .day, in: .year, for: today) else { return 0 }
        let yearStart = calendar.date(from: calendar.dateComponents([.year], from: today)) ?? today
        return dayRange.compactMap { day -> Date? in
            calendar.date(byAdding: .day, value: day - 1, to: yearStart)
        }.reduce(0) { partial, date in
            partial + ((minutesByDayKey[dayKey(for: date)] ?? 0) > 0 ? 1 : 0)
        }
    }

    private var currentMonthMinutes: Int {
        let today = Date()
        guard let range = calendar.range(of: .day, in: .month, for: today) else { return 0 }
        let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: today)) ?? today
        return range.compactMap { day in
            calendar.date(byAdding: .day, value: day - 1, to: monthStart)
        }.reduce(0) { partial, date in
            partial + (minutesByDayKey[dayKey(for: date)] ?? 0)
        }
    }

    private var currentYearMinutes: Int {
        let today = Date()
        guard let range = calendar.range(of: .day, in: .year, for: today) else { return 0 }
        let yearStart = calendar.date(from: calendar.dateComponents([.year], from: today)) ?? today
        return range.compactMap { day in
            calendar.date(byAdding: .day, value: day - 1, to: yearStart)
        }.reduce(0) { partial, date in
            partial + (minutesByDayKey[dayKey(for: date)] ?? 0)
        }
    }

    private var monthTrendMinutes: [Int] {
        let today = Date()
        let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: today)) ?? today
        return (0..<5).map { weekIndex in
            let start = calendar.date(byAdding: .day, value: weekIndex * 7, to: monthStart) ?? monthStart
            return (0..<7).compactMap { dayOffset in
                calendar.date(byAdding: .day, value: dayOffset, to: start)
            }.reduce(0) { partial, date in
                partial + (minutesByDayKey[dayKey(for: date)] ?? 0)
            }
        }
    }

    private var yearTrendMinutes: [Int] {
        let today = Date()
        let year = calendar.component(.year, from: today)
        return (1...12).map { month in
            var components = DateComponents()
            components.year = year
            components.month = month
            components.day = 1
            let monthStart = calendar.date(from: components) ?? today
            guard let dayRange = calendar.range(of: .day, in: .month, for: monthStart) else { return 0 }
            return dayRange.compactMap { day in
                calendar.date(byAdding: .day, value: day - 1, to: monthStart)
            }.reduce(0) { partial, date in
                partial + (minutesByDayKey[dayKey(for: date)] ?? 0)
            }
        }
    }

    private var todayMinutes: Int {
        minutesByDayKey[dayKey(for: .now)] ?? 0
    }

    private var todayVisibleTrackCount: Int {
        todayVisibleTracks.count
    }

    private var todayCheckedCount: Int {
        todayVisibleTracks.filter { track in
            tracksStore.hasChecked(trackId: track.id, on: todayKey)
        }.count
    }

    private var heatmapDates: [Date] {
        let days = 266
        let base = calendar.startOfDay(for: .now)
        return (0..<days).compactMap { offset in
            calendar.date(byAdding: .day, value: -(days - 1 - offset), to: base)
        }
    }

    private var detailDateKey: String {
        dayKey(for: detailDate)
    }

    private var todayKey: String {
        dayKey(for: .now)
    }

    private var todayDateText: String {
        Date.now.formatted(
            Date.FormatStyle()
                .year()
                .month(.twoDigits)
                .day(.twoDigits)
                .weekday(.abbreviated)
        )
    }

    private var todayVisibleTracks: [PracticeTrack] {
        tracksStore.tracks(for: .now)
    }

    private var detailVisibleTracks: [PracticeTrack] {
        tracksStore.tracks(for: detailDate)
    }

    private var detailDateRecords: [PracticeRecord] {
        practiceDataStore.practiceRecords
            .filter { normalizedDayKey(for: $0) == detailDateKey }
            .sorted(by: { $0.startTime < $1.startTime })
    }

    private var detailDateMinutes: Int {
        detailDateRecords.reduce(0) { $0 + max(0, $1.practiceTime) }
    }

    private var detailVisibleTrackCount: Int {
        detailVisibleTracks.count
    }

    private var detailCheckedTrackCount: Int {
        detailVisibleTracks.filter { track in
            tracksStore.hasChecked(trackId: track.id, on: detailDateKey)
        }.count
    }

    private func checkedTrackCount(for dayKey: String) -> Int {
        guard let dayChecks = tracksStore.practiceChecks[dayKey] else { return 0 }
        return dayChecks.values.filter { $0 }.count
    }

    private func shiftDetailDate(by dayOffset: Int) {
        guard let shifted = calendar.date(byAdding: .day, value: dayOffset, to: detailDate) else { return }
        detailDate = shifted
        dateStore.selectedDate = shifted
    }

    private func heatmapLevel(for date: Date) -> Int {
        let minutes = minutesByDayKey[dayKey(for: date)] ?? 0
        if minutes <= 0 { return 0 }
        if minutes >= 120 { return 3 }
        if minutes >= 60 { return 2 }
        return 1
    }

    private func heatmapColor(level: Int) -> Color {
        switch level {
        case 1:
            return AppPalette.homeTheme.opacity(0.35)
        case 2:
            return AppPalette.homeTheme.opacity(0.6)
        case 3:
            return AppPalette.homeTheme
        default:
            return Color(uiColor: .systemBackground)
        }
    }

    private func dayKey(for date: Date) -> String {
        dayFormatter.string(from: date)
    }

    private func normalizedDayKey(for record: PracticeRecord) -> String {
        if let normalized = normalizeRawDayKey(record.date) {
            return normalized
        }
        let startDate = Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000)
        return dayKey(for: startDate)
    }

    private func normalizeRawDayKey(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if trimmed.count >= 10 {
            let prefix = String(trimmed.prefix(10))
            if dayFormatter.date(from: prefix) != nil {
                return prefix
            }
        }

        let separators = ["-", ".", "/"]
        for separator in separators {
            let parts = trimmed.split(separator: Character(separator))
            if parts.count == 3,
               let y = Int(parts[0]),
               let m = Int(parts[1]),
               let d = Int(parts[2]) {
                var components = DateComponents()
                components.year = y
                components.month = m
                components.day = d
                if let date = calendar.date(from: components) {
                    return dayKey(for: date)
                }
            }
        }

        return nil
    }

    private func weekdayLetter(for date: Date) -> String {
        switch calendar.component(.weekday, from: date) {
        case 1: return "S"
        case 2: return "M"
        case 3: return "T"
        case 4: return "W"
        case 5: return "T"
        case 6: return "F"
        case 7: return "S"
        default: return "-"
        }
    }

    private func monthLabel(index: Int) -> String {
        let month = index + 1
        return "\(month)"
    }

    private func formatMinutes(_ minutes: Int) -> String {
        let safe = max(0, minutes)
        if safe == 0 { return String(localized: "stats.minutes.zero") }
        let hour = safe / 60
        let minute = safe % 60
        if hour > 0, minute > 0 {
            return String(localized: "stats.minutes.hourMinute")
                .replacingOccurrences(of: "{H}", with: "\(hour)")
                .replacingOccurrences(of: "{M}", with: "\(minute)")
        }
        if hour > 0 {
            return String(localized: "stats.minutes.hourOnly")
                .replacingOccurrences(of: "{H}", with: "\(hour)")
        }
        return String(localized: "stats.minutes.minuteOnly")
            .replacingOccurrences(of: "{M}", with: "\(minute)")
    }

    private func sessionTitle(for record: PracticeRecord, in records: [PracticeRecord]) -> String {
        let index = max(1, records.firstIndex(where: { $0.id == record.id }).map { $0 + 1 } ?? 1)
        return String(localized: "stats.session.title")
            .replacingOccurrences(of: "{INDEX}", with: "\(index)")
            .replacingOccurrences(of: "{DURATION}", with: formatMinutes(max(0, record.practiceTime)))
    }

    private func sessionTimeRange(for record: PracticeRecord) -> String {
        let start = Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000)
        let end = Date(timeIntervalSince1970: TimeInterval(record.endTime) / 1000)
        return "\(start.formatted(date: .omitted, time: .shortened)) ~ \(end.formatted(date: .omitted, time: .shortened))"
    }
}

#Preview {
    StatsView()
        .environmentObject(SelectedDateStore())
        .environmentObject(PracticeTracksStore())
        .environmentObject(PracticeDataStore())
}
