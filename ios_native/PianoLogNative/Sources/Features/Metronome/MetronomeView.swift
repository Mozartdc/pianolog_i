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
                let layout = MetronomeUIConfig.layoutMetrics(for: geo.size)
                let beatWidth = max(1, min(safeWidth - (layout.contentHorizontalInset * 2), 760))
                let controlsWidth = max(1, min(safeWidth - (layout.contentHorizontalInset * 2), 620))

                ZStack {
                    MetronomeBeatFlashOverlay(beatState: viewModel.beatState)

                    VStack(spacing: 0) {
                        Spacer()
                            .frame(height: layout.topPadding)

                        MetronomeBeatRow(
                            beatState: viewModel.beatState,
                            beatPattern: viewModel.store.beatPattern,
                            onTapBeat: { idx in
                                viewModel.cycleBeatStrength(at: idx)
                            }
                        )
                        .frame(maxWidth: beatWidth)
                        .frame(height: layout.beatRowHeight)
                        .frame(maxWidth: .infinity, alignment: .center)

                        Spacer()
                            .frame(height: layout.beatToControlSpacing)

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
                                if viewModel.store.trainingMode != .none {
                                    AppHaptics.tap()
                                    viewModel.setTrainingMode(.none)
                                } else {
                                    showTrainingModeDialog = true
                                }
                            }
                        )
                        .frame(width: controlsWidth)
                        .frame(maxWidth: .infinity, alignment: .center)

                        Spacer()
                            .frame(height: layout.controlToInfoSpacing)

                        Text(tapTempoMessage ?? viewModel.activeSession.title)
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                            .frame(maxWidth: .infinity, alignment: .center)

                        if let training = viewModel.trainingStatusText, !training.isEmpty {
                            Text(training)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(AppPalette.metronomeTheme)
                                .padding(.top, layout.trainingTextOffset)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }

                        Spacer()
                            .frame(height: layout.infoToDialSpacing)

                        ZStack(alignment: .bottomTrailing) {
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
                            .accessibilityLabel("metronome.taptempo.accessibility")
                            .offset(x: -layout.tapTrailingInset, y: layout.tapBottomInset)
                        }
                        .frame(width: layout.dialContainerWidth, height: layout.dialContainerHeight)
                        .frame(maxWidth: .infinity, alignment: .center)

                        Spacer(minLength: 0)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .tint(.primary)
            .navigationTitle("metronome.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        AppHaptics.tap()
                        handleLibraryTap()
                    } label: {
                        Image(systemName: "list.bullet")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        AppHaptics.tap()
                        presentSoundSheet()
                    } label: {
                        Image(systemName: "ellipsis")
                    }
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
                Button("metronome.training.mode.phrase") {
                    presentTrainingSettings(for: .phraseLength)
                }
                Button("metronome.training.mode.progressive") {
                    presentTrainingSettings(for: .progressiveTempo)
                }
                Button("metronome.training.mode.mute") {
                    presentTrainingSettings(for: .mutePattern)
                }
                Button("common.cancel", role: .cancel) {}
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
                        // 시트에서 토글을 OFF한 경우(basis == .off) 트레이닝 모드를 비활성화
                        let disabled: Bool
                        switch mode {
                        case .phraseLength:     disabled = songLength.basis == .off
                        case .progressiveTempo: disabled = incrementalTempo.basis == .off
                        case .mutePattern:      disabled = mutePattern.basis == .off
                        case .none:             disabled = true
                        }
                        viewModel.setTrainingMode(disabled ? .none : mode)
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
                viewModel.onViewAppear()
            }
            .onDisappear {
                viewModel.onViewDisappear()
            }
            .onChangeSafe(of: tracksStore.tracks) { _ in
                viewModel.syncTodayTracks(tracksStore.tracks(for: .now))
            }
        }
    }

    private func handleLibraryTap() {
        if viewModel.hasUnsavedSessionChange {
            let defaultTitle = String(localized: "metronome.session.defaultTitle")
            sessionSaveName = viewModel.activeSession.title == defaultTitle ? "" : viewModel.activeSession.title
            pendingOpenLibraryAfterSave = true
            presentSessionSaveSheet()
            return
        }
        presentLibrarySheet()
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

    private func presentPanel(_ present: @escaping () -> Void) {
        let hadOpenPanel =
            showSignatureSheet ||
            showSubdivisionSheet ||
            showTrainingSettingSheet ||
            showSoundSheet ||
            showLibrarySheet ||
            showSessionSaveSheet
        closeAllPanels()
        // If another panel was open, wait for dismissal animation completion.
        // This removes the "first tap ignored" race during sheet-to-sheet transitions.
        if hadOpenPanel {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.28) {
                present()
            }
        } else {
            present()
        }
    }

    private func presentLibrarySheet() {
        presentPanel { showLibrarySheet = true }
    }

    private func presentTrainingSettings(for mode: RhythmTrainingMode) {
        AppHaptics.tap()
        selectedTrainingMode = mode
        // Alert dismissal and sheet presentation in the same update cycle
        // can create AttributeGraph cycles under load; defer one runloop.
        DispatchQueue.main.async {
            showTrainingSettingSheet = true
        }
    }

    private func presentSoundSheet() {
        presentPanel { showSoundSheet = true }
    }

    private func presentSessionSaveSheet() {
        presentPanel { showSessionSaveSheet = true }
    }
}

