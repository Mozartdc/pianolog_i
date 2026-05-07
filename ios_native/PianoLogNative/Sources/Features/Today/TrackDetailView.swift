import SwiftUI
import AVFoundation

struct TrackDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @StateObject private var recorder = TrackRecorder()
    @State private var showRecordingSheet = false
    @State private var expandedRecordingID: UUID?
    @State private var recordingErrorMessage: String?
    @State private var showCompleteCelebration = false
    @State private var showUncompleteConfirm = false
    @State private var completeIconEffectTick = 0

    let trackId: Int

    var body: some View {
        NavigationStack {
            if let track = currentTrack {
                Form {
                    Section {
                        Label {
                            Text(practiceDaysText(track: track))
                                .foregroundStyle(.primary)
                        } icon: {
                            Image(systemName: "flame.fill")
                                .foregroundStyle(AppPalette.vivaMagenta)
                        }

                        Label {
                            Text(statsSummary(track: track))
                                .foregroundStyle(.primary)
                        } icon: {
                            Image(systemName: "chart.bar.doc.horizontal")
                                .foregroundStyle(AppPalette.todayTheme)
                        }

                        Toggle(isOn: Binding(
                            get: { track.completedDate != nil },
                            set: { isOn in
                                AppHaptics.tap()
                                if isOn {
                                    tracksStore.markTrackComplete(id: track.id)
                                    triggerCompletionHaptic()
                                    showCompleteCelebration = true
                                    completeIconEffectTick += 1
                                } else {
                                    showUncompleteConfirm = true
                                }
                            }
                        )) {
                            Label {
                                Text("track.complete.inline")
                            } icon: {
                                if #available(iOS 17.0, *) {
                                    Image(systemName: track.completedDate != nil ? "checkmark.seal.fill" : "checkmark.seal")
                                        .foregroundStyle(AppPalette.todayTheme)
                                        .symbolEffect(.bounce, value: completeIconEffectTick)
                                } else {
                                    Image(systemName: track.completedDate != nil ? "checkmark.seal.fill" : "checkmark.seal")
                                        .foregroundStyle(AppPalette.todayTheme)
                                }
                            }
                        }
                        .confirmationDialog("track.uncomplete.confirm.title", isPresented: $showUncompleteConfirm, titleVisibility: .visible) {
                            Button("track.uncomplete.confirm.action", role: .destructive) {
                                AppHaptics.tap()
                                tracksStore.unmarkTrackComplete(id: track.id)
                            }
                            Button("common.cancel", role: .cancel) {}
                        }

                        NavigationLink {
                            TrackCalendarDetailView(trackId: track.id)
                        } label: {
                            Label {
                                Text("track.practice.detail")
                            } icon: {
                                Image(systemName: "calendar")
                                    .foregroundStyle(AppPalette.todayTheme)
                            }
                        }
                        .simultaneousGesture(TapGesture().onEnded {
                            AppHaptics.tap()
                        })
                    }

                    Section("track.recent.section") {
                        TrackPracticeHeatmapView(
                            checkedDateKeys: tracksStore.checkedDateKeys(trackId: track.id)
                        )
                    }

                    if !recorder.recordings.isEmpty {
                        Section {
                            ForEach(recorder.recordings) { recording in
                                VStack(alignment: .leading, spacing: 8) {
                                    Button {
                                    AppHaptics.tap()
                                    if expandedRecordingID == recording.id {
                                        expandedRecordingID = nil
                                    } else {
                                        expandedRecordingID = recording.id
                                    }
                                    } label: {
                                        HStack(spacing: 10) {
                                            Image(systemName: "waveform")
                                                .foregroundStyle(AppPalette.todayTheme)
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(recording.title)
                                                    .font(.subheadline)
                                                    .foregroundStyle(.primary)
                                                Text("\(recording.dateString)")
                                                    .font(.caption)
                                                    .foregroundStyle(.secondary)
                                            }
                                            Spacer()
                                            Text(recording.durationString)
                                                .foregroundStyle(.secondary)
                                            Image(systemName: expandedRecordingID == recording.id ? "ellipsis.circle.fill" : "ellipsis")
                                                .foregroundStyle(AppPalette.todayTheme)
                                        }
                                    }
                                    .buttonStyle(.plain)

                                    if expandedRecordingID == recording.id {
                                        InlineRecordingControls(
                                            recording: recording,
                                            isPlaying: recorder.playingRecordingID == recording.id,
                                            progress: recorder.progress(for: recording),
                                            elapsedText: recorder.elapsedText(for: recording),
                                            remainText: recorder.remainingText(for: recording),
                                            playPauseAction: {
                                                AppHaptics.tap()
                                                recorder.togglePlay(recording: recording)
                                            },
                                            backAction: {
                                                AppHaptics.tap()
                                                recorder.skip(recording: recording, by: -15)
                                            },
                                            forwardAction: {
                                                AppHaptics.tap()
                                                recorder.skip(recording: recording, by: 15)
                                            },
                                            deleteAction: {
                                                AppHaptics.tap()
                                                recorder.delete(item: recording)
                                                expandedRecordingID = nil
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                .navigationTitle(track.title)
                .navigationBarTitleDisplayMode(.inline)
                .onAppear {
                    recorder.load(trackId: track.id)
                }
                .onChange(of: recorder.isRecording) { newValue in
                    showRecordingSheet = newValue
                }
                .onChange(of: recorder.lastErrorMessage) { message in
                    if let message {
                        recordingErrorMessage = message
                    }
                }
                .overlay(alignment: .bottom) {
                    if expandedRecordingID == nil {
                        Button {
                            AppHaptics.tap()
                            if recorder.isRecording {
                                recorder.stop()
                            } else {
                                recorder.start(trackId: track.id, trackTitle: track.title)
                            }
                        } label: {
                            ZStack {
                                Circle()
                                    .fill(.red)
                                    .frame(width: 64, height: 64)
                                Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                        }
                        .accessibilityLabel(recorder.isRecording ? Text("track.recording.stopNow") : Text("track.recording.startNow"))
                        .padding(.bottom, 18)
                    }
                }
                .sheet(isPresented: $showRecordingSheet) {
                    RecordingCaptureSheet(
                        title: track.title,
                        elapsed: recorder.liveDurationString,
                        isRecording: recorder.isRecording,
                        stopAction: {
                            AppHaptics.tap()
                            recorder.stop()
                            showRecordingSheet = false
                        }
                    )
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
                }
                .alert("track.recording.error.title", isPresented: Binding(
                    get: { recordingErrorMessage != nil },
                    set: { if !$0 { recordingErrorMessage = nil } }
                )) {
                    Button("common.close", role: .cancel) {
                        AppHaptics.tap()
                        recordingErrorMessage = nil
                    }
                } message: {
                    Text(recordingErrorMessage ?? "")
                }
                .sheet(isPresented: $showCompleteCelebration) {
                    TrackCompleteCongratsSheet {
                        showCompleteCelebration = false
                    }
                    .presentationDetents([.height(300)])
                    .presentationDragIndicator(.visible)
                }
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("common.close") {
                            AppHaptics.tap()
                            dismiss()
                        }
                    }
                }
            } else {
                Form {
                    Section {
                        Label("track.notFound", systemImage: "exclamationmark.triangle")
                    }
                }
                .navigationTitle("track.detail.title")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("common.close") {
                            AppHaptics.tap()
                            dismiss()
                        }
                    }
                }
            }
        }
    }

    private var currentTrack: PracticeTrack? {
        tracksStore.tracks.first(where: { $0.id == trackId })
    }

    private func statsSummary(track: PracticeTrack) -> String {
        let total = tracksStore.totalPracticeDays(trackId: track.id)
        let latest = tracksStore.latestPracticeDate(trackId: track.id)
            ?? String(localized: "track.stats.latest.none", bundle: .main)
        let format = String(localized: "track.stats.summary.format", bundle: .main)
        return String(format: format, locale: Locale.current, "\(total)", latest)
    }

    private func practiceDaysSince(track: PracticeTrack) -> Int {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        guard let added = formatter.date(from: track.addedDate) else { return 1 }
        let days = Calendar(identifier: .gregorian).dateComponents([.day], from: added, to: .now).day ?? 0
        return max(days + 1, 1)
    }

    private func practiceDaysText(track: PracticeTrack) -> String {
        let format = String(localized: "track.days.since.format", bundle: .main)
        return String(format: format, locale: Locale.current, "\(practiceDaysSince(track: track))")
    }

    private func triggerCompletionHaptic() {
        let notify = UINotificationFeedbackGenerator()
        let impact = UIImpactFeedbackGenerator(style: .medium)
        notify.prepare()
        impact.prepare()
        notify.notificationOccurred(.success)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            impact.impactOccurred(intensity: 0.85)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            impact.impactOccurred(intensity: 1.0)
        }
    }
}

private struct TrackCompleteCongratsSheet: View {
    let onClose: () -> Void
    @State private var symbolName = "apple.classical.pages"

    var body: some View {
        VStack(spacing: 16) {
            if #available(iOS 17.0, *) {
                Image(systemName: symbolName)
                    .font(.system(size: 54, weight: .regular))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.red, .orange, .yellow, .green, .blue, .purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .contentTransition(.symbolEffect(.replace))
                    .animation(.easeInOut(duration: 0.45), value: symbolName)
            } else {
                Image(systemName: "trophy")
                    .font(.system(size: 54, weight: .regular))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.red, .orange, .yellow, .green, .blue, .purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }

            Text("track.complete.congrats.title")
                .font(.headline)
            Text("track.complete.congrats.message")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button("common.close") {
                onClose()
            }
            .buttonStyle(.borderedProminent)
            .padding(.top, 4)
        }
        .padding(.horizontal, 24)
        .onAppear {
            guard #available(iOS 17.0, *) else { return }
            symbolName = "apple.classical.pages"
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                symbolName = "trophy"
            }
        }
    }
}

