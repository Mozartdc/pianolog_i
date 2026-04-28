import Foundation

@MainActor
final class SelectedDateStore: ObservableObject {
    @Published var selectedDate: Date = .now
}
