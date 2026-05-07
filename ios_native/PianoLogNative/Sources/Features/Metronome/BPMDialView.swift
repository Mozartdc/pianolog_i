import SwiftUI

struct BPMDialView: View {
    let bpm: Int
    let isPlaying: Bool
    let minBPM: Int
    let maxBPM: Int
    let onMinus: () -> Void
    let onPlus: () -> Void
    let onPlayPause: () -> Void
    let onBPMSet: (Int) -> Void

    @State private var isDragging = false
    @State private var plusActive = false
    @State private var minusActive = false

    @State private var dragStartBPM = 120
    @State private var dragStartAngle: CGFloat = 0
    @State private var currentAngle: CGFloat = 0
    @State private var angleDelta: CGFloat = 0 // degrees, signed
    @State private var bpmDelta: CGFloat = 0

    @State private var velocityEMA: CGFloat = 0
    @State private var lastDragTime: TimeInterval = 0
    @State private var decayTask: Task<Void, Never>?
    @State private var lastHapticBPM: Int = 0
    @State private var lastHapticTime: TimeInterval = 0

    private let size: CGFloat = 180
    private let strokeWidth: CGFloat = 18
    private let containerSize: CGFloat = 250

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.secondary.opacity(0.3), lineWidth: strokeWidth)
                .frame(width: size, height: size)

            DialProgressArcShape(
                startDegrees: dragStartAngle + min(0, angleDelta),
                sweepDegrees: abs(angleDelta)
            )
            .stroke(
                AppPalette.metronomeTheme,
                style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round)
            )
            .frame(width: size, height: size)
            .opacity((isDragging || abs(angleDelta) > 0.01) ? 1 : 0)
            .animation(.easeOut(duration: 0.2), value: isDragging)

            VStack(spacing: 2) {
                Text(tempoMarking(for: bpm))
                    .font(.system(size: 15, weight: .light))
                    .multilineTextAlignment(.center)
                    .frame(width: 120)
                    .lineLimit(2)

                Text("\(bpm)")
                    .font(.system(size: 48, weight: .black, design: .rounded))
                    .monospacedDigit()

                Text("bpm")
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(.secondary)
            }

            VStack {
                HStack {
                    Button(action: handleMinusTap) {
                        Image(systemName: "minus")
                            .font(.system(size: 18, weight: .bold))
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(minusActive ? Color.primary : Color.secondary)
                    .opacity(bpm <= minBPM ? 0.5 : 1)
                    .disabled(isDragging || bpm <= minBPM)
                    .offset(x: -18, y: -5)

                    Spacer()

                    Button(action: handlePlusTap) {
                        Image(systemName: "plus")
                            .font(.system(size: 18, weight: .bold))
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(plusActive ? Color.primary : Color.secondary)
                    .opacity(bpm >= maxBPM ? 0.5 : 1)
                    .disabled(isDragging || bpm >= maxBPM)
                    .offset(x: 18, y: -5)
                }
                Spacer()
            }
            .frame(width: size + 56, height: size + 24)

            Button(action: onPlayPause) {
                Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 32, weight: .semibold))
            }
            .buttonStyle(.plain)
            .foregroundStyle(AppPalette.metronomeTheme)
            .offset(x: -104, y: 104)
        }
        .frame(width: containerSize, height: containerSize)
        .contentShape(Rectangle())
        .gesture(dragGesture)
        .onDisappear {
            stopDecayAnimation()
        }
    }

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                let now = Date().timeIntervalSince1970
                if !isDragging {
                    isDragging = true
                    stopDecayAnimation()
                    dragStartBPM = bpm
                    bpmDelta = 0
                    angleDelta = 0
                    velocityEMA = 0
                    lastDragTime = now
                    lastHapticBPM = bpm
                    lastHapticTime = now

                    let center = CGPoint(x: containerSize / 2, y: containerSize / 2)
                    let angle = normalizedAngle(from: value.location, center: center)
                    dragStartAngle = angle
                    currentAngle = angle
                }

                let center = CGPoint(x: containerSize / 2, y: containerSize / 2)
                let newAngle = normalizedAngle(from: value.location, center: center)
                let diff = angleDifference(from: currentAngle, to: newAngle)
                currentAngle = newAngle
                guard abs(diff) > 0.1 else { return }

                let dt = max(0.001, now - lastDragTime)
                lastDragTime = now

                let instantVelocity = abs(diff) / CGFloat(dt)
                velocityEMA = velocityEMA * 0.8 + instantVelocity * 0.2

                let vLow: CGFloat = 90
                let vHigh: CGFloat = 360
                let normalized = max(0, min(1, (velocityEMA - vLow) / (vHigh - vLow)))
                let eased = normalized * normalized
                let bpmPerTurn: CGFloat = 10 + (20 - 10) * eased
                let sensitivity = bpmPerTurn / 360

                let maxUpBpmDelta = CGFloat(maxBPM - dragStartBPM)
                let maxDownBpmDelta = CGFloat(minBPM - dragStartBPM)

                let candidateBpmDelta = bpmDelta + (diff * sensitivity)
                let clampedBpmDelta = max(maxDownBpmDelta, min(maxUpBpmDelta, candidateBpmDelta))

                let candidateAngleDelta = angleDelta + diff
                let maxUpDegrees = maxUpBpmDelta / max(sensitivity, 0.0001)
                let maxDownDegrees = maxDownBpmDelta / max(sensitivity, 0.0001)
                let clampedAngleDelta = max(maxDownDegrees, min(maxUpDegrees, candidateAngleDelta))

                bpmDelta = clampedBpmDelta
                angleDelta = clampedAngleDelta

                let target = max(minBPM, min(maxBPM, dragStartBPM + Int(clampedBpmDelta.rounded())))
                onBPMSet(target)
                // Throttle dial haptics so drag stays responsive under heavy UI load.
                if abs(target - lastHapticBPM) >= 2, (now - lastHapticTime) >= 0.035 {
                    AppHaptics.selectionChanged()
                    lastHapticBPM = target
                    lastHapticTime = now
                }

                plusActive = diff > 0
                minusActive = diff < 0
            }
            .onEnded { _ in
                isDragging = false
                plusActive = false
                minusActive = false
                startDecayAnimation()
            }
    }

    private func handlePlusTap() {
        AppHaptics.tap()
        onPlus()
        plusActive = true
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(150))
            plusActive = false
        }
    }

    private func handleMinusTap() {
        AppHaptics.tap()
        onMinus()
        minusActive = true
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(150))
            minusActive = false
        }
    }

    private func startDecayAnimation() {
        stopDecayAnimation()
        decayTask = Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(for: .milliseconds(16))
                if isDragging { break }
                angleDelta *= 0.92
                if abs(angleDelta) < 0.5 {
                    angleDelta = 0
                    break
                }
            }
            decayTask = nil
        }
    }

    private func stopDecayAnimation() {
        decayTask?.cancel()
        decayTask = nil
    }

    private func normalizedAngle(from point: CGPoint, center: CGPoint) -> CGFloat {
        var deg = atan2(point.y - center.y, point.x - center.x) * 180 / .pi + 90
        if deg < 0 { deg += 360 }
        if deg >= 360 { deg -= 360 }
        return deg
    }

    private func angleDifference(from a1: CGFloat, to a2: CGFloat) -> CGFloat {
        var diff = a2 - a1
        while diff > 180 { diff -= 360 }
        while diff < -180 { diff += 360 }
        return diff
    }

    private func tempoMarking(for bpm: Int) -> String {
        switch bpm {
        case ...24: return "Larghissimo"
        case ...40: return "Grave"
        case ...60: return "Largo"
        case ...66: return "Larghetto"
        case ...72: return "Adagio"
        case ...76: return "Adagietto"
        case ...80: return "Andante"
        case ...92: return "Andantino"
        case ...108: return "Andante moderato"
        case ...112: return "Moderato"
        case ...120: return "Allegretto"
        case ...168: return "Allegro"
        case ...172: return "Vivace"
        case ...176: return "Vivacissimo"
        case ...200: return "Presto"
        default: return "Prestissimo"
        }
    }
}

private struct DialProgressArcShape: Shape {
    var startDegrees: CGFloat // 0 = top, positive clockwise
    var sweepDegrees: CGFloat // always >= 0

    func path(in rect: CGRect) -> Path {
        var path = Path()
        guard sweepDegrees > 0 else { return path }

        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2
        let start = Angle(degrees: Double(startDegrees - 90))
        let end = Angle(degrees: Double(startDegrees + sweepDegrees - 90))

        // SwiftUI coordinate space has flipped Y, so clockwise=false renders
        // as visual clockwise sweep when angle increases from top.
        path.addArc(
            center: center,
            radius: radius,
            startAngle: start,
            endAngle: end,
            clockwise: false
        )
        return path
    }
}
