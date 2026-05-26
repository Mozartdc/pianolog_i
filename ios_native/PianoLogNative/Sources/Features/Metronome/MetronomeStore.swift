import Foundation


enum BeatStrength: Equatable {
    case silent   // 0
    case weak     // 1
    case strong   // 2
    case accent   // A

    func next() -> BeatStrength {
        switch self {
        case .accent: return .strong
        case .strong: return .weak
        case .weak: return .silent
        case .silent: return .accent
        }
    }
}

struct TimeSignature: Equatable, Hashable {
    var numerator: Int
    var denominator: Int

    static let common: [TimeSignature] = [
        .init(numerator: 2, denominator: 4),
        .init(numerator: 3, denominator: 4),
        .init(numerator: 4, denominator: 4),
        .init(numerator: 6, denominator: 8),
        .init(numerator: 12, denominator: 8)
    ]
}

struct RhythmSubdivision: Identifiable, Codable, Equatable, Hashable {
    let id: String
    let title: String
    let description: String
    let values: [Double] // relative beat lengths, aligned with PWA rhythm pattern
    let tickPattern: [Int] // 1 = sound, 0 = rest

    var ticksPerBeat: Int { max(1, tickPattern.count) }

    static let oneBeat = RhythmSubdivision(
        id: "one_beat",
        title: String(localized: "metronome.subdivision.one_beat.title"),
        description: String(localized: "metronome.subdivision.one_beat.description"),
        values: [1.0],
        tickPattern: [1]
    )
    static let twoParts = RhythmSubdivision(
        id: "two_parts",
        title: String(localized: "metronome.subdivision.two_parts.title"),
        description: String(localized: "metronome.subdivision.two_parts.description"),
        values: [0.5, 0.5],
        tickPattern: [1, 1]
    )
    static let restPlusHalf = RhythmSubdivision(
        id: "rest_plus_half",
        title: String(localized: "metronome.subdivision.rest_plus_half.title"),
        description: String(localized: "metronome.subdivision.rest_plus_half.description"),
        values: [0.5, 0.5],
        tickPattern: [0, 1]
    )
    static let triplet = RhythmSubdivision(
        id: "triplet",
        title: String(localized: "metronome.subdivision.triplet.title"),
        description: String(localized: "metronome.subdivision.triplet.description"),
        values: [0.333, 0.333, 0.333],
        tickPattern: [1, 1, 1]
    )
    static let tripletRestFirst = RhythmSubdivision(
        id: "triplet_rest_first",
        title: String(localized: "metronome.subdivision.triplet_rest_first.title"),
        description: String(localized: "metronome.subdivision.triplet_rest_first.description"),
        values: [0.333, 0.333, 0.333],
        tickPattern: [0, 1, 1]
    )
    static let tripletRestMiddle = RhythmSubdivision(
        id: "triplet_rest_middle",
        title: String(localized: "metronome.subdivision.triplet_rest_middle.title"),
        description: String(localized: "metronome.subdivision.triplet_rest_middle.description"),
        values: [0.333, 0.333, 0.333],
        tickPattern: [1, 0, 1]
    )
    static let tripletRestLast = RhythmSubdivision(
        id: "triplet_rest_last",
        title: String(localized: "metronome.subdivision.triplet_rest_last.title"),
        description: String(localized: "metronome.subdivision.triplet_rest_last.description"),
        values: [0.333, 0.333, 0.333],
        tickPattern: [1, 1, 0]
    )
    static let tripletRestEdges = RhythmSubdivision(
        id: "triplet_rest_edges",
        title: String(localized: "metronome.subdivision.triplet_rest_edges.title"),
        description: String(localized: "metronome.subdivision.triplet_rest_edges.description"),
        values: [0.333, 0.333, 0.333],
        tickPattern: [0, 1, 0]
    )
    static let fourPartsA = RhythmSubdivision(
        id: "four_parts_A",
        title: String(localized: "metronome.subdivision.four_parts_A.title"),
        description: String(localized: "metronome.subdivision.four_parts_A.description"),
        values: [0.25, 0.25, 0.25, 0.25],
        tickPattern: [1, 1, 1, 1]
    )
    static let fourPartsB = RhythmSubdivision(
        id: "four_parts_B",
        title: String(localized: "metronome.subdivision.four_parts_B.title"),
        description: String(localized: "metronome.subdivision.four_parts_B.description"),
        values: [0.25, 0.25, 0.25, 0.25],
        tickPattern: [1, 0, 1, 0]
    )
    static let quarterQuarterHalf = RhythmSubdivision(
        id: "quarter_quarter_half",
        title: "1/4+1/4+1/2",
        description: "1/4 + 1/4 + 1/2",
        values: [0.25, 0.25, 0.5],
        tickPattern: [1, 1, 1]
    )
    static let halfQuarterQuarter = RhythmSubdivision(
        id: "half_quarter_quarter",
        title: "1/2+1/4+1/4",
        description: "1/2 + 1/4 + 1/4",
        values: [0.5, 0.25, 0.25],
        tickPattern: [1, 1, 1]
    )
    static let dottedHalfQuarter = RhythmSubdivision(
        id: "dotted_half_quarter",
        title: "3/4+1/4",
        description: "3/4 + 1/4",
        values: [0.75, 0.25],
        tickPattern: [1, 1]
    )
    static let quarterDottedHalf = RhythmSubdivision(
        id: "quarter_dotted_half",
        title: "1/4+3/4",
        description: "1/4 + 3/4",
        values: [0.25, 0.75],
        tickPattern: [1, 1]
    )
    static let quarterHalfQuarter = RhythmSubdivision(
        id: "quarter_half_quarter",
        title: "1/4+1/2+1/4",
        description: "1/4 + 1/2 + 1/4",
        values: [0.25, 0.5, 0.25],
        tickPattern: [1, 1, 1]
    )

