import Foundation
import SwiftUI

struct PracticeTrack: Identifiable, Hashable, Codable {
    let id: Int
    var title: String
    var addedDate: String
    var completedDate: String?
}

@MainActor
final class PracticeTracksStore: ObservableObject {
    @Published private(set) var tracks: [PracticeTrack] = []
    @Published private(set) var practiceChecks: [String: [Int: Bool]] = [:]
    @Published private(set) var partialCounts: [String: [Int: Int]] = [:]
    @Published private(set) var generalPracticeCounts: [String: Int] = [:]

    private let tracksKey = "tracks"
    private let checksKey = "practiceChecks"
    private let partialCountsKey = "partialCounts"
    private let generalPracticeCountsKey = "generalPracticeCounts"
    private let defaults = UserDefaults.standard

    private let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    init() {
        load()
    }

    func tracks(for selectedDate: Date) -> [PracticeTrack] {
        let selected = dateKey(for: selectedDate)
        let checksForDate = practiceChecks[selected]
        return tracks.filter { track in
            let addedBeforeOrOn = track.addedDate <= selected
            let notCompletedOrCompletedAfter = track.completedDate == nil || (track.completedDate ?? selected) >= selected
            let hasPracticeOnDate = checksForDate?[track.id] ?? false
            return (addedBeforeOrOn && notCompletedOrCompletedAfter) || hasPracticeOnDate
        }
    }

    func addTrack(title: String) {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let today = dateKey(for: .now)
        let newTrack = PracticeTrack(
            id: Int(Date().timeIntervalSince1970 * 1000),
            title: trimmed,
            addedDate: today,
            completedDate: nil
        )
        tracks.append(newTrack)
        saveTracks()
    }

    func removeTrack(id: Int) {
        tracks.removeAll { $0.id == id }
        for key in practiceChecks.keys {
            practiceChecks[key]?[id] = nil
        }
        for key in partialCounts.keys {
            partialCounts[key]?[id] = nil
        }
        saveTracks()
        saveChecks()
        savePartialCounts()
    }

    func updateTrackTitle(id: Int, title: String) {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        guard let index = tracks.firstIndex(where: { $0.id == id }) else { return }
        tracks[index].title = trimmed
        saveTracks()
    }

    func markTrackComplete(id: Int, on date: Date = .now) {
        guard let index = tracks.firstIndex(where: { $0.id == id }) else { return }
        tracks[index].completedDate = dateKey(for: date)
        saveTracks()
    }

    func unmarkTrackComplete(id: Int) {
        guard let index = tracks.firstIndex(where: { $0.id == id }) else { return }
        tracks[index].completedDate = nil
        saveTracks()
    }

    func toggleCheck(date: Date, trackId: Int) {
        let key = dateKey(for: date)
        var dayChecks = practiceChecks[key] ?? [:]
        dayChecks[trackId] = !(dayChecks[trackId] ?? false)
        practiceChecks[key] = dayChecks
        saveChecks()
    }

    func isChecked(date: Date, trackId: Int) -> Bool {
        let key = dateKey(for: date)
        return practiceChecks[key]?[trackId] ?? false
    }

    func partialCount(date: Date, trackId: Int) -> Int {
        let key = dateKey(for: date)
        return partialCounts[key]?[trackId] ?? 0
    }

    func incrementPartial(date: Date, trackId: Int) {
        let key = dateKey(for: date)
        var allCounts = partialCounts
        var dayCounts = allCounts[key] ?? [:]
        dayCounts[trackId] = (dayCounts[trackId] ?? 0) + 1
        allCounts[key] = dayCounts
        partialCounts = allCounts
        savePartialCounts()
    }

    func decrementPartial(date: Date, trackId: Int) {
        let key = dateKey(for: date)
        var allCounts = partialCounts
        var dayCounts = allCounts[key] ?? [:]
        dayCounts[trackId] = max((dayCounts[trackId] ?? 0) - 1, 0)
        allCounts[key] = dayCounts
        partialCounts = allCounts
        savePartialCounts()
    }

    func resetPartial(date: Date, trackId: Int) {
        let key = dateKey(for: date)
        var allCounts = partialCounts
        var dayCounts = allCounts[key] ?? [:]
        dayCounts[trackId] = 0
        allCounts[key] = dayCounts
        partialCounts = allCounts
        savePartialCounts()
    }

    func generalPracticeCount(date: Date) -> Int {
        let key = dateKey(for: date)
        return generalPracticeCounts[key] ?? 0
    }

    func incrementGeneralPractice(date: Date) {
        let key = dateKey(for: date)
        var allCounts = generalPracticeCounts
        allCounts[key] = (allCounts[key] ?? 0) + 1
        generalPracticeCounts = allCounts
        saveGeneralPracticeCounts()
    }

    func decrementGeneralPractice(date: Date) {
        let key = dateKey(for: date)
        var allCounts = generalPracticeCounts
        allCounts[key] = max((allCounts[key] ?? 0) - 1, 0)
        generalPracticeCounts = allCounts
        saveGeneralPracticeCounts()
    }