private struct MetronomeBeatFlashOverlay: View {
    @ObservedObject var beatState: MetronomeBeatState

    var body: some View {
        AppPalette.metronomeTheme
            .opacity(beatState.flashPulseOpacity)
            .ignoresSafeArea()
            .allowsHitTesting(false)
    }
}

private struct MetronomeBeatRow: View {
    @ObservedObject var beatState: MetronomeBeatState
    let beatPattern: [BeatStrength]
    let onTapBeat: (Int) -> Void

    var body: some View {
        BeatVisualizerView(
            beatPattern: beatPattern,
            activeBeat: beatState.activeBeat,
            beatTick: beatState.beatTick,
            pulseDuration: beatState.pulseDuration,
            onTapBeat: onTapBeat
        )
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
                Section("metronome.library.section.today") {
                    if items.isEmpty {
                        Text("metronome.library.empty.saved")
                            .foregroundStyle(.secondary)
                    } else {
                        let todayItems = items.filter { $0.source == .today }
                        if todayItems.isEmpty {
                            Text("metronome.library.empty.visible")
                                .foregroundStyle(.secondary)
                        } else {
                            ForEach(todayItems) { item in
                                itemRow(item)
                            }
                        }
                    }
                }

                Section("metronome.library.section.saved") {
                    let savedItems = items.filter { $0.source == .saved }
                    if savedItems.isEmpty {
                        Text("metronome.library.empty.saved")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(savedItems) { item in
                            itemRow(item)
                        }
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("common.close") {
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
        Button {
            AppHaptics.tap()
            onLoad(item)
            dismiss()
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                Text(itemMetaText(item))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .foregroundStyle(.primary)
        .swipeActions {
            Button(role: .destructive) {
                AppHaptics.tap()
                onDelete(item)
            } label: {
                Text("common.delete")
            }
        }
    }

    private func itemMetaText(_ item: MetronomeViewModel.LibraryItem) -> String {
        let unset = String(localized: "metronome.common.unset")
        let bpmText = item.bpm.map(String.init) ?? unset
        let numeratorText = item.numerator.map(String.init) ?? unset
        let denominatorText = item.denominator.map(String.init) ?? unset
        let format = String(localized: "metronome.library.item.meta.format")
        return String(format: format, bpmText, numeratorText, denominatorText)
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
                TextField("metronome.session.name.placeholder", text: $name)
            }
            .navigationTitle("metronome.session.save.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("metronome.session.skip") {
                        AppHaptics.tap()
                        onSkip()
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.save") {
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
        _selectedPreset = State(initialValue: preset.pwaTopLevelBase)
        _selectedSoundEnabled = State(initialValue: soundEnabled)
        _selectedVolume = State(initialValue: volume)
        _selectedAccentGain = State(initialValue: accentGain)
        _selectedFlashEnabled = State(initialValue: flashEnabled)
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Toggle("metronome.sound.enabled", isOn: $selectedSoundEnabled)
                }

                Section("metronome.sound.section.type") {
                    Picker("", selection: $selectedPreset) {
                        ForEach(MetronomeSoundPreset.pwaTopLevelOptions) { item in
                            Text(item.title).tag(item)
                        }
                    }
                    .labelsHidden()
                    .pickerStyle(.inline)
                    .onChangeSafe(of: selectedPreset) { _ in
                        AppHaptics.selectionChanged()
                    }
                }

                Section("metronome.sound.section.volume") {
                    HStack {
                        Image(systemName: "speaker.fill")
                        Slider(value: $selectedVolume, in: 0...1, step: 0.01)
                        Text("\(Int(selectedVolume * 100))%")
                            .monospacedDigit()
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("metronome.sound.section.accent") {
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

                Section("metronome.sound.section.visual") {
                    Toggle("metronome.sound.flash", isOn: $selectedFlashEnabled)
                }
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("metronome.sound.apply") {
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
                    Picker("metronome.signature.numerator", selection: $numerator) {
                        ForEach(1...16, id: \.self) { value in
                            Text("\(value)").tag(value)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(maxWidth: .infinity, maxHeight: 190)

                    Text("/")
                        .font(.system(size: 28, weight: .semibold, design: .rounded))
                        .foregroundStyle(.primary)

                    Picker("metronome.signature.denominator", selection: $denominator) {
                        ForEach([1, 2, 4, 8], id: \.self) { value in
                            Text("\(value)").tag(value)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(maxWidth: .infinity, maxHeight: 190)
                }

                Button("common.done") {
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

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(RhythmSubdivision.allPatterns) { pattern in
                        Button {
                            AppHaptics.selectionChanged()
                            selected = pattern
                        } label: {
                            ZStack(alignment: .topTrailing) {
                                MetronomeSubdivisionNotationView(
                                    subdivision: pattern,
                                    denominator: denominator
                                )
                                .frame(maxWidth: .infinity)
                                .frame(height: 64)
                                .background(
                                    RoundedRectangle(cornerRadius: 10)
                                        .fill(Color(uiColor: .secondarySystemGroupedBackground))
                                )

                                if selected == pattern {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.white, Color.accentColor)
                                        .font(.system(size: 16))
                                        .padding(5)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("common.done") {
                        AppHaptics.tap()
                        onSelect(selected)
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
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
                Section {
                    Toggle(mode.title, isOn: isEnabledBinding)
                }

                if isEnabled {
                    Section {
                        Picker("", selection: basisBinding) {
                            ForEach(TrainingBasis.allCases.filter { $0 != .off }) { basis in
                                Text(basis.title).tag(basis)
                            }
                        }
                        .pickerStyle(.inline)
                        .labelsHidden()
                    }

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
            }
            .animation(.default, value: isEnabled)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("common.done") {
                        AppHaptics.tap()
                        onApply(mode, songLengthValue, incrementalTempoValue, mutePatternValue)
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var isEnabled: Bool {
        basisBinding.wrappedValue != .off
    }

    private var isEnabledBinding: Binding<Bool> {
        Binding(
            get: { basisBinding.wrappedValue != .off },
            set: { on in
                if on {
                    if basisBinding.wrappedValue == .off {
                        basisBinding.wrappedValue = .bars
                    }
                } else {
                    basisBinding.wrappedValue = .off
                }
            }
        )
    }

    private var basisBinding: Binding<TrainingBasis> {
        switch mode {
        case .phraseLength:     return $songLengthValue.basis
        case .progressiveTempo: return $incrementalTempoValue.basis
        case .mutePattern:      return $mutePatternValue.basis
        case .none:             return .constant(.off)
        }
    }
}

private struct PhraseLengthSettingsSection: View {
    @Binding var settings: SongLengthTrainingSettings

    var body: some View {
        Section("metronome.training.section.length") {
            if settings.basis == .bars {
                Picker("metronome.training.bars.count", selection: $settings.bars) {
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
        Section("metronome.training.section.progressive") {
            if settings.basis == .bars {
                Stepper(progressiveStepBarsLabel, value: $settings.barsStep, in: -40...40)
                    .padding(.vertical, 4)
                Stepper(progressiveIntervalBarsLabel, value: $settings.barsInterval, in: 1...99)
                    .padding(.vertical, 4)
                Stepper(progressiveLimitBarsLabel, value: $settings.barsLimit, in: 20...max(currentBPM * 2, 400))
                    .padding(.vertical, 4)
            }

            if settings.basis == .duration {
                Stepper(progressiveStepDurationLabel, value: $settings.durationStep, in: -40...40)
                    .padding(.vertical, 4)
                Stepper(progressiveIntervalDurationLabel, value: $settings.durationInterval, in: 5...200, step: 5)
                    .padding(.vertical, 4)
                Stepper(progressiveLimitDurationLabel, value: $settings.durationLimit, in: 20...max(currentBPM * 2, 400))
                    .padding(.vertical, 4)
            }
        }
    }

    private var progressiveStepBarsLabel: String {
        "\(String(localized: "metronome.training.progressive.step.label")): \(signedStep(settings.barsStep)) BPM"
    }

    private var progressiveIntervalBarsLabel: String {
        "\(String(localized: "metronome.training.progressive.interval.label")): \(settings.barsInterval)\(String(localized: "metronome.unit.bars"))"
    }

    private var progressiveLimitBarsLabel: String {
        "\(String(localized: "metronome.training.progressive.limit.label")): \(settings.barsLimit)"
    }

    private var progressiveStepDurationLabel: String {
        "\(String(localized: "metronome.training.progressive.step.label")): \(signedStep(settings.durationStep)) BPM"
    }

    private var progressiveIntervalDurationLabel: String {
        "\(String(localized: "metronome.training.progressive.interval.label")): \(settings.durationInterval)\(String(localized: "metronome.unit.seconds"))"
    }

    private var progressiveLimitDurationLabel: String {
        "\(String(localized: "metronome.training.progressive.limit.label")): \(settings.durationLimit)"
    }

    private func signedStep(_ value: Int) -> String {
        value >= 0 ? "+\(value)" : "\(value)"
    }
}

private struct MutePatternSettingsSection: View {
    @Binding var settings: MutePatternTrainingSettings

    var body: some View {
        Section("metronome.training.section.mute") {
            if settings.basis == .bars {
                Stepper(soundBarsLabel, value: $settings.barsSoundLength, in: 1...99)
                    .padding(.vertical, 4)
                Stepper(muteBarsLabel, value: $settings.barsMuteLength, in: 1...99)
                    .padding(.vertical, 4)
            }

            if settings.basis == .duration {
                Stepper(soundSecondsLabel, value: $settings.durationSoundLength, in: 1...99)
                    .padding(.vertical, 4)
                Stepper(muteSecondsLabel, value: $settings.durationMuteLength, in: 1...99)
                    .padding(.vertical, 4)
            }
        }
    }

    private var soundBarsLabel: String {
        "\(String(localized: "metronome.training.mute.sound.label")): \(settings.barsSoundLength)\(String(localized: "metronome.unit.bars"))"
    }

    private var muteBarsLabel: String {
        "\(String(localized: "metronome.training.mute.silent.label")): \(settings.barsMuteLength)\(String(localized: "metronome.unit.bars"))"
    }

    private var soundSecondsLabel: String {
        "\(String(localized: "metronome.training.mute.sound.label")): \(settings.durationSoundLength)\(String(localized: "metronome.unit.seconds"))"
    }

    private var muteSecondsLabel: String {
        "\(String(localized: "metronome.training.mute.silent.label")): \(settings.durationMuteLength)\(String(localized: "metronome.unit.seconds"))"
    }
}
