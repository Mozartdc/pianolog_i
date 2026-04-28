import SwiftUI

@main
struct PianoLogNativeApp: App {
    @StateObject private var selectedDateStore = SelectedDateStore()
    @StateObject private var practiceTracksStore = PracticeTracksStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(selectedDateStore)
                .environmentObject(practiceTracksStore)
        }
    }
}