    static let allPatterns: [RhythmSubdivision] = [
        .oneBeat,
        .twoParts,
        .restPlusHalf,
        .triplet,
        .tripletRestFirst,
        .tripletRestMiddle,
        .tripletRestLast,
        .tripletRestEdges,
        .fourPartsA,
        .fourPartsB,
        .quarterQuarterHalf,
        .halfQuarterQuarter,
        .dottedHalfQuarter,
        .quarterDottedHalf,
        .quarterHalfQuarter
    ]
}

enum RhythmTrainingMode: String, CaseIterable, Identifiable {
    case none
    case phraseLength
    case progressiveTempo
    case mutePattern

    var id: String { rawValue }

    var title: String {
        switch self {
        case .none: return String(localized: "metronome.training.mode.none")
        case .phraseLength: return String(localized: "metronome.training.mode.phrase")
        case .progressiveTempo: return String(localized: "metronome.training.mode.progressive")
        case .mutePattern: return String(localized: "metronome.training.mode.mute")
        }
    }
}

enum TrainingBasis: String, CaseIterable, Identifiable, Codable {
    case off
    case bars
    case duration

    var id: String { rawValue }

    var title: String {
        switch self {
        case .off: return String(localized: "metronome.training.basis.off")
        case .bars: return String(localized: "metronome.training.basis.bars")
        case .duration: return String(localized: "metronome.training.basis.duration")
        }
    }
}

struct SongLengthTrainingSettings: Codable, Equatable {
    var basis: TrainingBasis
    var bars: Int
    var durationSeconds: Int
}

struct IncrementalTempoTrainingSettings: Codable, Equatable {
    var basis: TrainingBasis
    var barsStep: Int
    var barsInterval: Int
    var barsLimit: Int
    var durationStep: Int
    var durationInterval: Int
    var durationLimit: Int
}

struct MutePatternTrainingSettings: Codable, Equatable {
    var basis: TrainingBasis
    var barsSoundLength: Int
    var barsMuteLength: Int
    var durationSoundLength: Int
    var durationMuteLength: Int
}

