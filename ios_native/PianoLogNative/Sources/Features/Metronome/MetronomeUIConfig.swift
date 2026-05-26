import CoreGraphics
import Foundation

enum MetronomeUIConfig {
    struct LayoutMetrics {
        let topPadding: CGFloat
        let beatRowHeight: CGFloat
        let beatToControlSpacing: CGFloat
        let controlToInfoSpacing: CGFloat
        let infoToDialSpacing: CGFloat
        let trainingTextOffset: CGFloat
        let contentHorizontalInset: CGFloat
        let dialContainerWidth: CGFloat
        let dialContainerHeight: CGFloat
        let tapTrailingInset: CGFloat
        let tapBottomInset: CGFloat
    }

    static func layoutMetrics(for size: CGSize) -> LayoutMetrics {
        let reference = CGSize(width: 393, height: 852)
        let scaleX = max(0.80, min(1.50, size.width / reference.width))
        let scaleY = max(0.80, min(1.50, size.height / reference.height))
        let scale = min(scaleX, scaleY)

        return LayoutMetrics(
            topPadding: 30 * scale,
            beatRowHeight: 88 * scale,
            beatToControlSpacing: 24 * scale,
            controlToInfoSpacing: 32 * scale,
            infoToDialSpacing: 46 * scale,
            trainingTextOffset: 22 * scale,
            contentHorizontalInset: 16 * scaleX,
            dialContainerWidth: max(1, min(size.width - (24 * scaleX), 370 * scale)),
            dialContainerHeight: 294 * scale,
            tapTrailingInset: 18 * scaleX,
            tapBottomInset: 46 * scaleY
        )
    }
}

enum MetronomeDialTuning {
    static let velocityLow: CGFloat = 90
    static let velocityHigh: CGFloat = 360
    static let bpmPerTurnAtLowVelocity: CGFloat = 10
    static let bpmPerTurnAtHighVelocity: CGFloat = 20

    static let hapticBpmStep = 2
    static let hapticIntervalSeconds: TimeInterval = 0.035

    static let decayFpsIntervalMs: UInt64 = 16
    static let decayFactorPerTick: CGFloat = 0.92
    static let decayStopThreshold: CGFloat = 0.5
}
