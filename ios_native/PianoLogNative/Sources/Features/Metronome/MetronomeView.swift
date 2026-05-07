import SwiftUI
import UIKit

struct MetronomeView: View {
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @StateObject private var viewModel = MetronomeViewModel()

    @State private var tapTempoMessage: String?
    @State private var showSignatureSheet = false
    @State private var showSubdivisionSheet = false
    @State private var showTrainingModeDialog = false
    @State private var showTrainingSettingSheet = false
    @State private var selectedTrainingMode: RhythmTrainingMode = .none
    @State private var showSoundSheet = false
    @State private var showLibrarySheet = false
    @State private var showSessionSaveSheet = false
    @State private var pendingOpenLibraryAfterSave = false
    @State private var sessionSaveName = ""

    var body: some View {
        NavigationStack {
            GeometryReader { geo in
                let safeWidth = max(1, geo.size.width)
                let beatWidth = max(1, min(safeWidth - 2, 760))
                let controlsWidth = max(1, min(safeWidth - 32, 620))
                let beatDuration = (60.0 / Double(max(1, viewModel.store.bpm)))
                    * (4.0 / Double(max(1, viewModel.store.timeSignature.denominator)))

                // TWA absolute-top references (from Metronome.tsx):
                // beat 80, controls 180, info 280, dial 350, tap around dial's lower-right.
                let beatTop: CGFloat = 30
                let controlsTop: CGFloat = 130
                let infoTop: CGFloat = 230
                let trainingTop: CGFloat = 252
                let dialTop: CGFloat = 290
                let tapX: CGFloat = safeWidth * 0.70
                let tapY: CGFloat = dialTop + 250 + 52

                ZStack(alignment: .top) {
                    AppPalette.metronomeTheme
                        .opacity(viewModel.flashPulseOpacity)
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                        .animation(.easeOut(duration: 0.12), value: viewModel.flashPulseOpacity)

                    BeatVisualizerView(
                        beatPattern: viewModel.store.beatPattern,
                        activeBeat: viewModel.store.currentBeat,
                        beatTick: viewModel.store.beatTick,
                        beatDuration: beatDuration,
                        onTapBeat: { idx in
                            viewModel.cycleBeatStrength(at: idx)
                        }
                    )
                    .frame(maxWidth: beatWidth)
                    .padding(.top, beatTop)
                    .frame(maxWidth: .infinity, alignment: .center)

                    MetronomeControlRowView(
                        signatureText: "\(viewModel.store.timeSignature.numerator)/\(viewModel.store.timeSignature.denominator)",
                        denominator: viewModel.store.timeSignature.denominator,
                        subdivision: viewModel.store.subdivision,
                        onTapSignature: {
                            closeAllPanels()
                            showSignatureSheet = true
                        },
                        onTapSubdivision: {
                            closeAllPanels()
                            showSubdivisionSheet = true
                        },
                        onTapTraining: {
                            closeAllPanels()
                            showTrainingModeDialog = true
                        }
                    )
                    .frame(width: controlsWidth)
                    .padding(.top, controlsTop)
                    .frame(maxWidth: .infinity, alignment: .center)

                    Text(tapTempoMessage ?? viewModel.activeSession.title)
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .padding(.top, infoTop)
                        .frame(maxWidth: .infinity, alignment: .center)

                    if let training = viewModel.trainingStatusText, !training.isEmpty {
                        Text(training)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(AppPalette.metronomeTheme)
                            .padding(.top, trainingTop)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }

                    BPMDialView(
                        bpm: viewModel.store.bpm,
                        isPlaying: viewModel.store.isPlaying,
                        minBPM: 20,
                        maxBPM: 400,
                        onMinus: {
                            viewModel.store.decrementBpm()
                            viewModel.onConfigChanged()
                        },
                        onPlus: {
                            viewModel.store.incrementBpm()
                            viewModel.onConfigChanged()
                        },
                        onPlayPause: {
                            AppHaptics.tap()
                            viewModel.togglePlay()
                        },
                        onBPMSet: { bpm in
                            viewModel.store.setBpm(bpm)
                            viewModel.onConfigChanged()
                        }
                    )
                    .padding(.top, dialTop)
                    .frame(maxWidth: .infinity, alignment: .center)

                    Button {
                        AppHaptics.tap()

                        let message = viewModel.tapTempo()
                        if message.isEmpty {
                            tapTempoMessage = nil
                        } else {
                            tapTempoMessage = message
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                tapTempoMessage = nil
                            }
                        }
                    } label: {
                        tapTempoIcon
                    }
                    .buttonStyle(TapTempoButtonStyle())
                    .contentShape(Circle())
                    .accessibilityLabel("Tap Tempo")
                    .position(x: tapX, y: tapY)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .tint(.primary)
            .navigationTitle("메트로놈")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        AppHaptics.tap()
                        handleLibraryTap()
                    } label: {
                        Image(systemName: "list.bullet")
                            .foregroundStyle(.primary)
                    }
                    .buttonStyle(.plain)
                    .hoverEffect(.lift)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        AppHaptics.tap()
                        closeAllPanels()
                        showSoundSheet = true
                    } label: {
                        Image(systemName: "ellipsis")
                            .foregroundStyle(.primary)
                    }
                    .buttonStyle(.plain)
                    .hoverEffect(.lift)
                }
            }
            .sheet(isPresented: $showSignatureSheet) {
                TimeSignatureSheet(
                    current: viewModel.store.timeSignature,
                    onSelect: { signature in
                        viewModel.setTimeSignature(signature)
                    }
                )
            }
            .sheet(isPresented: $showSubdivisionSheet) {
                SubdivisionSheet(
                    current: viewModel.store.subdivision,
                    denominator: viewModel.store.timeSignature.denominator,
                    onSelect: { value in
                        viewModel.setSubdivision(value)
                    }
                )
            }
            .alert("", isPresented: $showTrainingModeDialog) {
                Button("연습 길이 설정") {
                    AppHaptics.tap()
                    selectedTrainingMode = .phraseLength
                    showTrainingSettingSheet = true
                }
                Button("증분 템포 변경") {
                    AppHaptics.tap()
                    selectedTrainingMode = .progressiveTempo
                    showTrainingSettingSheet = true
                }
                Button("음소거 구간 설정") {
                    AppHaptics.tap()
                    selectedTrainingMode = .mutePattern
                    showTrainingSettingSheet = true
                }
                Button("트레이닝 모드 비활성화") {
                    AppHaptics.tap()
                    viewModel.setTrainingMode(.none)
                }
                Button("취소", role: .cancel) {}
            }
            .sheet(isPresented: $showTrainingSettingSheet) {
                TrainingSettingSheet(
                    mode: selectedTrainingMode,
                    songLength: viewModel.store.songLength,
                    incrementalTempo: viewModel.store.incrementalTempo,
                    mutePattern: viewModel.store.mutePattern,
                    currentBPM: viewModel.store.bpm,
                    onApply: { mode, songLength, incrementalTempo, mutePattern in
                        viewModel.store.songLength = songLength
                        viewModel.store.incrementalTempo = incrementalTempo
                        viewModel.store.mutePattern = mutePattern
                        viewModel.setTrainingMode(mode)
                    }
                )
            }
            .sheet(isPresented: $showSoundSheet) {
                SoundSettingsSheet(
                    preset: viewModel.store.soundPreset,
                    soundEnabled: viewModel.store.soundEnabled,
                    volume: viewModel.store.soundVolume,
                    accentGain: viewModel.store.accentGain,
                    flashEnabled: viewModel.store.flashEnabled,
                    onApply: { preset, soundEnabled, volume, accentGain, flashEnabled in
                        viewModel.store.soundPreset = preset
                        viewModel.store.soundEnabled = soundEnabled
                        viewModel.store.soundVolume = volume
                        viewModel.store.accentGain = accentGain
                        viewModel.store.flashEnabled = flashEnabled
                        viewModel.onConfigChanged()
                    }
                )
            }
            .sheet(isPresented: $showLibrarySheet) {
                SessionLibrarySheet(
                    items: viewModel.libraryItems,
                    onLoad: { item in
                        viewModel.applyLibraryItem(item)
                    },
                    onDelete: { item in
                        viewModel.deleteLibraryItem(item)
                    }
                )
            }
            .sheet(isPresented: $showSessionSaveSheet) {
                SessionSaveSheet(
                    initialName: sessionSaveName,
                    onSkip: {
                        showSessionSaveSheet = false
                        if pendingOpenLibraryAfterSave {
                            showLibrarySheet = true
                        }
                        pendingOpenLibraryAfterSave = false
                    },
                    onSave: { name in
                        viewModel.saveSession(name: name)
                        showSessionSaveSheet = false
                        if pendingOpenLibraryAfterSave {
                            showLibrarySheet = true
                        }
                        pendingOpenLibraryAfterSave = false
                    }
                )
            }
            .onAppear {
                viewModel.syncTodayTracks(tracksStore.tracks(for: .now))
            }
            .onChange(of: tracksStore.tracks) { _ in
                viewModel.syncTodayTracks(tracksStore.tracks(for: .now))
            }
            .onDisappear {
                if viewModel.store.isPlaying {
                    viewModel.togglePlay()
                }
            }
        }
    }

    private func handleLibraryTap() {
        closeAllPanels()
        if viewModel.hasUnsavedSessionChange {
            sessionSaveName = viewModel.activeSession.title == "Practice Session" ? "" : viewModel.activeSession.title
            pendingOpenLibraryAfterSave = true
            showSessionSaveSheet = true
            return
        }
        showLibrarySheet.toggle()
    }

    private var tapTempoIcon: some View {
        Image(systemName: "hand.tap")
            .font(.system(size: 30, weight: .regular))
            .symbolRenderingMode(.palette)
            .foregroundStyle(.primary, AppPalette.metronomeTheme)
    }

    private func closeAllPanels() {
        showSignatureSheet = false
        showSubdivisionSheet = false
        showTrainingModeDialog = false
        showTrainingSettingSheet = false
        showSoundSheet = false
        showLibrarySheet = false
        showSessionSaveSheet = false
    }
}