enum MetronomeSoundPreset: String, CaseIterable, Identifiable, Codable {
    case mechanical
    case mechanicalAccent
    case mechanicalWeak
    case pendulum
    case woodBlock
    case woodClap
    case marimba
    case xylophone
    case beep
    case click
    case shaker
    case tambourine

    var id: String { rawValue }

    var category: MetronomeSoundCategory {
        switch self {
        case .mechanical, .mechanicalAccent, .mechanicalWeak, .pendulum:
            return .mechanical
        case .woodBlock, .woodClap:
            return .wood
        case .shaker, .tambourine:
            return .percussion
        case .beep, .click:
            return .digital
        case .marimba, .xylophone:
            return .marimba
        }
    }

    var title: String {
        switch self {
        case .mechanical: return String(localized: "metronome.sound.preset.mechanical.title")
        case .mechanicalAccent: return String(localized: "metronome.sound.preset.mechanicalAccent.title")
        case .mechanicalWeak: return String(localized: "metronome.sound.preset.mechanicalWeak.title")
        case .pendulum: return String(localized: "metronome.sound.preset.pendulum.title")
        case .woodBlock: return String(localized: "metronome.sound.preset.woodBlock.title")
        case .woodClap: return String(localized: "metronome.sound.preset.woodClap.title")
        case .marimba: return String(localized: "metronome.sound.preset.marimba.title")
        case .xylophone: return String(localized: "metronome.sound.preset.xylophone.title")
        case .beep: return String(localized: "metronome.sound.preset.beep.title")
        case .click: return String(localized: "metronome.sound.preset.click.title")
        case .shaker: return String(localized: "metronome.sound.preset.shaker.title")
        case .tambourine: return String(localized: "metronome.sound.preset.tambourine.title")
        }
    }

    var pwaDescription: String {
        switch self {
        case .woodBlock: return String(localized: "metronome.sound.preset.woodBlock.description")
        case .woodClap: return String(localized: "metronome.sound.preset.woodClap.description")
        case .shaker: return String(localized: "metronome.sound.preset.shaker.description")
        case .tambourine: return String(localized: "metronome.sound.preset.tambourine.description")
        case .beep: return String(localized: "metronome.sound.preset.beep.description")
        case .click: return String(localized: "metronome.sound.preset.click.description")
        case .mechanical: return String(localized: "metronome.sound.preset.mechanical.description")
        case .mechanicalAccent: return String(localized: "metronome.sound.preset.mechanicalAccent.description")
        case .mechanicalWeak: return String(localized: "metronome.sound.preset.mechanicalWeak.description")
        case .pendulum: return String(localized: "metronome.sound.preset.pendulum.description")
        case .marimba: return String(localized: "metronome.sound.preset.marimba.description")
        case .xylophone: return String(localized: "metronome.sound.preset.xylophone.description")
        }
    }

    // PWA SoundSettingsPanel의 상위 5개 옵션과 동일한 노출 목록.
    static let pwaTopLevelOptions: [MetronomeSoundPreset] = [
        .mechanical,
        .woodBlock,
        .marimba,
        .beep,
        .shaker
    ]

    // 내부 상세 프리셋(예: mechanicalAccent)도 설정창 진입 시 상위 대표 프리셋으로 정규화.
    var pwaTopLevelBase: MetronomeSoundPreset {
        switch self {
        case .mechanical, .mechanicalAccent, .mechanicalWeak, .pendulum:
            return .mechanical
        case .woodBlock, .woodClap:
            return .woodBlock
        case .marimba, .xylophone:
            return .marimba
        case .beep, .click:
            return .beep
        case .shaker, .tambourine:
            return .shaker
        }
    }
}

enum MetronomeSoundCategory: String, CaseIterable, Identifiable {
    case mechanical
    case wood
    case percussion
    case digital
    case marimba

    var id: String { rawValue }

    var title: String {
        switch self {
        case .mechanical: return String(localized: "metronome.sound.category.mechanical")
        case .wood: return String(localized: "metronome.sound.category.wood")
        case .percussion: return String(localized: "metronome.sound.category.percussion")
        case .digital: return String(localized: "metronome.sound.category.digital")
        case .marimba: return String(localized: "metronome.sound.category.marimba")
        }
    }
}