private struct TrackCalendarDetailView: View {
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @EnvironmentObject private var dateStore: SelectedDateStore

    let trackId: Int

    var body: some View {
        Form {
            Section {
                SystemPracticeCalendarView(
                    checkedDateKeys: tracksStore.checkedDateKeys(trackId: trackId),
                    onToggleDateKey: { dayKey in
                        AppHaptics.selectionChanged()
                        tracksStore.toggleCheck(dateKey: dayKey, trackId: trackId)
                        if let selected = dateFromDayKey(dayKey) {
                            dateStore.selectedDate = selected
                        }
                    }
                )
                .frame(maxWidth: .infinity, minHeight: 390)
                .clipped()
            }
        }
        .navigationTitle("track.calendar.detail")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func dateFromDayKey(_ key: String) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: key)
    }
}

private struct TrackPracticeHeatmapView: View {
    let checkedDateKeys: Set<String>

    private var days: [Date] {
        let calendar = Calendar(identifier: .gregorian)
        let dayCount = 224
        let start = calendar.date(byAdding: .day, value: -(dayCount - 1), to: .now) ?? .now
        return (0..<dayCount).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
    }

    private let formatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private func level(for date: Date) -> Int {
        _ = date
        // Practice-time data is not integrated yet in native; keep heatmap empty until linked.
        return 0
    }

