import SwiftUI
import ActivityKit

@main
struct PianoLogNativeApp: App {
    @StateObject private var selectedDateStore = SelectedDateStore()
    @StateObject private var practiceTracksStore = PracticeTracksStore()
    @StateObject private var practiceDataStore = PracticeDataStore()

    init() {
        Self.endResidualMetronomeLiveActivitiesIfNeeded()
    }

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(selectedDateStore)
                .environmentObject(practiceTracksStore)
                .environmentObject(practiceDataStore)
        }
    }

    private static func endResidualMetronomeLiveActivitiesIfNeeded() {
        guard #available(iOS 16.1, *) else { return }
        Task { @MainActor in
            for existing in Activity<MetronomeLiveActivityAttributes>.activities {
                await existing.end(dismissalPolicy: .immediate)
            }
        }
    }
}
