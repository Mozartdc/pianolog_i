import SwiftUI

struct RootTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem { Image(systemName: "house") }
                .tag(0)

            TodayView()
                .tabItem { Image(systemName: "music.note.square.stack") }
                .tag(1)

            NavigationStack {
                TrackCounterView(trackId: nil)
            }
            .tabItem { Image(systemName: "plus.arrow.trianglehead.counterclockwise") }
            .tag(2)

            MetronomeView()
                .tabItem { Image(systemName: "metronome") }
                .tag(3)
        }
    }
}