    private func color(for level: Int) -> Color {
        switch level {
        case 0: return Color(uiColor: .tertiarySystemFill)
        case 1: return AppPalette.todayTheme.opacity(0.35)
        case 2: return AppPalette.todayTheme.opacity(0.55)
        case 3: return AppPalette.todayTheme.opacity(0.75)
        default: return AppPalette.todayTheme
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            let weekColumns = Int(ceil(Double(days.count) / 7.0))
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(0..<weekColumns, id: \.self) { week in
                        VStack(spacing: 4) {
                            ForEach(0..<7, id: \.self) { weekday in
                                let index = week * 7 + weekday
                                if index < days.count {
                                    let day = days[index]
                                    RoundedRectangle(cornerRadius: 2, style: .continuous)
                                        .fill(color(for: level(for: day)))
                                        .frame(width: 8, height: 8)
                                } else {
                                    Color.clear
                                        .frame(width: 8, height: 8)
                                }
                            }
                        }
                    }
                }
            }
            if checkedDateKeys.isEmpty {
                Text("track.recent.none")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("track.heatmap.pending")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack(spacing: 6) {
                    Text("track.heatmap.less")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    ForEach(0...4, id: \.self) { lv in
                        RoundedRectangle(cornerRadius: 2, style: .continuous)
                            .fill(color(for: lv))
                            .frame(width: 8, height: 8)
                    }
                    Text("track.heatmap.more")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

private struct RecordingCaptureSheet: View {
    let title: String
    let elapsed: String
    let isRecording: Bool
    let stopAction: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            Capsule()
                .fill(Color.secondary.opacity(0.3))
                .frame(width: 48, height: 5)
                .padding(.top, 8)

            Text(title)
                .font(.title3.weight(.semibold))

            Text(elapsed)
                .font(.system(.title2, design: .rounded).monospacedDigit())
                .foregroundStyle(.secondary)

            Spacer(minLength: 20)

            Button(action: stopAction) {
                Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 96, height: 96)
                    .background(isRecording ? Color.red : Color.secondary, in: Circle())
            }
            .padding(.bottom, 24)
        }
        .padding(.horizontal, 20)
    }
}