@MainActor
// 앱 재시작 후에도 유지되는 사용자 환경설정.
// BPM·박자처럼 곡마다 달라지는 값은 포함하지 않는다.
// 스코어 뷰어 연동 시 이 구조체를 참조해 '전역 기본값'과 '곡별 오버라이드'를 구분한다.
struct MetronomeUserPreferences: Codable {
    var soundPreset: MetronomeSoundPreset
    var soundEnabled: Bool
    var soundVolume: Double
    var accentGain: Double
    var flashEnabled: Bool

    static let `default` = MetronomeUserPreferences(
        soundPreset: .mechanical,
        soundEnabled: true,
        soundVolume: 0.7,
        accentGain: 1.5,
        flashEnabled: false
    )
}

final class MetronomeStore: ObservableObject {
    @Published var bpm: Int = 120
    @Published var isPlaying: Bool = false
    @Published var currentBeat: Int = 0
    @Published var beatTick: Int = 0
    // Visual pulse duration derived from audio callback timing compensation.
    @Published var beatPulseDuration: Double = 0.10
    @Published var timeSignature: TimeSignature = .init(numerator: 4, denominator: 4)
    @Published var subdivision: RhythmSubdivision = .oneBeat
    @Published var beatPattern: [BeatStrength] = [.accent, .strong, .strong, .strong]
    @Published var trainingMode: RhythmTrainingMode = .none
    @Published var songLength = SongLengthTrainingSettings(
        basis: .off,
        bars: 1,
        durationSeconds: 0
    )
    @Published var incrementalTempo = IncrementalTempoTrainingSettings(
        basis: .off,
        barsStep: 1,
        barsInterval: 1,
        barsLimit: 120,
        durationStep: 1,
        durationInterval: 5,
        durationLimit: 120
    )
    @Published var mutePattern = MutePatternTrainingSettings(
        basis: .off,
        barsSoundLength: 1,
        barsMuteLength: 1,
        durationSoundLength: 1,
        durationMuteLength: 1
    )
    @Published var soundPreset: MetronomeSoundPreset = .mechanical
    @Published var soundEnabled: Bool = true
    @Published var soundVolume: Double = 0.7
    @Published var accentGain: Double = 1.5
    @Published var flashEnabled: Bool = false

    func setBpm(_ value: Int) {
        bpm = min(max(value, 20), 400) // Phase 1-1
    }

    func incrementBpm() { setBpm(bpm + 1) }
    func decrementBpm() { setBpm(bpm - 1) }

    func setTimeSignature(_ signature: TimeSignature) {
        timeSignature = signature
        currentBeat = 0
        ensureBeatPatternLength()
    }

    func setSubdivision(_ value: RhythmSubdivision) {
        subdivision = value
    }

    func cycleBeatStrength(at index: Int) {
        guard beatPattern.indices.contains(index) else { return }
        beatPattern[index] = beatPattern[index].next()
    }

    func setTrainingMode(_ mode: RhythmTrainingMode) {
        trainingMode = mode
        // Keep basis defaults coherent with the selected mode.
        switch mode {
        case .none:
            break
        case .phraseLength:
            if songLength.basis == .off { songLength.basis = .bars }
        case .progressiveTempo:
            if incrementalTempo.basis == .off { incrementalTempo.basis = .bars }
        case .mutePattern:
            if mutePattern.basis == .off { mutePattern.basis = .bars }
        }
    }

    private func ensureBeatPatternLength() {
        let count = max(1, min(16, timeSignature.numerator))
        if beatPattern.count == count { return }

        if beatPattern.count < count {
            let additional = Array(repeating: BeatStrength.strong, count: count - beatPattern.count)
            beatPattern.append(contentsOf: additional)
        } else {
            beatPattern = Array(beatPattern.prefix(count))
        }

        if !beatPattern.isEmpty, beatPattern[0] == .silent {
            beatPattern[0] = .accent
        }
    }
}
