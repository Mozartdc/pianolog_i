import Foundation
import ActivityKit

/// PianoLog 앱 전체에서 단 하나만 존재하는 Live Activity 타입.
/// 타이머와 메트로놈 상태를 하나의 ContentState에 담아 관리한다.
/// 새 Live Activity를 생성하지 않고 state 업데이트만으로 표시 내용을 전환한다.
@available(iOS 16.1, *)
struct PianoLogActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        // ── 타이머 ──
        /// 타이머 세션이 존재하는지 (일시정지 중에도 true)
        var isTimerActive: Bool
        /// 실제로 카운트 중인지 (일시정지 시 false)
        var isTimerRunning: Bool
        /// 실행 중일 때: Date() - elapsedSeconds → Text(.timer) 카운트업
        var timerStart: Date
        /// 일시정지 시 정적으로 표시할 경과 초
        var elapsedSeconds: Double

        // ── 메트로놈 ──
        var isMetronomeRunning: Bool
        var bpm: Int
    }

    var sessionId: String
}

extension Notification.Name {
    /// MetronomeViewModel → PracticeDataStore 단방향 알림.
    /// userInfo: ["isRunning": Bool, "bpm": Int]
    static let metronomeStateDidChange = Notification.Name("metronomeStateDidChange")
}
