import UIKit

enum AppHaptics {
    private static let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private static let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private static let selection = UISelectionFeedbackGenerator()
    private static let notification = UINotificationFeedbackGenerator()

    static func tap() {
        lightImpact.prepare()
        lightImpact.impactOccurred()
    }

    static func mediumTap(intensity: CGFloat = 0.85) {
        mediumImpact.prepare()
        mediumImpact.impactOccurred(intensity: intensity)
    }

    static func selectionChanged() {
        selection.selectionChanged()
    }

    static func success() {
        notification.prepare()
        notification.notificationOccurred(.success)
    }
}
