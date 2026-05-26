import SwiftUI

struct TodayView: View {
    @EnvironmentObject private var dateStore: SelectedDateStore
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @EnvironmentObject private var practiceDataStore: PracticeDataStore

    @AppStorage("nickname") private var nickname = String(localized: "settings.nickname.default")
    @AppStorage("avatar") private var avatarPath = ""

    @State private var isDatePickerPresented = false
    @State private var isAddSheetPresented = false
    @State private var newTrackTitle = ""
    @State private var editingTrackId: Int?
    @State private var editingTitle = ""
    @State private var pendingDeleteTrackId: Int?
    @State private var detailTrackId: Int?
    @State private var counterTrackId: Int?
    @State private var isCounterPresented = false
    @State private var shareCandidateRecords: [PracticeRecord] = []
    @State private var isSharePickerPresented = false

    var body: some View {
        NavigationStack {
            List {
                if visibleTracks.isEmpty {
                    VStack(spacing: 8) {
                        Label("today.empty.title", systemImage: "music.note.list")
                        Text("today.empty.description")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 24)
                } else {
                    ForEach(visibleTracks) { track in
                        rowView(for: track)
                    }
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Color(uiColor: .systemBackground))
            .navigationTitle("today.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        AppHaptics.tap()
                        dateStore.selectedDate = .now
                    } label: {
                        Image(systemName: "arrow.counterclockwise.circle")
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(isSelectedDateToday ? .tertiary : .primary)
                    .disabled(isSelectedDateToday)
                    .hoverEffect(.lift)
                }
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Button {
                            AppHaptics.tap()
                            shiftSelectedDate(by: -1)
                        } label: {
                            Image(systemName: "chevron.left")
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.primary)
                        .hoverEffect(.lift)

                        Text(selectedDateText)
                            .font(.callout.weight(.semibold))
                            .monospacedDigit()
                            .frame(width: 170, alignment: .center)

                        Button {
                            AppHaptics.tap()
                            shiftSelectedDate(by: 1)
                        } label: {
                            Image(systemName: "chevron.right")
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.primary)
                        .hoverEffect(.lift)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 4) {
                        // 공유 버튼
                        Button {
                            AppHaptics.tap()
                            handleShareButtonTap()
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(hasRecordsForSelectedDate ? .primary : .tertiary)
                        .disabled(!hasRecordsForSelectedDate)
                        .hoverEffect(.lift)

                        // 캘린더 버튼
                        Button {
                            AppHaptics.tap()
                            isDatePickerPresented = true
                        } label: {
                            Image(systemName: "calendar")
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.primary)
                        .hoverEffect(.lift)
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                HStack {
                    Spacer()
                    Button {
                        AppHaptics.tap()
                        newTrackTitle = ""
                        isAddSheetPresented = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 60, height: 60)
                            .background(AppPalette.todayTheme, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(Text("common.add"))
                    Spacer()
                }
                .padding(.bottom, 8)
            }
            .sheet(isPresented: $isDatePickerPresented) {
                NavigationStack {
                    DatePicker(
                        "today.datePicker.label",
                        selection: Binding(
                            get: { dateStore.selectedDate },
                            set: { dateStore.selectedDate = $0 }
                        ),
                        displayedComponents: [.date]
                    )
                    .datePickerStyle(.graphical)
                    .padding()
                    .navigationTitle("today.datePicker.title")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("today.datePicker.done") {
                                AppHaptics.tap()
                                isDatePickerPresented = false
                            }
                        }
                    }
                }
                .presentationDetents([.medium, .large])
            }
            .sheet(isPresented: $isAddSheetPresented) {
                NavigationStack {
                    Form {
                        TextField("today.track.title.placeholder", text: $newTrackTitle)
                    }
                    .navigationTitle("today.track.add.title")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("common.cancel") {
                                AppHaptics.tap()
                                isAddSheetPresented = false
                            }
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("common.add") {
                                AppHaptics.tap()
                                tracksStore.addTrack(title: newTrackTitle)
                                isAddSheetPresented = false
                            }
                            .disabled(!canAddNewTrack)
                        }
                    }
                }
                .presentationDetents([.fraction(0.3)])
            }
            .alert("today.track.edit.title", isPresented: Binding(
                get: { editingTrackId != nil },
                set: { if !$0 { editingTrackId = nil } }
            )) {
                TextField("today.track.title.placeholder", text: $editingTitle)
                Button("common.cancel", role: .cancel) {
                    AppHaptics.tap()
                    editingTrackId = nil
                }
                Button("common.save") {
                    AppHaptics.tap()
                    guard let trackId = editingTrackId else { return }
                    tracksStore.updateTrackTitle(id: trackId, title: editingTitle)
                    editingTrackId = nil
                }
            }
            .alert(
                deleteAlertTitle,
                isPresented: Binding(
                    get: { pendingDeleteTrackId != nil },
                    set: { if !$0 { pendingDeleteTrackId = nil } }
                )
            ) {
                Button("today.track.delete.mode.hard", role: .destructive) {
                    AppHaptics.tap()
                    guard let trackId = pendingDeleteTrackId else { return }
                    tracksStore.removeTrack(id: trackId)
                    pendingDeleteTrackId = nil
                }
                Button("today.track.complete.action") {
                    AppHaptics.tap()
                    guard let trackId = pendingDeleteTrackId else { return }
                    let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: .now) ?? .now
                    tracksStore.markTrackComplete(id: trackId, on: yesterday)
                    pendingDeleteTrackId = nil
                }
            } message: {
                Text("today.track.delete.warning")
            }
            .sheet(isPresented: Binding(
                get: { detailTrackId != nil },
                set: { if !$0 { detailTrackId = nil } }
            )) {
                if let trackId = detailTrackId {
                    TrackDetailView(trackId: trackId)
                }
            }
            .navigationDestination(isPresented: $isCounterPresented) {
                TrackCounterView(trackId: counterTrackId)
            }
            .sheet(isPresented: $isSharePickerPresented) {
                sharePickerSheet
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    private var visibleTracks: [PracticeTrack] {
        tracksStore.tracks(for: dateStore.selectedDate)
    }

    private var selectedDateText: String {
        dateStore.selectedDate.formatted(
            Date.FormatStyle()
                .year()
                .month(.twoDigits)
                .day(.twoDigits)
                .weekday(.abbreviated)
        )
    }

    private var canAddNewTrack: Bool {
        !newTrackTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var isSelectedDateToday: Bool {
        Calendar.current.isDate(dateStore.selectedDate, inSameDayAs: .now)
    }

    private func shiftSelectedDate(by days: Int) {
        if let shifted = Calendar.current.date(byAdding: .day, value: days, to: dateStore.selectedDate) {
            dateStore.selectedDate = shifted
        }
    }

    // MARK: - Share

    private var selectedDateKey: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: dateStore.selectedDate)
    }

    private var hasRecordsForSelectedDate: Bool {
        !practiceDataStore.records(for: selectedDateKey).filter { $0.practiceTime > 0 }.isEmpty
    }

    private func handleShareButtonTap() {
        let records = practiceDataStore.records(for: selectedDateKey).filter { $0.practiceTime > 0 }
        guard !records.isEmpty else { return }
        if records.count == 1 {
            renderAndShare(record: records[0])
        } else {
            shareCandidateRecords = records
            isSharePickerPresented = true
        }
    }

    private func renderAndShare(record: PracticeRecord) {
        guard let windowScene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) else { return }

        let image = ShareCardMaker.makeImage(
            record: record,
            nickname: nickname,
            dateText: selectedDateText,
            avatarPath: avatarPath
        )
        ShareCardMaker.present(image: image, from: window)
    }

    private func shareSessionTimeRange(for record: PracticeRecord) -> String {
        let start = Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000)
        let end = Date(timeIntervalSince1970: TimeInterval(record.endTime) / 1000)
        return "\(start.formatted(date: .omitted, time: .shortened)) ~ \(end.formatted(date: .omitted, time: .shortened))"
    }

    private func formattedHoursMinutes(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        if h > 0 && m > 0 { return "\(h)시간 \(m)분" }
        if h > 0 { return "\(h)시간" }
        return "\(m)분"
    }

    private var sharePickerSheet: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(Array(shareCandidateRecords.enumerated()), id: \.element.id) { index, record in
                        Button {
                            AppHaptics.tap()
                            isSharePickerPresented = false
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                                renderAndShare(record: record)
                            }
                        } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("세션 \(index + 1) · \(formattedHoursMinutes(record.practiceTime))")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.primary)
                                Text(shareSessionTimeRange(for: record))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                } header: {
                    Text("공유할 세션을 선택하세요")
                }
            }
            .navigationTitle("공유")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.cancel") {
                        AppHaptics.tap()
                        isSharePickerPresented = false
                    }
                }
            }
        }
        .presentationDetents([.fraction(0.4), .medium])
    }

    private var deleteAlertTitle: String {
        guard let id = pendingDeleteTrackId,
              let track = tracksStore.tracks.first(where: { $0.id == id }) else {
            return String(localized: "today.track.delete.confirm.default")
        }
        return String(
            format: String(localized: "today.track.delete.confirm.format"),
            track.title
        )
    }

    private func rowView(for track: PracticeTrack) -> some View {
        let id = track.id
        let title = track.title
        let checked = tracksStore.isChecked(date: dateStore.selectedDate, trackId: id)
        let subtitle = tracksStore.subtitle(for: track, selectedDate: dateStore.selectedDate)
        let count = tracksStore.partialCount(date: dateStore.selectedDate, trackId: id)

        return TrackRowView(
            trackTitle: title,
            isChecked: checked,
            subtitle: subtitle,
            partialCount: count,
            themeColor: AppPalette.todayTheme,
            onToggleCheck: {
                AppHaptics.tap()
                tracksStore.toggleCheck(date: dateStore.selectedDate, trackId: id)
            },
            onOpenDetail: {
                AppHaptics.tap()
                detailTrackId = id
            },
            onDecrement: {
                AppHaptics.tap()
                tracksStore.decrementPartial(date: dateStore.selectedDate, trackId: id)
            },
            onOpenCounter: {
                AppHaptics.tap()
                counterTrackId = id
                isCounterPresented = true
            },
            onIncrement: {
                AppHaptics.tap()
                tracksStore.incrementPartial(date: dateStore.selectedDate, trackId: id)
            },
            onEdit: {
                AppHaptics.tap()
                editingTrackId = id
                editingTitle = title
            },
            onDelete: {
                AppHaptics.tap()
                pendingDeleteTrackId = id
            }
        )
    }

}

