import SwiftUI
import WidgetKit
import ActivityKit

// MARK: - PianoLog 통합 Live Activity Widget

@available(iOSApplicationExtension 16.1, *)
struct PianoLogLiveActivityWidget: Widget {

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PianoLogActivityAttributes.self) { context in
            PianoLogLockView(context: context)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    expandedLeadingIcon(context: context)
                        .padding(.leading, 6)
                }
                DynamicIslandExpandedRegion(.center) {
                    expandedCenter(context: context)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    EmptyView()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack(spacing: 4) {
                        Image(systemName: "pianokeys")
                            .font(.caption2)
                        Text("LogScore")
                            .font(.caption2.weight(.medium))
                    }
                    .foregroundStyle(.tertiary)
                }
            } compactLeading: {
                _CompactLeadingIcon()
            } compactTrailing: {
                compactTrailingText(context: context)
            } minimal: {
                _MinimalIcon()
            }
        }
    }

    // MARK: Compact Trailing

    @ViewBuilder
    private func compactTrailingText(
        context: ActivityViewContext<PianoLogActivityAttributes>
    ) -> some View {
        let s = context.state
        if s.isTimerActive {
            Text(Self.compactElapsed(s.elapsedSeconds))
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.orange)
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
        } else if s.isMetronomeRunning {
            Text("\(s.bpm)")
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.orange)
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
        }
    }

    // MARK: Expanded Leading

    @ViewBuilder
    private func expandedLeadingIcon(
        context: ActivityViewContext<PianoLogActivityAttributes>
    ) -> some View {
        let s = context.state
        if s.isTimerActive {
            Image(systemName: s.isTimerRunning ? "timer" : "timer.circle")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.orange)
        } else {
            Image(systemName: "metronome")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.orange)
        }
    }

    // MARK: Expanded Center

    @ViewBuilder
    private func expandedCenter(
        context: ActivityViewContext<PianoLogActivityAttributes>
    ) -> some View {
        let s = context.state
        if s.isTimerActive {
            VStack(spacing: 1) {
                Text(s.isTimerRunning
                     ? LocalizedStringKey("home.session.inprogress")
                     : LocalizedStringKey("home.session.paused"))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(s.isTimerRunning ? Color.primary : Color.secondary)

                Group {
                    if s.isTimerRunning {
                        Text(s.timerStart, style: .timer)
                    } else {
                        Text(Self.formattedElapsed(s.elapsedSeconds))
                    }
                }
                .font(.system(size: 30, weight: .bold, design: .monospaced))
                .foregroundStyle(.white)
                .monospacedDigit()
            }
        } else if s.isMetronomeRunning {
            VStack(spacing: 2) {
                Text("\(s.bpm) BPM")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(LocalizedStringKey("metronome.title"))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: Elapsed Formatters

    static func formattedElapsed(_ seconds: Double) -> String {
        let total = Int(max(0, seconds))
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 { return String(format: "%d:%02d:%02d", h, m, s) }
        return String(format: "%02d:%02d", m, s)
    }

    static func compactElapsed(_ seconds: Double) -> String {
        let total = Int(max(0, seconds))
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 { return String(format: "%d:%02d:%02d", h, m, s) }
        if m == 0 { return "\(s)초" }
        if s == 0 { return "\(m)분" }
        return "\(m):\(String(format: "%02d", s))"
    }

    // MARK: - 내장 아이콘 데이터 (번들 로딩 완전 우회)
    // bundle.url / UIImage(named:) 전부 WidgetKit 렌더링 프로세스에서 불안정.
    // 60px → compact/minimal @3x, 120px → 잠금화면 @3x
    // 원본 PNG를 미리 리사이즈한 뒤 Base64로 인코딩하여 소스에 직접 내장.

    private static let _lightSM = "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"
    private static let _darkSM  = "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"
    private static let _lightLG = "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"
    private static let _darkLG  = "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"

    private static func _decode(_ b64: String) -> Image? {
        guard let d = Data(base64Encoded: b64),
              let ui = UIImage(data: d) else { return nil }
        return Image(uiImage: ui.withRenderingMode(.alwaysOriginal))
    }

    /// Dynamic Island compact/minimal — light fallback
    static func lightIcon() -> Image {
        _decode(_lightSM) ?? Image(systemName: "pianokeys")
    }

    /// Dynamic Island compact/minimal — dark (투명 배경, 크림 심볼이 검정 DI 위에 크고 선명)
    static func darkIcon() -> Image {
        _decode(_darkSM) ?? _decode(_lightSM) ?? Image(systemName: "pianokeys")
    }

    /// 잠금화면 — colorScheme 반응
    static func appIcon(for colorScheme: ColorScheme) -> Image {
        if colorScheme == .dark {
            return _decode(_darkLG) ?? _decode(_lightLG) ?? Image(systemName: "pianokeys")
        }
        return _decode(_lightLG) ?? Image(systemName: "pianokeys")
    }
}

// MARK: - Compact Leading Icon

@available(iOSApplicationExtension 16.1, *)
private struct _CompactLeadingIcon: View {
    var body: some View {
        PianoLogLiveActivityWidget.darkIcon()
            .resizable()
            .scaledToFit()
    }
}

// MARK: - Minimal Icon

@available(iOSApplicationExtension 16.1, *)
private struct _MinimalIcon: View {
    var body: some View {
        PianoLogLiveActivityWidget.darkIcon()
            .resizable()
            .scaledToFit()
            .clipShape(Circle())
    }
}

// MARK: - 잠금화면 뷰

@available(iOSApplicationExtension 16.1, *)
private struct PianoLogLockView: View {
    let context: ActivityViewContext<PianoLogActivityAttributes>
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let s = context.state
        HStack(alignment: .center, spacing: 0) {

            HStack(alignment: .center, spacing: 10) {
                PianoLogLiveActivityWidget.appIcon(for: colorScheme)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 40, height: 40)
                    .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))

                VStack(alignment: .leading, spacing: 2) {
                    Text("LogScore")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.primary)
                    Text("Score Viewer & Practice Log")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
            }

            Spacer(minLength: 16)

            if s.isTimerActive {
                Group {
                    if s.isTimerRunning {
                        Text(s.timerStart, style: .timer)
                    } else {
                        Text(PianoLogLiveActivityWidget.formattedElapsed(s.elapsedSeconds))
                    }
                }
                .font(.system(size: 34, weight: .thin, design: .monospaced))
                .foregroundStyle(.orange)
                .monospacedDigit()
                .lineLimit(1)
            } else if s.isMetronomeRunning {
                Text("\(s.bpm) BPM")
                    .font(.system(size: 34, weight: .thin, design: .rounded))
                    .foregroundStyle(.orange)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
    }
}
