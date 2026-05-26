import SwiftUI

struct BeatVisualizerView: View {
    private struct BeatItem: Identifiable {
        let id: Int
        let strength: BeatStrength
    }

    let beatPattern: [BeatStrength]
    let activeBeat: Int
    let beatTick: Int
    let pulseDuration: Double
    let onTapBeat: (Int) -> Void
    private let maxIconFrame: CGFloat = 72
    private let minIconFrame: CGFloat = 17
    private let rowSpacing: CGFloat = 8

    private var entries: [BeatItem] {
        beatPattern.enumerated().map { BeatItem(id: $0.offset, strength: $0.element) }
    }

    var body: some View {
        GeometryReader { geo in
            let count = max(1, beatPattern.count)
            let useTwoRows = count > 7

            if useTwoRows {
                let perRow = (count + 1) / 2
                let spacing = gridSpacing(for: perRow)
                let available = max(1, geo.size.width - CGFloat(perRow - 1) * spacing)
                let slotWidth = max(1, available / CGFloat(perRow))
                let maxFromHeight = max(minIconFrame, (geo.size.height - rowSpacing) / 2)
                let iconSize = min(maxIconFrame, min(maxFromHeight, max(minIconFrame, slotWidth * 0.88)))
                let firstHalf = Array(entries.prefix(perRow))
                let secondHalf = Array(entries.dropFirst(perRow))
                let padding = max(0, perRow - secondHalf.count)

                VStack(spacing: rowSpacing) {
                    HStack(spacing: spacing) {
                        ForEach(firstHalf, id: \.id) { entry in
                            beatButton(entry: entry, iconSize: iconSize, slotWidth: slotWidth)
                        }
                    }
                    HStack(spacing: spacing) {
                        ForEach(secondHalf, id: \.id) { entry in
                            beatButton(entry: entry, iconSize: iconSize, slotWidth: slotWidth)
                        }
                        if padding > 0 {
                            ForEach(0..<padding, id: \.self) { _ in
                                Spacer().frame(width: slotWidth, height: iconSize)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            } else {
                let spacing = gridSpacing(for: count)
                let available = max(1, geo.size.width - CGFloat(count - 1) * spacing)
                let slotWidth = max(1, available / CGFloat(count))
                let iconSize = min(maxIconFrame, max(minIconFrame, slotWidth * 0.88))

                HStack(spacing: spacing) {
                    ForEach(entries, id: \.id) { (entry: BeatItem) in
                        beatButton(entry: entry, iconSize: iconSize, slotWidth: slotWidth)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            }
        }
    }

    @ViewBuilder
    private func beatButton(entry: BeatItem, iconSize: CGFloat, slotWidth: CGFloat) -> some View {
        let isActive = entry.id == activeBeat
        let pulseToken = isActive ? beatTick : -1

        Button {
            AppHaptics.tap()
            onTapBeat(entry.id)
        } label: {
            symbolView(
                for: entry.strength,
                isActive: isActive,
                pulseToken: pulseToken,
                frame: iconSize
            )
            .frame(width: iconSize, height: iconSize)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
        .buttonStyle(.plain)
        .tint(tintColor(for: entry.strength, isActive: isActive))
        .hoverEffect(.lift)
        .accessibilityLabel(
            String(
                format: String(localized: "metronome.beat.accessibility.format"),
                entry.id + 1
            )
        )
        .frame(width: slotWidth, height: iconSize)
    }

    private func symbolView(
        for strength: BeatStrength,
        isActive: Bool,
        pulseToken: Int,
        frame: CGFloat
    ) -> some View {
        BeatPulseSymbolView(
            symbolName: symbolName(for: strength),
            tintColor: tintColor(for: strength, isActive: isActive),
            frame: frame,
            pulseToken: pulseToken,
            pulseDuration: pulseDuration
        )
    }

    private func gridSpacing(for count: Int) -> CGFloat {
        switch count {
        case ...4: return 16
        case 5...7: return 4
        case 8...12: return 7
        default: return 5
        }
    }

    private func symbolName(for strength: BeatStrength) -> String {
        switch strength {
        case .silent: return "multiply.circle"
        case .weak: return "circle.dotted.circle"
        case .strong: return "circle.circle"
        case .accent: return "a.circle"
        }
    }

    private func tintColor(for strength: BeatStrength, isActive: Bool) -> Color {
        _ = strength
        _ = isActive
        return .primary
    }
}

// MARK: - onChange backward-compatible wrapper
// iOS 16 타겟: onChange(of:perform:) 단일-클로저 형태가 iOS 17 SDK에서 deprecated.
// 이 wrapper가 런타임 OS 버전에 따라 올바른 오버로드를 선택한다.
private struct OnChangeCompat<V: Equatable>: ViewModifier {
    let value: V
    let action: (V) -> Void
    func body(content: Content) -> some View {
        if #available(iOS 17, *) {
            content.onChange(of: value) { _, new in action(new) }
        } else {
            content.onChange(of: value, perform: action)
        }
    }
}

extension View {
    func onChangeSafe<V: Equatable>(
        of value: V,
        perform action: @escaping (V) -> Void
    ) -> some View {
        modifier(OnChangeCompat(value: value, action: action))
    }
}

// MARK: -

private struct BeatPulseSymbolView: View {
    let symbolName: String
    let tintColor: Color
    let frame: CGFloat
    let pulseToken: Int
    let pulseDuration: Double
    @State private var pulseScale: CGFloat = 1.0

    var body: some View {
        let fontSize = min(30, max(11, frame * 0.42))
        let opacity = pulseToken >= 0 ? 1.0 : 0.78
        return Image(systemName: symbolName)
            .font(.system(size: fontSize, weight: .regular))
            .symbolRenderingMode(.palette)
            .foregroundStyle(
                tintColor.opacity(opacity),
                AppPalette.metronomeTheme.opacity(opacity)
            )
            .scaleEffect(pulseScale)
            .onAppear {
                pulseScale = 1.0
            }
            .onChangeSafe(of: pulseToken) { newValue in
                guard newValue >= 0 else {
                    pulseScale = 1.0
                    return
                }
                let upDuration = max(0.02, min(0.06, pulseDuration * 0.35))
                let downDuration = max(0.03, min(0.10, pulseDuration * 0.65))
                let peakScale: CGFloat = 1.15

                pulseScale = 1.0
                withAnimation(.easeOut(duration: upDuration)) {
                    pulseScale = peakScale
                }
                withAnimation(.easeInOut(duration: downDuration).delay(upDuration)) {
                    pulseScale = 1.0
                }
            }
    }
}