private struct InlineRecordingControls: View {
    let recording: TrackRecordingItem
    let isPlaying: Bool
    let progress: Double
    let elapsedText: String
    let remainText: String
    let playPauseAction: () -> Void
    let backAction: () -> Void
    let forwardAction: () -> Void
    let deleteAction: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            ProgressView(value: progress, total: 1.0)
                .tint(AppPalette.todayTheme)
            HStack {
                Text(elapsedText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(remainText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack(spacing: 26) {
                Button(action: backAction) {
                    Image(systemName: "gobackward.15")
                        .font(.title2)
                }
                Button(action: playPauseAction) {
                    Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                        .font(.title)
                }
                Button(action: forwardAction) {
                    Image(systemName: "goforward.15")
                        .font(.title2)
                }
                Button(role: .destructive, action: deleteAction) {
                    Image(systemName: "trash")
                        .font(.title3)
                }
            }
            .buttonStyle(.plain)
        }
        .padding(.top, 2)
    }
}

private struct TrackRecordingItem: Identifiable, Codable, Hashable {
    let id: UUID
    let title: String
    let fileName: String
    let createdAt: Date
    let duration: TimeInterval

    var dateString: String {
        createdAt.formatted(date: .numeric, time: .shortened)
    }

    var durationString: String {
        let min = Int(duration) / 60
        let sec = Int(duration) % 60
        return String(format: "%d:%02d", min, sec)
    }
}

@MainActor
private final class TrackRecorder: NSObject, ObservableObject, @preconcurrency AVAudioPlayerDelegate {
    @Published private(set) var recordings: [TrackRecordingItem] = []
    @Published private(set) var isRecording = false
    @Published private(set) var liveDuration: TimeInterval = 0
    @Published private(set) var playingRecordingID: UUID?
    @Published private(set) var playbackCurrentTime: TimeInterval = 0
    @Published private(set) var playbackDuration: TimeInterval = 0
    @Published private(set) var lastErrorMessage: String?

    private var trackId: Int?
    private var trackTitle: String = "track"
    private var recorder: AVAudioRecorder?
    private var player: AVAudioPlayer?
    private var recordingStartDate: Date?
    private var recordTimer: Timer?
    private var playTimer: Timer?

    func load(trackId: Int) {
        self.trackId = trackId
        self.recordings = loadRecordings(for: trackId)
    }

    func start(trackId: Int, trackTitle: String) {
        if self.trackId != trackId {
            load(trackId: trackId)
        }
        self.trackTitle = sanitizeForFile(trackTitle)
        let session = AVAudioSession.sharedInstance()
        session.requestRecordPermission { [weak self] granted in
            guard let self else { return }
            guard granted else {
                Task { @MainActor in
                    self.lastErrorMessage = String(localized: "track.recording.error.permission", bundle: .main)
                }
                return
            }
            Task { @MainActor in
                do {
                    try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
                    try session.setActive(true)
                    self.beginRecording()
                } catch {
                    print("Audio session error: \(error)")
                    self.lastErrorMessage = String(localized: "track.recording.error.session", bundle: .main)
                }
            }
        }
    }

    private func beginRecording() {
        guard trackId != nil else { return }
        let timestamp = timestampForFile(Date())
        let fileName = "\(trackTitle)_\(timestamp).m4a"
        let url = recordingsDirectory().appendingPathComponent(fileName)
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        do {
            recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder?.record()
            recordingStartDate = Date()
            isRecording = true
            liveDuration = 0
            startRecordTimer()
        } catch {
            print("Start recording error: \(error)")
        }
    }

    func stop() {
        guard let recorder, let trackId else { return }
        recorder.stop()
        isRecording = false
        stopRecordTimer()
        let duration = max(recorder.currentTime, Date().timeIntervalSince(recordingStartDate ?? Date()))
        let createdAt = Date()
        let item = TrackRecordingItem(
            id: UUID(),
            title: "\(trackTitle)_\(timestampForFile(createdAt))",
            fileName: recorder.url.lastPathComponent,
            createdAt: createdAt,
            duration: duration
        )
        recordings.insert(item, at: 0)
        save(recordings: recordings, for: trackId)
        self.recorder = nil
    }

    func togglePlay(recording: TrackRecordingItem) {
        if playingRecordingID == recording.id {
            stopPlayback()
            return
        }
        play(recording: recording)
    }

