import SwiftUI

struct BeatVisualizerView: View {
    private struct BeatItem: Identifiable {
        let id: Int
        let strength: BeatStrength
    }

    let beatPattern: [BeatStrength]
    let activeBeat: Int
    let beatTick: Int
    let beatDuration: Double
    let onTapBeat: (Int) -> Void
    private let baseIconFrame: CGFloat = 24
    private let maxIconFrame: CGFloat = 59
    private let minIconFrame: CGFloat = 17

    private var columns: [GridItem] {
        let count = beatPattern.count
        let perRow = max(1, count)
        let spacing = gridSpacing(for: count)
        return Array(
            repeating: GridItem(.flexible(minimum: minIconFrame), spacing: spacing),
            count: perRow
        )
    }

    private var entries: [BeatItem] {
        beatPattern.enumerated().map { BeatItem(id: $0.offset, strength: $0.element) }
    }

    var body: some View {
        GeometryReader { geo in
            let count = max(1, beatPattern.count)
            let perRow = max(1, columns.count)
            let spacing = gridSpacing(for: count)
            let horizontalPadding: CGFloat = 0
            let available = max(
                1,
                geo.size.width - (horizontalPadding * 2) - (CGFloat(perRow - 1) * spacing)
            )
            let slotWidth = max(1, available / CGFloat(perRow))
            let iconSize = min(maxIconFrame, max(minIconFrame, slotWidth * 0.7))

            LazyVGrid(columns: columns, spacing: spacing) {
                SwiftUI.ForEach(entries, id: \.id) { (entry: BeatItem) in
                    let isActive = entry.id == activeBeat
                    Button {
                        AppHaptics.tap()
                        onTapBeat(entry.id)
                    } label: {
                        symbolView(
                            beatID: entry.id,
                            for: entry.strength,
                            isActive: isActive,
                            activeBeat: activeBeat,
                            beatTick: beatTick,
                            beatDuration: beatDuration,
                            frame: iconSize
                        )
                            .frame(width: iconSize, height: iconSize)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                    }
                    .buttonStyle(.plain)
                    .tint(tintColor(for: entry.strength, isActive: isActive))
                    .hoverEffect(.lift)
                    .accessibilityLabel("Beat \(entry.id + 1)")
                    .frame(width: slotWidth, height: iconSize)
                }
            }
            .padding(.horizontal, horizontalPadding)
        }
    }

    private func symbolView(
        beatID: Int,
        for strength: BeatStrength,
        isActive: Bool,
        activeBeat: Int,
        beatTick: Int,
        beatDuration: Double,
        frame: CGFloat
    ) -> some View {
        BeatPulseSymbolView(
            beatID: beatID,
            symbolName: symbolName(for: strength),
            tintColor: tintColor(for: strength, isActive: isActive),
            frame: frame,
            activeBeat: activeBeat,
            beatTick: beatTick,
            beatDuration: beatDuration
        )
    }

    private func gridSpacing(for count: Int) -> CGFloat {
        switch count {
        case ...4: return 16
        case 5...8: return 10
        case 9...12: return 7
        default: return 5
        }
    }

    private func symbolName(for strength: BeatStrength) -> String {
        switch strength {
        case .silent: return "circle.dotted"
        case .weak: return "circle"
        case .strong: return "circle.circle"
        case .accent: return "circle.circle.fill"
        }
    }

    private func tintColor(for strength: BeatStrength, isActive: Bool) -> Color {
        _ = isActive
        switch strength {
        case .silent: return .secondary.opacity(0.8)
        case .weak: return .secondary
        case .strong: return AppPalette.metronomeTheme.opacity(0.75)
        case .accent: return AppPalette.metronomeTheme
        }
    }
}

private struct BeatPulseSymbolView: View {
    let beatID: Int
    let symbolName: String
    let tintColor: Color
    let frame: CGFloat
    let activeBeat: Int
    let beatTick: Int
    let beatDuration: Double

    @State private var pulse: CGFloat = 0
    @State private var lastTriggeredTick: Int = -1
    @State private var pulseTask: Task<Void, Never>?

    var body: some View {
        let fontSize = min(22, max(11, frame * 0.42))
        let scale = 1.0 + (0.22 * pulse)
        let opacity = 0.78 + (0.22 * Double(pulse))
        let image = Image(systemName: symbolName)
            .font(.system(size: fontSize, weight: .regular))
            .foregroundStyle(tintColor.opacity(opacity))
            .scaleEffect(scale)
        let pulseToken = (activeBeat == beatID) ? beatTick : -1

        image
        .onAppear {
            pulse = 0
        }
        .onChange(of: pulseToken) { token in
            guard token >= 0 else {
                pulseTask?.cancel()
                pulseTask = nil
                withAnimation(.linear(duration: 0.03)) {
                    pulse = 0
                }
                return
            }
            syncPulse(tick: token)
        }
        .onDisappear {
            pulseTask?.cancel()
            pulseTask = nil
        }
    }

    private func syncPulse(tick: Int) {
        guard tick != lastTriggeredTick else { return }
        lastTriggeredTick = tick

        pulseTask?.cancel()
        pulseTask = nil

        pulse = 1
        // Keep blinks short so each beat finishes cleanly before the next one.
        let pulseDuration = max(0.07, min(0.16, beatDuration * 0.35))
        withAnimation(.linear(duration: pulseDuration)) {
            pulse = 0
        }

        pulseTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(pulseDuration * 1_000_000_000))
            guard !Task.isCancelled else { return }
            pulse = 0
        }
    }
}
