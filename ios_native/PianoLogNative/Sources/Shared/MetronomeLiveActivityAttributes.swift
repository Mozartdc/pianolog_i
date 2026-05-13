import Foundation
import ActivityKit

@available(iOS 16.1, *)
struct MetronomeLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var isPlaying: Bool
        var bpm: Int
        var numerator: Int
        var denominator: Int
        var updatedAt: Date
    }

    var sessionID: String
}
