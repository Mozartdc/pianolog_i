import SwiftUI

struct RootTabView: View {
    private let tabIconPointSize: CGFloat = 12

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Image(systemName: "house")
                        .font(.system(size: tabIconPointSize, weight: .regular))
                }

            TodayView()
                .tabItem {
                    Image(systemName: "music.note.square.stack")
                        .font(.system(size: tabIconPointSize, weight: .regular))
                }

            MetronomeView()
                .tabItem {
                    Image(systemName: "metronome")
                        .font(.system(size: tabIconPointSize, weight: .regular))
                }
        }
    }
}
