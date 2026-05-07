import SwiftUI

struct WeeklyCalendarModule: View {
    let themeColor: Color
    @EnvironmentObject private var dateStore: SelectedDateStore
    @State private var isPickerPresented = false

    var body: some View {
        HStack(spacing: 10) {
            Button("오늘") {
                AppHaptics.tap()
                dateStore.selectedDate = .now
            }
            .buttonStyle(.borderedProminent)
            .tint(themeColor)
            .font(.callout.weight(.semibold))
            .hoverEffect(.lift)

            Button {
                AppHaptics.tap()
                isPickerPresented = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "calendar")
                        .symbolRenderingMode(.monochrome)
                    Text("\(dateText) \(weekdayText)")
                        .font(.callout.weight(.semibold))
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(themeColor)
            .hoverEffect(.lift)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.vertical, 6)
        .sheet(isPresented: $isPickerPresented) {
            NavigationStack {
                DatePicker(
                    "날짜 선택",
                    selection: Binding(
                        get: { dateStore.selectedDate },
                        set: { dateStore.selectedDate = $0 }
                    ),
                    displayedComponents: [.date]
                )
                .datePickerStyle(.graphical)
                .padding()
                .navigationTitle("날짜 선택")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("완료") {
                            AppHaptics.tap()
                            isPickerPresented = false
                        }
                    }
                }
            }
            .presentationDetents([.medium, .large])
        }
    }

    private var dateText: String {
        dateStore.selectedDate.formatted(
            Date.FormatStyle()
                .year()
                .month(.twoDigits)
                .day(.twoDigits)
        )
    }

    private var weekdayText: String {
        dateStore.selectedDate.formatted(
            Date.FormatStyle()
                .weekday(.abbreviated)
        )
    }
}

#Preview {
    WeeklyCalendarModule(themeColor: AppPalette.homeTheme)
        .environmentObject(SelectedDateStore())
        .padding()
}