private struct TapTempoButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(14)
            .background(.regularMaterial, in: Circle())
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
            .hoverEffect(.lift)
    }
}

private struct SessionLibrarySheet: View {
    let items: [MetronomeViewModel.LibraryItem]
    let onLoad: (MetronomeViewModel.LibraryItem) -> Void
    let onDelete: (MetronomeViewModel.LibraryItem) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("투데이 (현재 연습목록)") {
                    if items.isEmpty {
                        Text("저장된 세션이 없습니다")
                            .foregroundStyle(.secondary)
                    } else {
                        let todayItems = items.filter { $0.source == .today }
                        if todayItems.isEmpty {
                            Text("표시할 항목이 없습니다")
                                .foregroundStyle(.secondary)
                        } else {
                            ForEach(todayItems) { item in
                                itemRow(item)
                            }
                        }
                    }
                }

                Section("저장된 세션") {
                    let savedItems = items.filter { $0.source == .saved }
                    if savedItems.isEmpty {
                        Text("저장된 세션이 없습니다")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(savedItems) { item in
                            itemRow(item)
                        }
                    }
                }
            }
            .navigationTitle("세션 라이브러리")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") {
                        AppHaptics.tap()
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private func itemRow(_ item: MetronomeViewModel.LibraryItem) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.body.weight(.semibold))
                Text("\(item.bpm.map(String.init) ?? "미설정") BPM • \(item.numerator.map(String.init) ?? "미설정")/\(item.denominator.map(String.init) ?? "미설정")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button("불러오기") {
                AppHaptics.tap()
                onLoad(item)
                dismiss()
            }
            .buttonStyle(.bordered)
        }
        .swipeActions {
            Button(role: .destructive) {
                AppHaptics.tap()
                onDelete(item)
            } label: {
                Text("삭제")
            }
        }
    }
}