    func resetGeneralPractice(date: Date) {
        let key = dateKey(for: date)
        var allCounts = generalPracticeCounts
        allCounts[key] = 0
        generalPracticeCounts = allCounts
        saveGeneralPracticeCounts()
    }

    func subtitle(for track: PracticeTrack, selectedDate: Date) -> String {
        let selectedDay = dateKey(for: selectedDate)
        guard let added = dayFormatter.date(from: track.addedDate),
              let selected = dayFormatter.date(from: selectedDay) else {
            return String(localized: "track.practice.record.fallback")
        }
        let days = Calendar(identifier: .gregorian).dateComponents([.day], from: added, to: selected).day ?? 0
        return String(
            format: String(localized: "track.days.since.today.format"),
            max(days + 1, 1)
        )
    }

    func totalPracticeDays(trackId: Int) -> Int {
        practiceChecks.values.reduce(0) { partial, dayChecks in
            partial + ((dayChecks[trackId] ?? false) ? 1 : 0)
        }
    }

    func latestPracticeDate(trackId: Int) -> String? {
        let practicedDates = practiceChecks.compactMap { (date, dayChecks) in
            (dayChecks[trackId] ?? false) ? date : nil
        }
        return practicedDates.sorted().last
    }

    func checkedDateKeys(trackId: Int) -> Set<String> {
        Set(
            practiceChecks.compactMap { (date, dayChecks) in
                (dayChecks[trackId] ?? false) ? date : nil
            }
        )
    }

    func hasChecked(trackId: Int, on dateKey: String) -> Bool {
        practiceChecks[dateKey]?[trackId] ?? false
    }

    func exportSnapshot() -> PracticeTracksSnapshot {
        PracticeTracksSnapshot(
            tracks: tracks,
            practiceChecks: practiceChecks,
            partialCounts: partialCounts,
            generalPracticeCounts: generalPracticeCounts
        )
    }

    func importSnapshot(_ snapshot: PracticeTracksSnapshot) {
        tracks = snapshot.tracks
        practiceChecks = snapshot.practiceChecks
        partialCounts = snapshot.partialCounts
        generalPracticeCounts = snapshot.generalPracticeCounts
        saveTracks()
        saveChecks()
        savePartialCounts()
        saveGeneralPracticeCounts()
    }

    func toggleCheck(dateKey: String, trackId: Int) {
        var dayChecks = practiceChecks[dateKey] ?? [:]
        dayChecks[trackId] = !(dayChecks[trackId] ?? false)
        practiceChecks[dateKey] = dayChecks
        if dayChecks[trackId] == true {
            ensureTrackAddedDateNotLater(than: dateKey, trackId: trackId)
        }
        saveChecks()
    }

    private func ensureTrackAddedDateNotLater(than dateKey: String, trackId: Int) {
        guard let index = tracks.firstIndex(where: { $0.id == trackId }) else { return }
        if tracks[index].addedDate > dateKey {
            tracks[index].addedDate = dateKey
            saveTracks()
        }
    }

    private func dateKey(for date: Date) -> String {
        dayFormatter.string(from: date)
    }

    private func load() {
        if let tracksData = defaults.data(forKey: tracksKey),
           let decoded = try? JSONDecoder().decode([PracticeTrack].self, from: tracksData) {
            tracks = decoded
        }
        if let checksData = defaults.data(forKey: checksKey),
           let decoded = try? JSONDecoder().decode([String: [Int: Bool]].self, from: checksData) {
            practiceChecks = decoded
        }
        if let countsData = defaults.data(forKey: partialCountsKey),
           let decoded = try? JSONDecoder().decode([String: [Int: Int]].self, from: countsData) {
            partialCounts = decoded
        }
        if let countsData = defaults.data(forKey: generalPracticeCountsKey),
           let decoded = try? JSONDecoder().decode([String: Int].self, from: countsData) {
            generalPracticeCounts = decoded
        }
    }

    private func saveTracks() {
        if let encoded = try? JSONEncoder().encode(tracks) {
            defaults.set(encoded, forKey: tracksKey)
        }
    }

    private func saveChecks() {
        if let encoded = try? JSONEncoder().encode(practiceChecks) {
            defaults.set(encoded, forKey: checksKey)
        }
    }

    private func savePartialCounts() {
        if let encoded = try? JSONEncoder().encode(partialCounts) {
            defaults.set(encoded, forKey: partialCountsKey)
        }
    }

    private func saveGeneralPracticeCounts() {
        if let encoded = try? JSONEncoder().encode(generalPracticeCounts) {
            defaults.set(encoded, forKey: generalPracticeCountsKey)
        }
    }
}

struct PracticeTracksSnapshot: Codable {
    let tracks: [PracticeTrack]
    let practiceChecks: [String: [Int: Bool]]
    let partialCounts: [String: [Int: Int]]
    let generalPracticeCounts: [String: Int]
}
