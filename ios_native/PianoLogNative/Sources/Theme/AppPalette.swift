import SwiftUI

enum AppPalette {
    static let bgPrimary = Color(uiColor: .systemBackground)

    static let homeTheme = Color(
        uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.545, green: 0.710, blue: 0.694, alpha: 1.0) // #8BB5B1
                : UIColor(red: 0.271, green: 0.710, blue: 0.667, alpha: 1.0) // #45B5AA
        }
    )

    static let todayTheme = Color(
        uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.416, green: 0.435, blue: 0.698, alpha: 1.0) // #6A6FB2
                : UIColor(red: 0.420, green: 0.467, blue: 0.553, alpha: 1.0) // #6B778D
        }
    )

    static let vivaMagenta = Color(
        uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.910, green: 0.549, blue: 0.627, alpha: 1.0) // #E88CA0
                : UIColor(red: 0.745, green: 0.204, blue: 0.333, alpha: 1.0) // #BE3455
        }
    )

    static let metronomeTheme = Color(
        uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.773, green: 0.875, blue: 0.043, alpha: 1.0) // #C5DF0B Sulphur Spring
                : UIColor(red: 0.953, green: 0.435, blue: 0.388, alpha: 1.0) // #F36F63 Living Coral
        }
    )
}
