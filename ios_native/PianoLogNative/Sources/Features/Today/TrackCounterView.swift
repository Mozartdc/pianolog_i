import SwiftUI

struct TrackCounterView: View {
    @EnvironmentObject private var tracksStore: PracticeTracksStore

    let track: PracticeTrack
    let selectedDate: Date

    var body: some View {
        VStack(spacing: 20) {
            Text(track.title)
                .font(.title3.weight(.semibold))
                .multilineTextAlignment(.center)
                .padding(.top, 20)

            Text("\(tracksStore.partialCount(date: selectedDate, trackId: track.id))")
                .font(.system(size: 68, weight: .bold, design: .rounded))
                .monospacedDigit()
                .frame(minWidth: 180)

            HStack(spacing: 18) {
                Button {
                    tracksStore.decrementPartial(date: selectedDate, trackId: track.id)
                } label: {
                    Label("감소", systemImage: "minus.circle.fill")
                        .labelStyle(.iconOnly)
                        .font(.system(size: 44))
                }
                .buttonStyle(.plain)
                .tint(.primary)
                .hoverEffect(.lift)

                Button {
                    tracksStore.incrementPartial(date: selectedDate, trackId: track.id)
                } label: {
                    Label("증가", systemImage: "plus.circle.fill")
                        .labelStyle(.iconOnly)
                        .font(.system(size: 44))
                }
                .buttonStyle(.plain)
                .tint(.primary)
                .hoverEffect(.lift)
            }

            Spacer()
        }
        .padding(.horizontal, 24)
        .navigationTitle("카운터")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        TrackCounterView(
            track: PracticeTrack(id: 1, title: "예시 곡", addedDate: "2026-04-24", completedDate: nil),
            selectedDate: .now
        )
        .environmentObject(PracticeTracksStore())
    }
}
