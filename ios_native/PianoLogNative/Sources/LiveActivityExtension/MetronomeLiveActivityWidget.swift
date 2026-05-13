import SwiftUI
import WidgetKit
import ActivityKit

@available(iOSApplicationExtension 16.1, *)
struct MetronomeLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MetronomeLiveActivityAttributes.self) { context in
            // Lock Screen / Banner
            HStack(spacing: 12) {
                LiveActivityAppIconView(size: 28)
                VStack(alignment: .leading, spacing: 4) {
                    Text("메트로놈")
                        .font(.headline)
                    Text("\(context.state.bpm) BPM · \(context.state.numerator)/\(context.state.denominator)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .activityBackgroundTint(.clear)
            .activitySystemActionForegroundColor(.primary)
        } dynamicIsland: { context in
            let island = DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    LiveActivityAppIconView(size: 20)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text("메트로놈")
                            .font(.headline)
                        Text("\(context.state.bpm) BPM")
                            .font(.subheadline)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.numerator)/\(context.state.denominator)")
                        .font(.headline.monospacedDigit())
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.isPlaying ? "재생 중" : "일시정지")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            } compactLeading: {
                LiveActivityAppIconView(size: 16)
            } compactTrailing: {
                Text("\(context.state.bpm)")
                    .font(.caption2.monospacedDigit())
            } minimal: {
                LiveActivityAppIconView(size: 14)
            }
            return island.keylineTint(.accentColor)
        }
    }
}

@available(iOSApplicationExtension 16.1, *)
private struct LiveActivityAppIconView: View {
    let size: CGFloat

    var body: some View {
        Image("LiveActivityAppIcon")
            .resizable()
            .scaledToFill()
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.22, style: .continuous))
    }
}