private struct SessionSaveSheet: View {
    @State var name: String
    let onSkip: () -> Void
    let onSave: (String?) -> Void

    init(initialName: String, onSkip: @escaping () -> Void, onSave: @escaping (String?) -> Void) {
        _name = State(initialValue: initialName)
        self.onSkip = onSkip
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                TextField("세션 이름", text: $name)
            }
            .navigationTitle("세션 저장")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("건너뛰기") {
                        AppHaptics.tap()
                        onSkip()
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") {
                        AppHaptics.tap()
                        onSave(name)
                    }
                }
            }
        }
        .presentationDetents([.fraction(0.32)])
    }
}

private struct SoundSettingsSheet: View {
    let preset: MetronomeSoundPreset
    let soundEnabled: Bool
    let volume: Double
    let accentGain: Double
    let flashEnabled: Bool
    let onApply: (MetronomeSoundPreset, Bool, Double, Double, Bool) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selectedPreset: MetronomeSoundPreset
    @State private var selectedSoundEnabled: Bool
    @State private var selectedVolume: Double
    @State private var selectedAccentGain: Double
    @State private var selectedFlashEnabled: Bool

    init(
        preset: MetronomeSoundPreset,
        soundEnabled: Bool,
        volume: Double,
        accentGain: Double,
        flashEnabled: Bool,
        onApply: @escaping (MetronomeSoundPreset, Bool, Double, Double, Bool) -> Void
    ) {
        self.preset = preset
        self.soundEnabled = soundEnabled
        self.volume = volume
        self.accentGain = accentGain
        self.flashEnabled = flashEnabled
        self.onApply = onApply
        _selectedPreset = State(initialValue: preset)
        _selectedSoundEnabled = State(initialValue: soundEnabled)
        _selectedVolume = State(initialValue: volume)
        _selectedAccentGain = State(initialValue: accentGain)
        _selectedFlashEnabled = State(initialValue: flashEnabled)
    }

