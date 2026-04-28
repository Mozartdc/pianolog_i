import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 8) {
                Text("Home")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(AppPalette.homeTheme)
                    .frame(maxWidth: .infinity, alignment: .center)
                WeeklyCalendarModule(themeColor: AppPalette.homeTheme)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .padding(.top, 0)
            .padding(.horizontal, 16)
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(SelectedDateStore())
}