    private func play(recording: TrackRecordingItem) {
        let url = recordingsDirectory().appendingPathComponent(recording.fileName)
        do {
            stopPlayback()
            player = try AVAudioPlayer(contentsOf: url)
            player?.delegate = self
            player?.play()
            playingRecordingID = recording.id
            playbackDuration = player?.duration ?? recording.duration
            playbackCurrentTime = player?.currentTime ?? 0
            startPlayTimer()
        } catch {
            print("Play error: \(error)")
        }
    }

    func skip(recording: TrackRecordingItem, by seconds: TimeInterval) {
        if playingRecordingID != recording.id || player == nil {
            play(recording: recording)
        }
        guard let player else { return }
        let next = max(0, min(player.duration, player.currentTime + seconds))
        player.currentTime = next
        playbackCurrentTime = next
    }

    func delete(at offsets: IndexSet) {
        guard let trackId else { return }
        let removing = offsets.map { recordings[$0] }
        for item in removing {
            let url = recordingsDirectory().appendingPathComponent(item.fileName)
            try? FileManager.default.removeItem(at: url)
        }
        recordings.remove(atOffsets: offsets)
        save(recordings: recordings, for: trackId)
    }

    func delete(item: TrackRecordingItem) {
        guard let index = recordings.firstIndex(of: item) else { return }
        delete(at: IndexSet(integer: index))
    }

    var liveDurationString: String {
        let min = Int(liveDuration) / 60
        let sec = Int(liveDuration) % 60
        let cs = Int((liveDuration * 100).truncatingRemainder(dividingBy: 100))
        return String(format: "%02d:%02d.%02d", min, sec, cs)
    }

    func progress(for recording: TrackRecordingItem) -> Double {
        if playingRecordingID == recording.id, playbackDuration > 0 {
            return min(1, max(0, playbackCurrentTime / playbackDuration))
        }
        return 0
    }

    func elapsedText(for recording: TrackRecordingItem) -> String {
        if playingRecordingID == recording.id {
            return formatTime(playbackCurrentTime)
        }
        return "0:00"
    }

    func remainingText(for recording: TrackRecordingItem) -> String {
        if playingRecordingID == recording.id {
            return "-\(formatTime(max(0, playbackDuration - playbackCurrentTime)))"
        }
        return "-\(recording.durationString)"
    }

    private func recordingsDirectory() -> URL {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("track_recordings", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    private func save(recordings: [TrackRecordingItem], for trackId: Int) {
        let key = "trackRecordings_\(trackId)"
        if let data = try? JSONEncoder().encode(recordings) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func loadRecordings(for trackId: Int) -> [TrackRecordingItem] {
        let key = "trackRecordings_\(trackId)"
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([TrackRecordingItem].self, from: data) else {
            return []
        }
        return decoded
    }

    private func startRecordTimer() {
        stopRecordTimer()
        recordTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                guard self.isRecording else { return }
                self.liveDuration = Date().timeIntervalSince(self.recordingStartDate ?? Date())
            }
        }
    }

    private func stopRecordTimer() {
        recordTimer?.invalidate()
        recordTimer = nil
    }

    private func startPlayTimer() {
        stopPlayTimer()
        playTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                if let player = self.player {
                    self.playbackCurrentTime = player.currentTime
                    self.playbackDuration = player.duration
                }
                if self.player?.isPlaying != true {
                    self.stopPlayback()
                }
            }
        }
    }

    private func stopPlayTimer() {
        playTimer?.invalidate()
        playTimer = nil
    }

    private func stopPlayback() {
        player?.stop()
        player = nil
        playingRecordingID = nil
        playbackCurrentTime = 0
        playbackDuration = 0
        stopPlayTimer()
    }

    private func formatTime(_ value: TimeInterval) -> String {
        let total = Int(value.rounded(.down))
        let min = total / 60
        let sec = total % 60
        return String(format: "%d:%02d", min, sec)
    }

    private func timestampForFile(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd_HH-mm"
        return formatter.string(from: date)
    }

    private func sanitizeForFile(_ text: String) -> String {
        let invalid = CharacterSet(charactersIn: "\\/:*?\"<>|")
        let sanitized = text.components(separatedBy: invalid).joined(separator: " ")
        return sanitized.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        stopPlayback()
    }
}

#Preview {
    TrackDetailView(trackId: 1)
        .environmentObject(PracticeTracksStore())
}
