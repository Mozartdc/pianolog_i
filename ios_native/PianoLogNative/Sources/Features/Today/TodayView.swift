import SwiftUI

struct TodayView: View {
    @EnvironmentObject private var dateStore: SelectedDateStore
    @EnvironmentObject private var tracksStore: PracticeTracksStore

    @State private var isDatePickerPresented = false
    @State private var isAddSheetPresented = false
    @State private var newTrackTitle = ""
    @State private var editingTrackId: Int?
    @State private var editingTitle = ""
    @State private var detailTrackId: Int?
    @State private var counterTrackId: Int?
    @State private var counterDate: Date = .now
    @State private var isCounterPresented = false

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
                    Button {
                        isDatePickerPresented = true
                    } label: {
                        Image(systemName: "calendar")
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.primary)
                    .hoverEffect(.lift)
                }
            }
            .safeAreaInset(edge: .bottom) {
                HStack {
                    Spacer()
                    Button {
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
                                isAddSheetPresented = false
                            }
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("common.add") {
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
                    editingTrackId = nil
                }
                Button("common.save") {
                    guard let trackId = editingTrackId else { return }
                    tracksStore.updateTrackTitle(id: trackId, title: editingTitle)
                    editingTrackId = nil
                }
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
                if let trackId = counterTrackId,
                   let track = tracksStore.tracks.first(where: { $0.id == trackId }) {
                    TrackCounterView(track: track, selectedDate: counterDate)
                } else {
                    Text("track.notFound")
                }
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
            onToggleCheck: { tracksStore.toggleCheck(date: dateStore.selectedDate, trackId: id) },
            onOpenDetail: { detailTrackId = id },
            onDecrement: { tracksStore.decrementPartial(date: dateStore.selectedDate, trackId: id) },
            onOpenCounter: {
                counterTrackId = id
                counterDate = dateStore.selectedDate
                isCounterPresented = true
            },
            onIncrement: { tracksStore.incrementPartial(date: dateStore.selectedDate, trackId: id) },
            onEdit: {
                editingTrackId = id
                editingTitle = title
            },
            onDelete: { tracksStore.removeTrack(id: id) }
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
                        onEdit()
                    } label: {
                        Label("common.edit", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
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