    var body: some View {
        NavigationStack {
            List {
                Section("사운드") {
                    Toggle("사운드 켜기", isOn: $selectedSoundEnabled)
                }

                Section("사운드 프리셋") {
                    ForEach(MetronomeSoundPreset.allCases) { item in
                        Button {
                            AppHaptics.selectionChanged()
                            selectedPreset = item
                        } label: {
                            HStack {
                                Text(item.title)
                                Spacer()
                                if selectedPreset == item {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                        .foregroundStyle(.primary)
                    }
                }

                Section("볼륨") {
                    HStack {
                        Image(systemName: "speaker.fill")
                        Slider(value: $selectedVolume, in: 0...1, step: 0.01)
                        Text("\(Int(selectedVolume * 100))%")
                            .monospacedDigit()
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("악센트 볼륨") {
                    HStack {
                        Text("1.0x")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Slider(value: $selectedAccentGain, in: 1...2, step: 0.1)
                        Text("\(selectedAccentGain, specifier: "%.1f")x")
                            .monospacedDigit()
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("시각 효과") {
                    Toggle("전체화면 플래시", isOn: $selectedFlashEnabled)
                }
            }
            .navigationTitle("사운드 설정")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("적용") {
                        AppHaptics.tap()
                        onApply(
                            selectedPreset,
                            selectedSoundEnabled,
                            selectedVolume,
                            selectedAccentGain,
                            selectedFlashEnabled
                        )
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

private struct TimeSignatureSheet: View {
    let current: TimeSignature
    let onSelect: (TimeSignature) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var numerator: Int
    @State private var denominator: Int

    init(current: TimeSignature, onSelect: @escaping (TimeSignature) -> Void) {
        self.current = current
        self.onSelect = onSelect
        _numerator = State(initialValue: current.numerator)
        _denominator = State(initialValue: current.denominator)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                HStack(spacing: 12) {
                    Picker("분자", selection: $numerator) {
                        ForEach(1...16, id: \.self) { value in
                            Text("\(value)").tag(value)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(maxWidth: .infinity, maxHeight: 190)

                    Text("/")
                        .font(.system(size: 28, weight: .semibold, design: .rounded))
                        .foregroundStyle(.primary)

                    Picker("분모", selection: $denominator) {
                        ForEach([1, 2, 4, 8], id: \.self) { value in
                            Text("\(value)").tag(value)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(maxWidth: .infinity, maxHeight: 190)
                }
                .font(.system(size: 21, weight: .semibold, design: .rounded))

                Button("확인") {
                    AppHaptics.tap()
                    onSelect(.init(numerator: numerator, denominator: denominator))
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
        }
        .presentationDetents([.fraction(0.42), .medium])
    }
}

private struct SubdivisionSheet: View {
    let current: RhythmSubdivision
    let denominator: Int
    let onSelect: (RhythmSubdivision) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var selected: RhythmSubdivision

    init(current: RhythmSubdivision, denominator: Int, onSelect: @escaping (RhythmSubdivision) -> Void) {
        self.current = current
        self.denominator = denominator
        self.onSelect = onSelect
        _selected = State(initialValue: current)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                SubdivisionWheelPicker(
                    items: RhythmSubdivision.allPatterns,
                    selected: $selected,
                    denominator: denominator
                )
                .frame(maxWidth: .infinity, minHeight: 320, maxHeight: 320)

                Button("확인") {
                    AppHaptics.tap()
                    onSelect(selected)
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
        }
        .presentationDetents([.fraction(0.62), .large])
    }

}

private struct SubdivisionWheelPicker: UIViewRepresentable {
    let items: [RhythmSubdivision]
    @Binding var selected: RhythmSubdivision
    let denominator: Int

    func makeUIView(context: Context) -> UIPickerView {
        let picker = UIPickerView()
        picker.delegate = context.coordinator
        picker.dataSource = context.coordinator
        picker.translatesAutoresizingMaskIntoConstraints = false
        if let idx = items.firstIndex(of: selected) {
            picker.selectRow(idx, inComponent: 0, animated: false)
        }
        return picker
    }

    func updateUIView(_ uiView: UIPickerView, context: Context) {
        context.coordinator.parent = self
        if let idx = items.firstIndex(of: selected), uiView.selectedRow(inComponent: 0) != idx {
            uiView.selectRow(idx, inComponent: 0, animated: true)
        }
        uiView.reloadAllComponents()
    }

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    final class Coordinator: NSObject, UIPickerViewDataSource, UIPickerViewDelegate {
        var parent: SubdivisionWheelPicker
        init(parent: SubdivisionWheelPicker) { self.parent = parent }

        func numberOfComponents(in pickerView: UIPickerView) -> Int { 1 }
        func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
            parent.items.count
        }

        func pickerView(_ pickerView: UIPickerView, rowHeightForComponent component: Int) -> CGFloat {
            96
        }

        func pickerView(_ pickerView: UIPickerView, widthForComponent component: Int) -> CGFloat {
            pickerView.bounds.width
        }

        func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
            guard parent.items.indices.contains(row) else { return }
            AppHaptics.selectionChanged()
            parent.selected = parent.items[row]
        }

        func pickerView(_ pickerView: UIPickerView, viewForRow row: Int, forComponent component: Int, reusing view: UIView?) -> UIView {
            let container = UIView(frame: CGRect(x: 0, y: 0, width: pickerView.bounds.width, height: 96))
            container.backgroundColor = .clear

            guard parent.items.indices.contains(row) else { return container }
            let item = parent.items[row]
            let key = "\(item.id)_d\(parent.denominator)"
            if let image = SubdivisionNotationAssetLibrary.image(for: key) {
                let size = SubdivisionNotationAssetLibrary.displaySize(
                    for: image,
                    subdivisionID: item.id,
                    targetHeight: MetronomeSubdivisionNotationView.commonTargetHeight,
                    minWidth: MetronomeSubdivisionNotationView.commonMinWidth,
                    maxWidth: MetronomeSubdivisionNotationView.commonMaxWidth
                )

                let imageView = UIImageView(image: image)
                imageView.translatesAutoresizingMaskIntoConstraints = false
                imageView.contentMode = .scaleAspectFit
                imageView.tintColor = .label
                container.addSubview(imageView)

                NSLayoutConstraint.activate([
                    imageView.centerXAnchor.constraint(equalTo: container.centerXAnchor),
                    imageView.centerYAnchor.constraint(equalTo: container.centerYAnchor),
                    imageView.widthAnchor.constraint(equalToConstant: size.width),
                    imageView.heightAnchor.constraint(equalToConstant: size.height)
                ])
            } else {
                let label = UILabel()
                label.translatesAutoresizingMaskIntoConstraints = false
                label.text = item.title
                label.textAlignment = .center
                label.font = .systemFont(ofSize: 13, weight: .semibold)
                label.textColor = .secondaryLabel
                container.addSubview(label)

                NSLayoutConstraint.activate([
                    label.centerXAnchor.constraint(equalTo: container.centerXAnchor),
                    label.centerYAnchor.constraint(equalTo: container.centerYAnchor)
                ])
            }

            return container
        }
    }
}

private struct TrainingSettingSheet: View {
    let mode: RhythmTrainingMode
    let songLength: SongLengthTrainingSettings
    let incrementalTempo: IncrementalTempoTrainingSettings
    let mutePattern: MutePatternTrainingSettings
    let currentBPM: Int
    let onApply: (RhythmTrainingMode, SongLengthTrainingSettings, IncrementalTempoTrainingSettings, MutePatternTrainingSettings) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var songLengthValue: SongLengthTrainingSettings
    @State private var incrementalTempoValue: IncrementalTempoTrainingSettings
    @State private var mutePatternValue: MutePatternTrainingSettings

    init(
        mode: RhythmTrainingMode,
        songLength: SongLengthTrainingSettings,
        incrementalTempo: IncrementalTempoTrainingSettings,
        mutePattern: MutePatternTrainingSettings,
        currentBPM: Int,
        onApply: @escaping (RhythmTrainingMode, SongLengthTrainingSettings, IncrementalTempoTrainingSettings, MutePatternTrainingSettings) -> Void
    ) {
        self.mode = mode
        self.songLength = songLength
        self.incrementalTempo = incrementalTempo
        self.mutePattern = mutePattern
        self.currentBPM = currentBPM
        self.onApply = onApply
        _songLengthValue = State(initialValue: songLength)
        _incrementalTempoValue = State(initialValue: incrementalTempo)
        _mutePatternValue = State(initialValue: mutePattern)
    }

    var body: some View {
        NavigationStack {
            List {
                if mode == .phraseLength {
                    PhraseLengthSettingsSection(settings: $songLengthValue)
                }

                if mode == .progressiveTempo {
                    ProgressiveTempoSettingsSection(
                        settings: $incrementalTempoValue,
                        currentBPM: currentBPM
                    )
                }

                if mode == .mutePattern {
                    MutePatternSettingsSection(settings: $mutePatternValue)
                }
            }
            .navigationTitle("리듬 설정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("확인") {
                        AppHaptics.tap()
                        onApply(mode, songLengthValue, incrementalTempoValue, mutePatternValue)
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

private struct PhraseLengthSettingsSection: View {
    @Binding var settings: SongLengthTrainingSettings

    var body: some View {
        Section("연습 길이 설정") {
            Picker("기준", selection: $settings.basis) {
                ForEach(TrainingBasis.allCases) { basis in
                    Text(basis.title).tag(basis)
                }
            }
            .pickerStyle(.segmented)

            if settings.basis == .bars {
                Picker("마디 수", selection: $settings.bars) {
                    ForEach(1...100, id: \.self) { Text("\($0)") }
                }
            }
            if settings.basis == .duration {
                let minute = settings.durationSeconds / 60
                let second = settings.durationSeconds % 60
                HStack {
                    Picker("", selection: Binding(
                        get: { minute },
                        set: { settings.durationSeconds = ($0 * 60) + second }
                    )) {
                        ForEach(0...99, id: \.self) { Text("\($0)") }
                    }
                    .labelsHidden()
                    Picker("", selection: Binding(
                        get: { second },
                        set: { settings.durationSeconds = (minute * 60) + $0 }
                    )) {
                        ForEach(0...59, id: \.self) { Text("\($0)") }
                    }
                    .labelsHidden()
                }
            }
        }
    }
}

private struct ProgressiveTempoSettingsSection: View {
    @Binding var settings: IncrementalTempoTrainingSettings
    let currentBPM: Int

    var body: some View {
        Section("증분 템포 변경") {
            Picker("기준", selection: $settings.basis) {
                ForEach(TrainingBasis.allCases) { basis in
                    Text(basis.title).tag(basis)
                }
            }
            .pickerStyle(.segmented)

            if settings.basis == .bars {
                Stepper("증가량: \(settings.barsStep >= 0 ? "+" : "")\(settings.barsStep) BPM", value: $settings.barsStep, in: -40...40)
                Stepper("증가 주기: \(settings.barsInterval) 마디", value: $settings.barsInterval, in: 1...99)
                Stepper("한계 BPM: \(settings.barsLimit)", value: $settings.barsLimit, in: 20...max(currentBPM * 2, 400))
            }

            if settings.basis == .duration {
                Stepper("증가량: \(settings.durationStep >= 0 ? "+" : "")\(settings.durationStep) BPM", value: $settings.durationStep, in: -40...40)
                Stepper("증가 주기: \(settings.durationInterval) 초", value: $settings.durationInterval, in: 5...200, step: 5)
                Stepper("한계 BPM: \(settings.durationLimit)", value: $settings.durationLimit, in: 20...max(currentBPM * 2, 400))
            }
        }
    }
}

private struct MutePatternSettingsSection: View {
    @Binding var settings: MutePatternTrainingSettings

    var body: some View {
        Section("음소거 구간 설정") {
            Picker("기준", selection: $settings.basis) {
                ForEach(TrainingBasis.allCases) { basis in
                    Text(basis.title).tag(basis)
                }
            }
            .pickerStyle(.segmented)

            if settings.basis == .bars {
                Stepper("소리 구간: \(settings.barsSoundLength) 마디", value: $settings.barsSoundLength, in: 1...99)
                Stepper("무음 구간: \(settings.barsMuteLength) 마디", value: $settings.barsMuteLength, in: 1...99)
            }

            if settings.basis == .duration {
                Stepper("소리 구간: \(settings.durationSoundLength) 초", value: $settings.durationSoundLength, in: 1...99)
                Stepper("무음 구간: \(settings.durationMuteLength) 초", value: $settings.durationMuteLength, in: 1...99)
            }
        }
    }
}
