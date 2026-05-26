import SwiftUI
import UIKit

struct TrackCounterView: View {
    @EnvironmentObject private var tracksStore: PracticeTracksStore

    let trackId: Int?

    private var today: Date { .now }

    private var titleText: String {
        if let track = selectedTrack {
            return track.title
        }
        return String(localized: "counter.title.general")
    }

    private var selectedTrack: PracticeTrack? {
        guard let trackId else { return nil }
        return tracksStore.tracks.first(where: { $0.id == trackId })
    }

    private var count: Int {
        if let trackId {
            return tracksStore.partialCount(date: today, trackId: trackId)
        }
        return tracksStore.generalPracticeCount(date: today)
    }

    var body: some View {
        ZStack {
            Color(uiColor: .systemBackground)
                .ignoresSafeArea()

            Color.black.opacity(0.001)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .accessibilityLabel(Text("counter.accessibility.increment"))
            .onTapGesture {
                AppHaptics.tap()
                handlePlus()
            }
            .zIndex(0)

            VStack(spacing: 0) {
                Spacer(minLength: 0)

                VStack(spacing: 14) {
                    HStack(spacing: 8) {
                        Image(systemName: "apple.logo")
                            .font(.system(size: 20, weight: .regular))
                            .foregroundStyle(.primary)
                        Text(titleText)
                            .font(.headline.weight(.regular))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .padding(.horizontal, 24)

                    Text("counter.practice.label")
                        .font(.title3)
                        .foregroundStyle(.secondary)

                    Text("\(count)")
                        .font(.system(size: 116, weight: .semibold, design: .default))
                        .monospacedDigit()
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                }
                .padding(.top, 24)
                .padding(.bottom, 24)
                .frame(maxWidth: .infinity)

                Spacer(minLength: 0)
            }
            .allowsHitTesting(false)
            .zIndex(1)

            VStack(spacing: 0) {
                Spacer(minLength: 0)
                HStack(spacing: 120) {
                    Button {
                        AppHaptics.tap()
                        handleReset()
                    } label: {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.system(size: 24, weight: .regular))
                            .foregroundStyle(.primary)
                            .frame(width: 56, height: 56)
                    }
                    .buttonStyle(.plain)
                    .contentShape(Circle())
                    .hoverEffect(.lift)

                    Button {
                        AppHaptics.tap()
                        handleMinus()
                    } label: {
                        Image(systemName: "arrow.down")
                            .font(.system(size: 24, weight: .regular))
                            .foregroundStyle(.primary)
                            .frame(width: 56, height: 56)
                    }
                    .buttonStyle(.plain)
                    .contentShape(Circle())
                    .hoverEffect(.lift)
                }
                .padding(.bottom, max(70, safeBottomInset + 36))
            }
            .zIndex(2)
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private var safeBottomInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .safeAreaInsets.bottom ?? 0
    }

    private func handlePlus() {
        if let trackId {
            let currentCount = tracksStore.partialCount(date: today, trackId: trackId)
            let isChecked = tracksStore.isChecked(date: today, trackId: trackId)
            if currentCount == 0, !isChecked {
                tracksStore.toggleCheck(date: today, trackId: trackId)
            }
            tracksStore.incrementPartial(date: today, trackId: trackId)
            return
        }
        tracksStore.incrementGeneralPractice(date: today)
    }

    private func handleMinus() {
        if let trackId {
            tracksStore.decrementPartial(date: today, trackId: trackId)
            return
        }
        tracksStore.decrementGeneralPractice(date: today)
    }

    private func handleReset() {
        if let trackId {
            tracksStore.resetPartial(date: today, trackId: trackId)
            return
        }
        tracksStore.resetGeneralPractice(date: today)
    }
}

#Preview {
    TrackCounterView(trackId: nil)
        .environmentObject(PracticeTracksStore())
}
