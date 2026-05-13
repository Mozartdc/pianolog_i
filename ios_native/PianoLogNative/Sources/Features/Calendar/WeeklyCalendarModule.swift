import SwiftUI

struct WeeklyCalendarModule: View {
    let themeColor: Color
    @EnvironmentObject private var dateStore: SelectedDateStore
    @State private var isPickerPresented = false
    @Namespace private var selectionNamespace

    var body: some View {
        VStack(spacing: 10) {
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
            .frame(maxWidth: .infinity, alignment: .leading)

            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(weekStripDates, id: \.self) { date in
                            let isSelected = Calendar.current.isDate(date, inSameDayAs: dateStore.selectedDate)
                            let isToday = Calendar.current.isDateInToday(date)
                            Button {
                                AppHaptics.tap()
                                withAnimation(.snappy(duration: 0.22)) {
                                    dateStore.selectedDate = date
                                }
                            } label: {
                                VStack(spacing: 2) {
                                    Text(dayText(for: date))
                                        .font(.headline.weight(.semibold))
                                        .foregroundStyle(isSelected ? .white : .primary)
                                    Text(weekdayText(for: date))
                                        .font(.caption2.weight(.semibold))
                                        .foregroundStyle(isSelected ? .white.opacity(0.92) : .secondary)
                                }
                                .frame(width: 44, height: 56)
                                .background {
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .fill(backgroundColor(isToday: isToday, isSelected: isSelected))
                                }
                                .overlay {
                                    if isSelected {
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .stroke(themeColor.opacity(0.8), lineWidth: 1)
                                            .matchedGeometryEffect(id: "selected-week-chip", in: selectionNamespace)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                            .hoverEffect(.lift)
                            .id(dateID(date))
                        }
                    }
                    .padding(.horizontal, 2)
                }
                .onAppear {
                    proxy.scrollTo(dateID(dateStore.selectedDate), anchor: .center)
                }
                .onChange(of: dateStore.selectedDate) { newValue in
                    withAnimation(.snappy(duration: 0.22)) {
                        proxy.scrollTo(dateID(newValue), anchor: .center)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 4)
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

    private var weekStripDates: [Date] {
        let base = Calendar.current.startOfDay(for: dateStore.selectedDate)
        return (-30...30).compactMap { delta in
            Calendar.current.date(byAdding: .day, value: delta, to: base)
        }
    }

    private func backgroundColor(isToday: Bool, isSelected: Bool) -> Color {
        if isSelected {
            return themeColor
        }
        if isToday {
            return themeColor.opacity(0.22)
        }
        return Color(uiColor: .secondarySystemBackground)
    }

    private func dateID(_ date: Date) -> String {
        date.formatted(
            Date.FormatStyle()
                .year(.defaultDigits)
                .month(.twoDigits)
                .day(.twoDigits)
        )
    }

    private func dayText(for date: Date) -> String {
        date.formatted(Date.FormatStyle().day())
    }

    private func weekdayText(for date: Date) -> String {
        date.formatted(Date.FormatStyle().weekday(.abbreviated))
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
