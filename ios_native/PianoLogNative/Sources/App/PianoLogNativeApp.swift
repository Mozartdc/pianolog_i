import SwiftUI

enum AppThemePreference: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    var localizedLabel: LocalizedStringKey {
        switch self {
        case .system: return "settings.theme.system"
        case .light: return "settings.theme.light"
        case .dark: return "settings.theme.dark"
        }
    }
}

@main
struct PianoLogNativeApp: App {
    @AppStorage("theme") private var themeRawValue: String = AppThemePreference.system.rawValue
    @StateObject private var selectedDateStore = SelectedDateStore()
    @StateObject private var practiceTracksStore = PracticeTracksStore()
    @StateObject private var practiceDataStore = PracticeDataStore()

    var body: some Scene {
        WindowGroup {
            let theme = AppThemePreference(rawValue: themeRawValue) ?? .system
            RootTabView()
                .environmentObject(selectedDateStore)
                .environmentObject(practiceTracksStore)
                .environmentObject(practiceDataStore)
                .preferredColorScheme(theme.colorScheme)
        }
    }
}
