import SwiftUI
import UIKit

struct SystemPracticeCalendarView: UIViewRepresentable {
    let checkedDateKeys: Set<String>
    let onToggleDateKey: (String) -> Void

    final class ContainerView: UIView {
        let calendarView = UICalendarView()
    }

    func makeCoordinator() -> PracticeCalendarCoordinator {
        PracticeCalendarCoordinator(onToggleDateKey: onToggleDateKey)
    }

    func makeUIView(context: Context) -> ContainerView {
        let container = ContainerView()
        let calendarView = container.calendarView
        calendarView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(calendarView)
        NSLayoutConstraint.activate([
            calendarView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            calendarView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            calendarView.topAnchor.constraint(equalTo: container.topAnchor),
            calendarView.bottomAnchor.constraint(equalTo: container.bottomAnchor)
        ])

        calendarView.calendar = Calendar(identifier: .gregorian)
        calendarView.locale = Locale.current
        calendarView.timeZone = .current
        let start = Calendar(identifier: .gregorian).date(from: DateComponents(year: 2000, month: 1, day: 1)) ?? .distantPast
        calendarView.availableDateRange = DateInterval(start: start, end: Date.now)

        let selection = UICalendarSelectionMultiDate(delegate: context.coordinator)
        calendarView.selectionBehavior = selection

        context.coordinator.selection = selection
        context.coordinator.apply(checkedDateKeys: checkedDateKeys)

        return container
    }

    func updateUIView(_ uiView: ContainerView, context: Context) {
        uiView.calendarView.locale = Locale.current
        uiView.calendarView.timeZone = .current
        context.coordinator.apply(checkedDateKeys: checkedDateKeys)
    }
}

final class PracticeCalendarCoordinator: NSObject, UICalendarSelectionMultiDateDelegate {
    var selection: UICalendarSelectionMultiDate?

    private let onToggleDateKey: (String) -> Void
    private var isApplyingProgrammaticSelection = false
    private var appliedDateKeys: Set<String> = []

    init(onToggleDateKey: @escaping (String) -> Void) {
        self.onToggleDateKey = onToggleDateKey
    }

    func apply(checkedDateKeys: Set<String>) {
        guard let selection else { return }
        guard checkedDateKeys != appliedDateKeys else { return }

        let targetComponents = checkedDateKeys.compactMap { dateComponents(from: $0) }
        isApplyingProgrammaticSelection = true
        selection.setSelectedDates(targetComponents, animated: false)
        isApplyingProgrammaticSelection = false
        appliedDateKeys = checkedDateKeys
    }

    func multiDateSelection(_ selection: UICalendarSelectionMultiDate, canSelectDate dateComponents: DateComponents) -> Bool {
        guard let date = Calendar(identifier: .gregorian).date(from: dateComponents) else { return false }
        return date <= Date.now
    }

    func multiDateSelection(_ selection: UICalendarSelectionMultiDate, canDeselectDate dateComponents: DateComponents) -> Bool {
        true
    }

    func multiDateSelection(_ selection: UICalendarSelectionMultiDate, didSelectDate dateComponents: DateComponents) {
        guard !isApplyingProgrammaticSelection else { return }
        guard let key = dateKey(from: dateComponents) else { return }
        onToggleDateKey(key)
    }

    func multiDateSelection(_ selection: UICalendarSelectionMultiDate, didDeselectDate dateComponents: DateComponents) {
        guard !isApplyingProgrammaticSelection else { return }
        guard let key = dateKey(from: dateComponents) else { return }
        onToggleDateKey(key)
    }

    private func dateKey(from components: DateComponents) -> String? {
        guard let date = Calendar(identifier: .gregorian).date(from: components) else { return nil }
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    private func dateComponents(from key: String) -> DateComponents? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: key) else { return nil }
        return Calendar(identifier: .gregorian).dateComponents([.year, .month, .day], from: date)
    }
}