private struct TrackRowView: View {
    let trackTitle: String
    let isChecked: Bool
    let subtitle: String
    let partialCount: Int
    let themeColor: Color

    let onToggleCheck: () -> Void
    let onOpenDetail: () -> Void
    let onDecrement: () -> Void
    let onOpenCounter: () -> Void
    let onIncrement: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button {
                onToggleCheck()
            } label: {
                Image(systemName: isChecked ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
            }
            .buttonStyle(.borderless)
            .tint(.primary)

            Button {
                onOpenDetail()
            } label: {
                VStack(alignment: .leading, spacing: 4) {
                    Text(trackTitle)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)

            HStack(spacing: 6) {
                Button {
                    onIncrement()
                } label: {
                    Image(systemName: "plus.circle")
                        .font(.system(size: 18))
                }
                .buttonStyle(.borderless)
                .tint(.primary)

                Button {
                    onOpenCounter()
                } label: {
                    Text("\(partialCount)")
                        .font(.callout.monospacedDigit())
                        .frame(minWidth: 24)
                }
                .buttonStyle(.borderless)
                .tint(.primary)

                Button {
                    onDecrement()
                } label: {
                    Image(systemName: "minus.circle")
                        .font(.system(size: 18))
                }
                .buttonStyle(.borderless)
                .tint(.primary)

                Menu {
                    Button {
                        AppHaptics.tap()
                        onEdit()
                    } label: {
                        Label("common.edit", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
                        AppHaptics.tap()
                        onDelete()
                    } label: {
                        Label("common.delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 18))
                }
                .buttonStyle(.borderless)
                .tint(.primary)
            }
        }
        .frame(minHeight: 52)
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
    }
}

#Preview {
    TodayView()
        .environmentObject(SelectedDateStore())
        .environmentObject(PracticeTracksStore())
}
