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
        title: "한 박",
        description: "한 박 채우기",
        values: [1.0],
        tickPattern: [1]
    )
    static let twoParts = RhythmSubdivision(
        id: "two_parts",
        title: "두 분할",
        description: "한 박을 두 개로 나누기",
        values: [0.5, 0.5],
        tickPattern: [1, 1]
    )
    static let restPlusHalf = RhythmSubdivision(
        id: "rest_plus_half",
        title: "쉼표+반박",
        description: "쉼표 + 반박",
        values: [0.5, 0.5],
        tickPattern: [0, 1]
    )
    static let triplet = RhythmSubdivision(
        id: "triplet",
        title: "3연음",
        description: "한 박을 세 개로 나누기",
        values: [0.333, 0.333, 0.333],
        tickPattern: [1, 1, 1]
    )
    static let tripletRestFirst = RhythmSubdivision(
        id: "triplet_rest_first",
        title: "3연음(첫쉼)",
        description: "3연음 첫 박 쉼표",
        values: [0.333, 0.333, 0.333],
        tickPattern: [0, 1, 1]
    )
    static let tripletRestMiddle = RhythmSubdivision(
        id: "triplet_rest_middle",
        title: "3연음(중쉼)",
        description: "3연음 가운데 쉼표",
        values: [0.333, 0.333, 0.333],
        tickPattern: [1, 0, 1]
    )
    static let tripletRestLast = RhythmSubdivision(
        id: "triplet_rest_last",
        title: "3연음(끝쉼)",
        description: "3연음 마지막 쉼표",
        values: [0.333, 0.333, 0.333],
        tickPattern: [1, 1, 0]
    )
    static let tripletRestEdges = RhythmSubdivision(
        id: "triplet_rest_edges",
        title: "3연음(앞뒤쉼)",
        description: "3연음 앞뒤 쉼표",
        values: [0.333, 0.333, 0.333],
        tickPattern: [0, 1, 0]
    )
    static let fourPartsA = RhythmSubdivision(
        id: "four_parts_A",
        title: "16분형 A",
        description: "네 개 분할",
        values: [0.25, 0.25, 0.25, 0.25],
        tickPattern: [1, 1, 1, 1]
    )
    static let fourPartsB = RhythmSubdivision(
        id: "four_parts_B",
        title: "16분형 B",
        description: "네 개 분할 변형",
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
        case .none: return "없음"
        case .phraseLength: return "곡 길이"
        case .progressiveTempo: return "점진적 템포"
        case .mutePattern: return "뮤트 패턴"
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
        case .off: return "OFF"
        case .bars: return "마디 기준"
        case .duration: return "시간 기준"
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

enum MetronomeSoundPreset: String, CaseIterable, Identifiable {
    case mechanical
    case woodBlock
    case marimba
    case beep
    case shaker

    var id: String { rawValue }

    var title: String {
        switch self {
        case .mechanical: return "기계식"
        case .woodBlock: return "우드 블럭"
        case .marimba: return "마림바"
        case .beep: return "디지털"
        case .shaker: return "퍼커션"
        }
    }
}

@MainActor
final class MetronomeStore: ObservableObject {
    @Published var bpm: Int = 120
    @Published var isPlaying: Bool = false
    @Published var currentBeat: Int = 0
    @Published var beatTick: Int = 0
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
    @Published var soundPreset: MetronomeSoundPreset = .beep
    @Published var soundEnabled: Bool = true
    @Published var soundVolume: Double = 0.8
    @Published var accentGain: Double = 1.6
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
