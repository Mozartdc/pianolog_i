import SwiftUI
import UIKit
import Charts

struct HomeView: View {
    @EnvironmentObject private var dateStore: SelectedDateStore
    @EnvironmentObject private var tracksStore: PracticeTracksStore
    @EnvironmentObject private var practiceDataStore: PracticeDataStore

    @AppStorage("nickname") private var nickname = String(localized: "settings.nickname.default")
    @AppStorage("avatar") private var avatarPath = ""
    @State private var editStartDate: Date = .now
    @State private var editEndDate: Date = .now
    @State private var isEditSheetPresented = false
    @State private var isCompleteSheetPresented = false
    @State private var completeMemo = ""
    @State private var isSettingsSheetPresented = false
    @State private var shareCandidateRecords: [PracticeRecord] = []
    @State private var isSharePickerPresented = false
    @State private var detailTab: DetailTab = .records
    @State private var weekChartMode: WeekChartMode = .time
    @State private var trendMode: TrendMode = .month

    private enum DetailTab: String, CaseIterable {
        case records = "이날 기록"
        case stats   = "통계"
    }
    private enum WeekChartMode: String, CaseIterable {
        case time   = "시간"
        case tracks = "연습곡"
    }
    private enum TrendMode: String, CaseIterable {
        case month = "월간"
        case year  = "연간"
    }
    @State private var calendarDetailDate: Date = .now
    @State private var isCalendarSheetPresented = false
    @State private var expandedRecordID: String?
    @State private var editingTimeRecord: PracticeRecord?
    @State private var editingMemoRecord: PracticeRecord?
    @State private var deletingRecord: PracticeRecord?
    @State private var editedStartDate: Date = .now
    @State private var editedEndDate: Date = .now
    @State private var editedMemo: String = ""

    @ScaledMetric(relativeTo: .body) private var sectionSpacing: CGFloat = 20
    @ScaledMetric(relativeTo: .body) private var horizontalPadding: CGFloat = 16
    @ScaledMetric(relativeTo: .body) private var cardPadding: CGFloat = 12
    @ScaledMetric(relativeTo: .body) private var avatarSize: CGFloat = 44
    @ScaledMetric(relativeTo: .title) private var playIconSize: CGFloat = 76
    @ScaledMetric(relativeTo: .body) private var heatmapCellSize: CGFloat = 8
    @ScaledMetric(relativeTo: .title3) private var chartHeight: CGFloat = 145
    @ScaledMetric(relativeTo: .title3) private var trendChartHeight: CGFloat = 160

    private let calendar = Calendar(identifier: .gregorian)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: sectionSpacing) {
                    if let event = todayMusicEvent {
                        MusicEventCard(event: event)
                    }
                    homeHeader
                    heatmapSection
                        .groupBoxStyle(AppCardGroupBoxStyle())
                    startPracticeSection
                }
                .padding(.horizontal, horizontalPadding)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                practiceDataStore.restoreLiveActivityIfNeeded()
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        AppHaptics.tap()
                        dateStore.selectedDate = .now
                    } label: {
                        Image(systemName: "arrow.counterclockwise.circle")
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(isTodaySelected ? .tertiary : .primary)
                    .disabled(isTodaySelected)
                    .hoverEffect(.lift)
                }
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Button {
                            AppHaptics.tap()
                            shiftSelectedDate(by: -1)
                        } label: {
                            Image(systemName: "chevron.left")
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.primary)
                        .hoverEffect(.lift)

                        Text(selectedDateText)
                            .font(.callout.weight(.semibold))
                            .monospacedDigit()
                            .frame(width: 170, alignment: .center)

                        Button {
                            AppHaptics.tap()
                            shiftSelectedDate(by: 1)
                        } label: {
                            Image(systemName: "chevron.right")
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.primary)
                        .hoverEffect(.lift)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        AppHaptics.tap()
                        isSettingsSheetPresented = true
                    } label: {
                        Image(systemName: "ellipsis")
                    }
                    .hoverEffect(.lift)
                    .accessibilityLabel(Text("settings.title"))
                }
            }
            .sheet(isPresented: $isEditSheetPresented) {
                editTimeSheet
            }
            .sheet(isPresented: $isSettingsSheetPresented) {
                HomeSettingsSheet()
                    .presentationDetents([.large])
                    .presentationDragIndicator(.visible)
            }
            .sheet(isPresented: $isSharePickerPresented) {
                sharePickerSheet
            }
            .sheet(isPresented: $isCalendarSheetPresented) {
                calendarDetailSheet
            }
            .sheet(item: $editingTimeRecord) { record in
                calendarEditTimeSheet(record: record)
            }
            .sheet(item: $editingMemoRecord) { record in
                calendarEditMemoSheet(record: record)
            }
            .confirmationDialog(
                "stats.session.delete.title",
                isPresented: Binding(
                    get: { deletingRecord != nil },
                    set: { if !$0 { deletingRecord = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("common.delete", role: .destructive) {
                    guard let record = deletingRecord else { return }
                    AppHaptics.tap()
                    practiceDataStore.deleteRecord(id: record.id)
                    if expandedRecordID == record.id { expandedRecordID = nil }
                    deletingRecord = nil
                }
                Button("common.cancel", role: .cancel) { AppHaptics.tap() }
            } message: {
                Text("stats.session.delete.message")
            }
            .sheet(isPresented: $isCompleteSheetPresented) {
                completeSessionSheet
            }
        }
    }

    private var homeHeader: some View {
        // Apple HIG: 카드 간 spacing 12pt
        let gap: CGFloat = 12
        return GeometryReader { geo in
            let cellW = (geo.size.width - gap) / 2
            // cardH × 2 + gap = cellW → 아바타(정사각)와 높이 일치
            let cardH = (cellW - gap) / 2

            VStack(spacing: gap) {
                // ── Row 1+2: 아바타(정사각) | 현재연속기록 / 최고연속기록 ──
                HStack(alignment: .top, spacing: gap) {
                    avatarDashCard(size: CGSize(width: cellW, height: cellW))

                    VStack(spacing: gap) {
                        dashStatCard(
                            icon: "flame.fill",
                            label: String(localized: "home.stat.current.streak")
                        ) {
                            streakValue(currentStreak)
                        }
                        .frame(width: cellW, height: cardH)

                        dashStatCard(
                            icon: "trophy.fill",
                            label: String(localized: "home.stat.best.streak")
                        ) {
                            streakValue(bestStreak)
                        }
                        .frame(width: cellW, height: cardH)
                    }
                }

                // ── Row 3: 오늘 기록 | 누적시간 ──
                HStack(spacing: gap) {
                    dashStatCard(
                        icon: "clock.fill",
                        label: String(localized: "home.stat.today.time")
                    ) {
                        timeValue(selectedDateMinutes)
                    }
                    .frame(width: cellW, height: cardH)
                    .overlay(alignment: .topTrailing) {
                        Button {
                            AppHaptics.tap()
                            handleShareButtonTap()
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(
                                    selectedDateMinutes > 0
                                        ? AppPalette.homeTheme
                                        : Color(uiColor: .tertiaryLabel)
                                )
                        }
                        .buttonStyle(.plain)
                        .disabled(selectedDateMinutes <= 0)
                        .hoverEffect(.lift)
                        .padding(12)
                    }

                    dashStatCard(
                        icon: "chart.bar.fill",
                        label: String(localized: "home.stat.total.time")
                    ) {
                        timeValue(totalMinutes)
                    }
                    .frame(width: cellW, height: cardH)
                }
            }
        }
        .frame(height: {
            let screenW = UIScreen.main.bounds.width
            let outerPad: CGFloat = horizontalPadding * 2
            let cellW = (screenW - outerPad - gap) / 2
            let cardH = (cellW - gap) / 2
            return cellW + gap + cardH   // 아바타 행 + gap + 하단 행
        }())
    }

    // MARK: - Header Grid Helpers

    private func avatarDashCard(size: CGSize) -> some View {
        // 바탕 없음 — Apple 위젯 가이드라인: 투명 배경
        // 가장 큰 원형 이미지 + 닉네임 아래 배치, 둘 다 가로 중앙 정렬
        VStack(spacing: 6) {
            let circleDiameter = size.width * 0.70
            Group {
                if let image = loadAvatarImage() {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    ZStack {
                        AppPalette.homeTheme.opacity(0.15)
                        Image(systemName: "person.fill")
                            .font(.system(size: circleDiameter * 0.40, weight: .light))
                            .foregroundStyle(AppPalette.homeTheme.opacity(0.7))
                    }
                }
            }
            .frame(width: circleDiameter, height: circleDiameter)
            .clipShape(Circle())

            Text(nickname)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(width: size.width, height: size.height)
    }

    /// 정원 아이콘 버튼 — Circle() 배경으로 직접 그려 iOS 16 호환
    @ViewBuilder
    private func circleButton(icon: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 44, height: 44)
                .background(tint.opacity(0.12), in: Circle())
        }
        .buttonStyle(.plain)
        .hoverEffect(.lift)
    }

    @ViewBuilder
    private func dashStatCard<Content: View>(
        icon: String,
        label: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        // Apple 위젯 가이드라인 레이아웃: 레이블+아이콘 상단 좌측, 값 하단 좌측
        // Apple 위젯 가이드라인:
        //   상단 좌측 — 레이블+아이콘 (14pt semibold)
        //   하단 우측 — 주요 값 (크고 얇게, trailing 정렬)
        VStack(alignment: .leading, spacing: 0) {
            Label {
                Text(label)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            } icon: {
                Image(systemName: icon)
                    .foregroundStyle(AppPalette.homeTheme)
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(.primary)
            .labelStyle(.titleAndIcon)

            Spacer(minLength: 0)

            content()
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Color(.separator).opacity(0.6), lineWidth: 0.5)
        )
    }

    @ViewBuilder
    private func streakValue(_ days: Int) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(days > 0 ? "\(days)" : "—")
                .font(.system(size: 32, weight: .thin, design: .rounded))
                .foregroundStyle(days > 0 ? Color.primary : Color(uiColor: .tertiaryLabel))
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            if days > 0 {
                Text(String(localized: "stats.day.unit"))
                    .font(.system(size: 15, weight: .regular))
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private func timeValue(_ minutes: Int) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(compactTimeValue(minutes))
                .font(.system(size: 32, weight: .thin, design: .rounded))
                .foregroundStyle(minutes > 0 ? Color.primary : Color(uiColor: .tertiaryLabel))
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            let unit = compactTimeUnit(minutes)
            if !unit.isEmpty {
                Text(unit)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundStyle(.secondary)
            }
        }
    }

    // "30" + "m" / "2" + "h" — 4칸에 넘치지 않는 compact 포맷
    private func compactTimeValue(_ minutes: Int) -> String {
        let m = max(0, minutes)
        guard m > 0 else { return "—" }
        let h = m / 60
        return h == 0 ? "\(m)" : "\(h)"
    }

    private func compactTimeUnit(_ minutes: Int) -> String {
        let m = max(0, minutes)
        guard m > 0 else { return "" }
        return (m / 60) == 0 ? "m" : "h"
    }

    private var todayMusicEvent: MusicEvent? {
        Self.musicEvents[monthDayKey(for: dateStore.selectedDate)]
    }

    // swiftlint:disable closure_body_length
    private static let musicEvents: [String: MusicEvent] = {
        typealias E = MusicEvent
        return [
            // MARK: Special
            "01-01": E(icon: "sparkles",        text: "새해 첫날 — 새로운 목표와 함께 피아노 연습을 시작해보세요", kind: .special),
            "06-21": E(icon: "music.note.list", text: "세계 음악의 날 (Fête de la Musique) — 음악으로 세상과 연결되는 날", kind: .special),
            "12-25": E(icon: "snowflake",       text: "크리스마스 — 바흐, 헨델, 슈베르트 모두 이 계절을 음악으로 채웠습니다", kind: .special),
            // MARK: Birthdays
            "01-06": E(icon: "gift", text: "알렉산드르 스크랴빈 탄생일 (1872) — 후기 낭만주의 피아노 음악의 개척자", kind: .birthday),
            "01-27": E(icon: "gift", text: "볼프강 아마데우스 모차르트 탄생일 (1756) — 불세출의 천재가 이 세상에 왔습니다", kind: .birthday),
            "01-31": E(icon: "gift", text: "프란츠 슈베르트 탄생일 (1797) — 즉흥곡과 소나타로 피아노의 서정미를 펼쳤습니다", kind: .birthday),
            "02-03": E(icon: "gift", text: "펠릭스 멘델스존 탄생일 (1809) — 무언가와 협주곡으로 낭만의 서정을 노래했습니다", kind: .birthday),
            "02-23": E(icon: "gift", text: "게오르크 프리드리히 헨델 탄생일 (1685) — 바로크를 대표하는 건반의 거장", kind: .birthday),
            "03-01": E(icon: "gift", text: "프레데리크 쇼팽 탄생일 (1810) — 피아노의 시인, 폴란드의 혼이 이 세상에 왔습니다", kind: .birthday),
            "03-07": E(icon: "gift", text: "모리스 라벨 탄생일 (1875) — 거울, 밤의 가스파르 등 피아노 음악의 새 지평을 열었습니다", kind: .birthday),
            "03-21": E(icon: "gift", text: "요한 제바스티안 바흐 탄생일 (1685) — 평균율 클라비어곡집, 모든 건반 음악의 아버지", kind: .birthday),
            "03-25": E(icon: "gift", text: "벨라 바르토크 탄생일 (1881) — 드뷔시 기일 (1918)이기도 한 날, 두 거장이 교차합니다", kind: .birthday),
            "03-31": E(icon: "gift", text: "프란츠 요제프 하이든 탄생일 (1732) — 고전주의 소나타 형식을 정립한 음악의 아버지", kind: .birthday),
            "04-01": E(icon: "gift", text: "세르게이 라흐마니노프 탄생일 (1873) — 러시아 낭만주의 피아니즘의 정수", kind: .birthday),
            "04-23": E(icon: "gift", text: "세르게이 프로코피예프 탄생일 (1891) — 20세기 피아노 음악에 신선한 충격을 준 작곡가", kind: .birthday),
            "05-07": E(icon: "gift", text: "브람스 (1833)와 차이코프스키 (1840) 탄생일 — 낭만주의를 빛낸 두 거장이 같은 날 태어났습니다", kind: .birthday),
            "05-12": E(icon: "gift", text: "가브리엘 포레 탄생일 (1845) — 야상곡과 즉흥곡으로 피아노의 황혼을 그린 작곡가", kind: .birthday),
            "05-17": E(icon: "gift", text: "에릭 사티 탄생일 (1866) — 짐노페디로 미니멀리즘 피아노의 문을 연 선구자", kind: .birthday),
            "06-08": E(icon: "gift", text: "로베르트 슈만 탄생일 (1810) — 어린이 정경, 크라이슬레리아나로 낭만 피아노를 완성했습니다", kind: .birthday),
            "06-15": E(icon: "gift", text: "에드바르 그리그 탄생일 (1843) — 피아노 협주곡과 서정소품집으로 북유럽 음악을 대표합니다", kind: .birthday),
            "08-22": E(icon: "gift", text: "클로드 드뷔시 탄생일 (1862) — 달빛, 어린이 세계 등 인상주의 피아노 음악의 창시자", kind: .birthday),
            "09-13": E(icon: "gift", text: "클라라 슈만 탄생일 (1819) — 낭만시대 최고의 피아니스트이자 작곡가", kind: .birthday),
            "09-25": E(icon: "gift", text: "드미트리 쇼스타코비치 탄생일 (1906) — 24개의 전주곡과 푸가로 바흐의 전통을 계승했습니다", kind: .birthday),
            "10-09": E(icon: "gift", text: "카미유 생상스 탄생일 (1835) — 5개의 피아노 협주곡으로 프랑스 음악을 이끈 거장", kind: .birthday),
            "10-22": E(icon: "gift", text: "프란츠 리스트 탄생일 (1811) — 피아노 기교의 절정, 음악의 파가니니", kind: .birthday),
            "10-26": E(icon: "gift", text: "도메니코 스카를라티 탄생일 (1685) — 하프시코드 소나타 555곡으로 건반 음악을 혁신했습니다", kind: .birthday),
            "12-17": E(icon: "gift", text: "루트비히 판 베토벤 탄생일 (1770) — 월광, 열정, 함머클라비어 — 피아노 소나타의 정점", kind: .birthday),
            // MARK: Memorials
            "03-05": E(icon: "leaf", text: "세르게이 프로코피예프 기일 (1953) — 그의 피아노 음악은 오늘도 건반 위에서 살아있습니다", kind: .memorial),
            "03-26": E(icon: "leaf", text: "루트비히 판 베토벤 기일 (1827) — 그가 남긴 소나타 32편은 영원합니다", kind: .memorial),
            "03-28": E(icon: "leaf", text: "세르게이 라흐마니노프 기일 (1943) — 4개의 피아노 협주곡은 러시아 음악의 유산입니다", kind: .memorial),
            "04-03": E(icon: "leaf", text: "요하네스 브람스 기일 (1897) — 인테르메초와 랩소디는 오늘도 울려 퍼집니다", kind: .memorial),
            "04-14": E(icon: "leaf", text: "게오르크 프리드리히 헨델 기일 (1759) — 바로크 건반 음악의 거장이 떠난 날", kind: .memorial),
            "04-27": E(icon: "leaf", text: "알렉산드르 스크랴빈 기일 (1915) — 피아노 소나타 10번과 함께 별이 되었습니다", kind: .memorial),
            "05-20": E(icon: "leaf", text: "클라라 슈만 기일 (1896) — 낭만시대의 위대한 피아니스트가 세상을 떠난 날", kind: .memorial),
            "05-31": E(icon: "leaf", text: "프란츠 요제프 하이든 기일 (1809) — 음악의 아버지가 고요히 눈을 감았습니다", kind: .memorial),
            "07-01": E(icon: "leaf", text: "에릭 사티 기일 (1925) — 짐노페디의 선율은 여전히 공중에 떠 있습니다", kind: .memorial),
            "07-23": E(icon: "leaf", text: "도메니코 스카를라티 기일 (1757) — 555개의 소나타를 남기고 떠났습니다", kind: .memorial),
            "07-28": E(icon: "leaf", text: "요한 제바스티안 바흐 기일 (1750) — 건반 음악의 아버지가 영원한 별이 되었습니다", kind: .memorial),
            "07-29": E(icon: "leaf", text: "로베르트 슈만 기일 (1856) — 그의 피아노 음악은 영원한 낭만으로 남습니다", kind: .memorial),
            "07-31": E(icon: "leaf", text: "프란츠 리스트 기일 (1886) — 피아노 기교의 왕이 영면에 들었습니다", kind: .memorial),
            "08-09": E(icon: "leaf", text: "드미트리 쇼스타코비치 기일 (1975) — 24개의 전주곡과 푸가는 그의 영혼과 함께 남습니다", kind: .memorial),
            "09-04": E(icon: "leaf", text: "에드바르 그리그 기일 (1907) — 피아노 협주곡의 아름다운 선율이 영원합니다", kind: .memorial),
            "09-26": E(icon: "leaf", text: "벨라 바르토크 기일 (1945) — 미크로코스모스는 피아노 교육의 영원한 보물입니다", kind: .memorial),
            "10-17": E(icon: "leaf", text: "프레데리크 쇼팽 기일 (1849) — 피아노의 시인이 영면에 들었습니다", kind: .memorial),
            "11-04": E(icon: "leaf", text: "멘델스존 (1847), 포레 (1924) 기일 — 두 낭만주의 거장이 같은 날 세상을 떠났습니다", kind: .memorial),
            "11-06": E(icon: "leaf", text: "표트르 일리치 차이코프스키 기일 (1893) — 피아노 협주곡 1번은 영원합니다", kind: .memorial),
            "11-19": E(icon: "leaf", text: "프란츠 슈베르트 기일 (1828) — 겨울나그네의 작곡가가 31세에 짧은 생을 마쳤습니다", kind: .memorial),
            "12-05": E(icon: "leaf", text: "볼프강 아마데우스 모차르트 기일 (1791) — 천재는 떠났지만 음악은 영원합니다", kind: .memorial),
            "12-16": E(icon: "leaf", text: "카미유 생상스 기일 (1921) — 동물의 사육제는 여전히 사람들을 웃게 합니다", kind: .memorial),
            "12-28": E(icon: "leaf", text: "모리스 라벨 기일 (1937) — 볼레로의 리듬은 영원히 계속됩니다", kind: .memorial),
        ]
    }()
    // swiftlint:enable closure_body_length

    private var avatarView: some View {
        Group {
            if let image = loadAvatarImage() {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                Image(systemName: "person.fill")
                    .foregroundStyle(AppPalette.homeTheme)
            }
        }
        .frame(width: avatarSize, height: avatarSize)
        .clipShape(Circle())
        .overlay(
            Circle()
                .strokeBorder(AppPalette.homeTheme.opacity(0.18), lineWidth: 1)
        )
    }


    private var statsSection: some View {
        VStack(spacing: 8) {
            HStack {
                Text("home.summary.title")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
            }

            StatRow(
                iconName: "pianokeys",
                iconTint: AppPalette.homeTheme,
                title: summaryPracticeRecordTitle,
                value: formattedHoursMinutes(selectedDateMinutes)
            )
            StatRow(
                iconName: "music.note.list",
                iconTint: AppPalette.homeTheme,
                title: summaryTracksTitle,
                value: String(localized: "home.summary.tracks.value")
                    .replacingOccurrences(of: "{NUM}", with: "\(selectedDateChecked.numerator)")
                    .replacingOccurrences(of: "{DEN}", with: "\(selectedDateChecked.denominator)")
            )
            StatRow(
                iconName: "trophy.fill",
                iconTint: AppPalette.homeTheme,
                title: String(localized: "home.summary.totalPractice"),
                value: formattedHoursMinutes(practiceDataStore.totalMinutes())
            )
        }
    }

    private var startPracticeSection: some View {
        Group {
            if practiceDataStore.timerActive {
                // ── 활성 타이머: GroupBox 카드
                GroupBox {
                    VStack(alignment: .leading, spacing: 10) {
                        // 상태 레이블 — 14pt semibold, 다크/라이트 adaptive
                        Text(practiceDataStore.timerRunning
                             ? String(localized: "home.session.inprogress")
                             : String(localized: "home.session.paused"))
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.primary)

                        // 버튼 3개(좌) + 타이머 숫자(우)
                        HStack(alignment: .center, spacing: 12) {
                            circleButton(
                                icon: practiceDataStore.timerRunning ? "pause.fill" : "play.fill",
                                tint: AppPalette.homeTheme
                            ) {
                                AppHaptics.tap()
                                if practiceDataStore.timerRunning {
                                    practiceDataStore.pauseSession()
                                } else {
                                    practiceDataStore.resumeSession()
                                }
                            }

                            circleButton(icon: "pencil", tint: AppPalette.homeTheme) {
                                AppHaptics.tap()
                                prepareEditSheetValues()
                                isEditSheetPresented = true
                            }

                            circleButton(icon: "stop.fill", tint: .red) {
                                AppHaptics.tap()
                                completeMemo = practiceDataStore.timerMemo
                                isCompleteSheetPresented = true
                            }

                            // HH:MM:SS 최대 폭 감안, 우측 정렬
                            Text(elapsedDisplayText)
                                .font(.system(size: 38, weight: .thin, design: .monospaced))
                                .foregroundStyle(.primary)
                                .contentTransition(.numericText())
                                .monospacedDigit()
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                        }

                        if !practiceDataStore.timerMemo.isEmpty {
                            Text(practiceDataStore.timerMemo)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                                .truncationMode(.tail)
                        }
                    }
                }
                .groupBoxStyle(AppCardGroupBoxStyle())
            } else {
                // ── 비활성: GroupBox 없이 버튼만 (시스템 배경 제거)
                Button {
                    AppHaptics.tap()
                    practiceDataStore.startSession()
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: playIconSize))
                            .symbolRenderingMode(.monochrome)
                            .foregroundStyle(AppPalette.homeTheme)
                        Text("home.session.start.action")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(AppPalette.homeTheme)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                }
                .buttonStyle(.plain)
                .hoverEffect(.lift)
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: practiceDataStore.timerActive)
    }

    private var editTimeSheet: some View {
        NavigationStack {
            Form {
                DatePicker("common.start", selection: $editStartDate, displayedComponents: [.date, .hourAndMinute])
                DatePicker("common.end", selection: $editEndDate, displayedComponents: [.date, .hourAndMinute])
            }
            .navigationTitle("home.session.editTime")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("common.cancel") {
                        AppHaptics.tap()
                        isEditSheetPresented = false
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.save") {
                        AppHaptics.tap()
                        saveEditedPracticeWindow()
                        isEditSheetPresented = false
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    // MARK: - Session Complete Sheet

    private var completeSessionSheet: some View {
        NavigationStack {
            // 버튼은 safeAreaInset으로 바닥 고정 → 키보드 유무와 무관하게 항상 노출
            VStack(spacing: 20) {
                // ── 경과 시간 ──
                VStack(spacing: 5) {
                    Text(elapsedText)
                        .font(.system(size: 44, weight: .bold, design: .monospaced))
                        .foregroundStyle(AppPalette.homeTheme)
                        .contentTransition(.numericText())
                    Text("home.session.elapsed.section")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 8)

                // ── 메모 입력 ──
                GroupBox {
                    TextField(
                        "stats.memo.placeholder",
                        text: $completeMemo,
                        axis: .vertical
                    )
                    .lineLimit(3...5)
                } label: {
                    Text("stats.memo").font(.caption)
                }

                Spacer(minLength: 0)
            }
            .padding(.horizontal)
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 10) {
                    // 연습 완료
                    Button {
                        AppHaptics.tap()
                        practiceDataStore.completeSession(memo: completeMemo)
                        isCompleteSheetPresented = false
                    } label: {
                        Label("home.session.finish.action", systemImage: "stop.circle.fill")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(Color.red.opacity(0.08),
                                        in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)

                    // 시간 수정
                    Button {
                        AppHaptics.tap()
                        isCompleteSheetPresented = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            prepareEditSheetValues()
                            isEditSheetPresented = true
                        }
                    } label: {
                        Label("home.session.editTime", systemImage: "pencil.circle")
                            .font(.body)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(Color(uiColor: .tertiarySystemFill),
                                        in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal)
                .padding(.vertical, 12)
                .background(.bar)  // 시스템 material — 스크롤 콘텐츠와 구분
            }
            .navigationTitle("home.session.finish.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.close") {
                        AppHaptics.tap()
                        practiceDataStore.updateTimerMemo(completeMemo)
                        isCompleteSheetPresented = false
                    }
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private var selectedDateText: String {
        dateStore.selectedDate.formatted(
            Date.FormatStyle()
                .year()
                .month(.twoDigits)
                .day(.twoDigits)
                .weekday(.abbreviated)
        )
    }

    private var shortSelectedDate: String {
        dateStore.selectedDate.formatted(
            Date.FormatStyle()
                .year(.twoDigits)
                .month(.twoDigits)
                .day(.twoDigits)
        )
    }

    private var isTodaySelected: Bool {
        calendar.isDate(dateStore.selectedDate, inSameDayAs: .now)
    }

    private func shiftSelectedDate(by days: Int) {
        if let shifted = calendar.date(byAdding: .day, value: days, to: dateStore.selectedDate) {
            dateStore.selectedDate = shifted
        }
    }

    private var selectedDateKey: String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: dateStore.selectedDate)
    }

    private var selectedDateMinutes: Int {
        practiceDataStore.records(for: selectedDateKey).reduce(0) { $0 + max(0, $1.practiceTime) }
    }

    private var selectedDateChecked: (numerator: Int, denominator: Int) {
        let visibleTracks = tracksStore.tracks(for: dateStore.selectedDate)
        let denominator = visibleTracks.count
        let numerator = visibleTracks.filter { tracksStore.hasChecked(trackId: $0.id, on: selectedDateKey) }.count
        return (numerator, denominator)
    }

    private var elapsedText: String {
        let ms = max(0, practiceDataStore.timerMilliseconds)
        let totalSec = Int(ms / 1000)
        let hour = totalSec / 3600
        let min  = (totalSec % 3600) / 60
        let sec  = totalSec % 60
        let cs   = Int((ms % 1000) / 10) // 센티세컨드 (1/100초)
        if hour > 0 {
            return String(format: "%d:%02d:%02d", hour, min, sec)
        }
        return String(format: "%02d:%02d.%02d", min, sec, cs)
    }

    /// 홈 카드 타이머 표시용 — 소수점 아래 제거, MM:SS / H:MM:SS
    private var elapsedDisplayText: String {
        let ms = max(0, practiceDataStore.timerMilliseconds)
        let totalSec = Int(ms / 1000)
        let hour = totalSec / 3600
        let min  = (totalSec % 3600) / 60
        let sec  = totalSec % 60
        if hour > 0 {
            return String(format: "%d:%02d:%02d", hour, min, sec)
        }
        return String(format: "%02d:%02d", min, sec)
    }

    private func prepareEditSheetValues() {
        let nowMs = Int64(Date().timeIntervalSince1970 * 1000)
        let startMs = practiceDataStore.timerStartTime ?? nowMs
        let elapsedMs = practiceDataStore.timerMilliseconds
        let endMs = max(startMs + elapsedMs, startMs)
        editStartDate = Date(timeIntervalSince1970: TimeInterval(startMs) / 1000)
        editEndDate = Date(timeIntervalSince1970: TimeInterval(endMs) / 1000)
    }

    private func saveEditedPracticeWindow() {
        let startMs = Int64(editStartDate.timeIntervalSince1970 * 1000)
        let endMs = Int64(editEndDate.timeIntervalSince1970 * 1000)
        guard endMs >= startMs else { return }

        if practiceDataStore.timerActive {
            practiceDataStore.updateTimerStartTime(startMs)
        } else {
            practiceDataStore.upsertManualRecord(
                id: nil,
                startTimeMs: startMs,
                endTimeMs: endMs,
                memo: nil
            )
        }
    }

    private func loadAvatarImage() -> UIImage? {
        ShareCardMaker.loadAvatarImage(avatarPath: avatarPath)
    }

    private func monthDayKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "MM-dd"
        return formatter.string(from: date)
    }

    private var summaryPracticeRecordTitle: String {
        if isTodaySelected {
            return String(localized: "home.summary.practiceRecord.today")
        }
        return String(localized: "home.summary.practiceRecord.date")
            .replacingOccurrences(of: "{DATE}", with: shortSelectedDate)
    }

    private var summaryTracksTitle: String {
        if isTodaySelected {
            return String(localized: "home.summary.tracks.today")
        }
        return String(localized: "home.summary.tracks.date")
            .replacingOccurrences(of: "{DATE}", with: shortSelectedDate)
    }

    // MARK: - Stats data

    private let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private func dayKey(for date: Date) -> String {
        dayFormatter.string(from: date)
    }

    private func normalizedDayKey(for record: PracticeRecord) -> String {
        let trimmed = record.date.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.count >= 10, dayFormatter.date(from: String(trimmed.prefix(10))) != nil {
            return String(trimmed.prefix(10))
        }
        return dayKey(for: Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000))
    }

    private var minutesByDayKey: [String: Int] {
        Dictionary(grouping: practiceDataStore.practiceRecords, by: normalizedDayKey(for:))
            .mapValues { $0.reduce(0) { $0 + max(0, $1.practiceTime) } }
    }

    private var sortedPracticedDateKeys: [String] {
        minutesByDayKey.keys.filter { (minutesByDayKey[$0] ?? 0) > 0 }.sorted()
    }

    private var currentStreak: Int {
        let practiced = Set(sortedPracticedDateKeys)
        var cursor = calendar.startOfDay(for: .now)
        var streak = 0
        if !practiced.contains(dayKey(for: cursor)) {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: cursor) else { return 0 }
            cursor = yesterday
        }
        while practiced.contains(dayKey(for: cursor)) {
            streak += 1
            guard let prev = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = prev
            if streak > 3650 { break }
        }
        return streak
    }

    private var bestStreak: Int {
        let keys = sortedPracticedDateKeys
        guard !keys.isEmpty else { return 0 }
        var best = 1, running = 1
        for i in 1..<keys.count {
            guard let prev = dayFormatter.date(from: keys[i - 1]),
                  let curr = dayFormatter.date(from: keys[i]) else { continue }
            let diff = calendar.dateComponents([.day], from: prev, to: curr).day ?? 0
            running = diff == 1 ? running + 1 : 1
            best = max(best, running)
        }
        return best
    }

    private var totalMinutes: Int { practiceDataStore.totalMinutes() }

    private var weekDates: [Date] {
        let anchor = calendar.startOfDay(for: dateStore.selectedDate)
        let weekday = calendar.component(.weekday, from: anchor)
        let mondayOffset = (weekday + 5) % 7
        guard let weekStart = calendar.date(byAdding: .day, value: -mondayOffset, to: anchor) else { return [] }
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: weekStart) }
    }

    private var weekPracticeDays: Int {
        weekDates.reduce(0) { $0 + ((minutesByDayKey[dayKey(for: $1)] ?? 0) > 0 ? 1 : 0) }
    }

    private var monthPracticeDays: Int {
        let today = Date()
        guard let range = calendar.range(of: .day, in: .month, for: today) else { return 0 }
        let start = calendar.date(from: calendar.dateComponents([.year, .month], from: today)) ?? today
        return range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: start) }
            .reduce(0) { $0 + ((minutesByDayKey[dayKey(for: $1)] ?? 0) > 0 ? 1 : 0) }
    }

    private var yearPracticeDays: Int {
        let today = Date()
        guard let range = calendar.range(of: .day, in: .year, for: today) else { return 0 }
        let start = calendar.date(from: calendar.dateComponents([.year], from: today)) ?? today
        return range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: start) }
            .reduce(0) { $0 + ((minutesByDayKey[dayKey(for: $1)] ?? 0) > 0 ? 1 : 0) }
    }

    // MARK: - Practice Time Summary

    private var practiceTimeSummarySection: some View {
        let hasRecords = !practiceDataStore.records(for: selectedDateKey)
            .filter { $0.practiceTime > 0 }.isEmpty
        return HStack(spacing: 8) {
            // 오늘/선택 날짜 연습 시간
            GroupBox {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Label {
                            Text(summaryPracticeRecordTitle)
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        } icon: {
                            Image(systemName: "clock.fill")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(AppPalette.homeTheme)
                        }
                        .labelStyle(.titleAndIcon)
                        Spacer(minLength: 4)
                        Button {
                            AppHaptics.tap()
                            handleShareButtonTap()
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .font(.caption)
                                .foregroundStyle(AppPalette.homeTheme)
                                .opacity(hasRecords ? 1 : 0.25)
                        }
                        .buttonStyle(.plain)
                        .disabled(!hasRecords)
                    }
                    Spacer(minLength: 8)
                    Text(formattedHoursMinutes(selectedDateMinutes))
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(selectedDateMinutes > 0 ? AppPalette.homeTheme : Color(uiColor: .tertiaryLabel))
                        .minimumScaleFactor(0.65)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // 누적 연습 시간
            GroupBox {
                VStack(alignment: .leading, spacing: 0) {
                    Label {
                        Text("home.summary.totalPractice")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    } icon: {
                        Image(systemName: "chart.bar.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(AppPalette.homeTheme)
                    }
                    .labelStyle(.titleAndIcon)
                    Spacer(minLength: 8)
                    Text(formattedHoursMinutes(totalMinutes))
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(totalMinutes > 0 ? AppPalette.homeTheme : Color(uiColor: .tertiaryLabel))
                        .minimumScaleFactor(0.65)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    // MARK: - Heatmap

    private var heatmapDates: [Date] {
        let days = 266
        let base = calendar.startOfDay(for: .now)
        return (0..<days).compactMap { offset in
            calendar.date(byAdding: .day, value: -(days - 1 - offset), to: base)
        }
    }

    private func heatmapLevel(for date: Date) -> Int {
        let minutes = minutesByDayKey[dayKey(for: date)] ?? 0
        if minutes <= 0 { return 0 }
        if minutes >= 120 { return 3 }
        if minutes >= 60 { return 2 }
        return 1
    }

    private func heatmapColor(level: Int) -> Color {
        switch level {
        case 1: return AppPalette.homeTheme.opacity(0.35)
        case 2: return AppPalette.homeTheme.opacity(0.65)
        case 3: return AppPalette.homeTheme
        default: return .clear
        }
    }

    /// 히트맵 셀 — 레벨 0은 시스템 테두리만, 1~3은 색상 채움
    @ViewBuilder
    private func heatmapCell(level: Int) -> some View {
        if level == 0 {
            RoundedRectangle(cornerRadius: 2, style: .continuous)
                .strokeBorder(Color(uiColor: .separator), lineWidth: 0.5)
                .frame(width: heatmapCellSize, height: heatmapCellSize)
        } else {
            RoundedRectangle(cornerRadius: 2, style: .continuous)
                .fill(heatmapColor(level: level))
                .frame(width: heatmapCellSize, height: heatmapCellSize)
        }
    }

    /// 월 라벨: 열이 바뀔 때마다 새 월이면 표시 (PWA 동일 방식)
    private var heatmapMonthLabels: [(label: String, column: Int)] {
        let rows = 7
        var result: [(String, Int)] = []
        var lastMonth = -1
        for (index, date) in heatmapDates.enumerated() {
            let month = calendar.component(.month, from: date)
            let col = index / rows
            if month != lastMonth {
                let fmt = DateFormatter()
                fmt.locale = Locale.current
                fmt.dateFormat = "MMM"
                result.append((fmt.string(from: date), col))
                lastMonth = month
            }
        }
        return result
    }

    private var heatmapSection: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 10) {
                let hasAnyData = !practiceDataStore.practiceRecords.filter { $0.practiceTime > 0 }.isEmpty

                if hasAnyData {
                    let gap: CGFloat = 1
                    let rows = 7
                    let cols = Int(ceil(Double(heatmapDates.count) / Double(rows)))
                    let gridWidth = CGFloat(cols) * (heatmapCellSize + gap) - gap

                    VStack(alignment: .leading, spacing: 4) {
                        // 월 라벨
                        ZStack(alignment: .topLeading) {
                            Color.clear.frame(width: gridWidth, height: 12)
                            ForEach(heatmapMonthLabels, id: \.column) { item in
                                Text(item.label)
                                    .font(.system(size: 9, weight: .regular))
                                    .foregroundStyle(.secondary)
                                    .offset(x: CGFloat(item.column) * (heatmapCellSize + gap))
                            }
                        }

                        // 그리드 (7행 고정, 열방향 자동)
                        LazyHGrid(
                            rows: Array(repeating: GridItem(.fixed(heatmapCellSize), spacing: gap), count: rows),
                            spacing: gap
                        ) {
                            ForEach(heatmapDates, id: \.self) { date in
                                heatmapCell(level: heatmapLevel(for: date))
                            }
                        }
                        .frame(height: CGFloat(rows) * (heatmapCellSize + gap) - gap)
                    }

                    HStack(spacing: 6) {
                        Text("stats.heatmap.less")
                        ForEach(0..<4, id: \.self) { level in
                            heatmapCell(level: level)
                        }
                        Text("stats.heatmap.more")
                    }
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
                } else {
                    Text("stats.heatmap.empty")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 20)
                }
            }
        } label: {
            HStack {
                Text("stats.heatmap.title")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.primary)
                Spacer()
                Button {
                    AppHaptics.tap()
                    calendarDetailDate = dateStore.selectedDate
                    isCalendarSheetPresented = true
                } label: {
                    Label("stats.heatmap.detail", systemImage: "calendar")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(AppPalette.homeTheme)
                }
                .buttonStyle(.plain)
                .hoverEffect(.lift)
            }
        }
    }

    // MARK: - Stats views

    private var streakCardsSection: some View {
        HStack(spacing: 10) {
            streakCardView(
                title: String(localized: "stats.streak.current"),
                value: currentStreak,
                icon: "flame.fill"
            )
            streakCardView(
                title: String(localized: "stats.streak.best"),
                value: bestStreak,
                icon: "trophy.fill"
            )
        }
    }

    private func streakCardView(title: String, value: Int, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AppPalette.homeTheme)
                Text(title)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 10)
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text("\(value)")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(value > 0 ? AppPalette.homeTheme : Color(uiColor: .tertiaryLabel))
                    .monospacedDigit()
                Text("stats.day.unit")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 84, alignment: .leading)
        .padding(14)
        .background(
            Color(uiColor: .secondarySystemBackground),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
    }

    private var totalPracticeBannerView: some View {
        HStack(spacing: 4) {
            Text("stats.total.prefix")
                .foregroundStyle(.secondary)
            Text(formattedHoursMinutes(totalMinutes))
                .foregroundStyle(AppPalette.homeTheme)
                .fontWeight(.bold)
            Text("stats.total.suffix")
                .foregroundStyle(.secondary)
        }
        .font(.subheadline)
        .frame(maxWidth: .infinity, alignment: .center)
    }

    private var practicedDayStripView: some View {
        HStack(spacing: 8) {
            Text("stats.strip.week")
            Text("\(weekPracticeDays) \(String(localized: "stats.day.unit"))")
                .fontWeight(.bold)
                .foregroundStyle(AppPalette.homeTheme)
            Text("·")
            Text("stats.strip.month")
            Text("\(monthPracticeDays) \(String(localized: "stats.day.unit"))")
                .fontWeight(.bold)
                .foregroundStyle(AppPalette.homeTheme)
            Text("·")
            Text("stats.strip.year")
            Text("\(yearPracticeDays) \(String(localized: "stats.day.unit"))")
                .fontWeight(.bold)
                .foregroundStyle(AppPalette.homeTheme)
        }
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, alignment: .center)
    }

    private var recentRecordsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("stats.today.title")
                .font(.headline)
            Text("\(String(localized: "stats.today.minutes")): \(formattedHoursMinutes(selectedDateMinutes))")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("\(String(localized: "stats.today.songs")): \(selectedDateChecked.numerator)/\(selectedDateChecked.denominator)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Divider()

            let visibleTracks = tracksStore.tracks(for: dateStore.selectedDate)
            if visibleTracks.isEmpty {
                Text("stats.today.empty")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(visibleTracks) { track in
                        let checked = tracksStore.hasChecked(trackId: track.id, on: selectedDateKey)
                        HStack(spacing: 8) {
                            Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(checked ? AppPalette.homeTheme : .secondary)
                                .font(.system(size: 14))
                            Text(track.title)
                                .font(.footnote)
                                .foregroundStyle(checked ? .primary : .secondary)
                                .lineLimit(1)
                                .truncationMode(.tail)
                        }
                    }
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color(.separator).opacity(0.6), lineWidth: 0.5)
        )
    }

    // MARK: - Calendar Detail

    private var calendarDetailDateKey: String { dayKey(for: calendarDetailDate) }

    private var calendarDetailSummaryHeader: String {
        let cal = Calendar(identifier: .gregorian)
        if cal.isDateInToday(calendarDetailDate) {
            return String(localized: "stats.calendar.summary.today")
        }
        let month = cal.component(.month, from: calendarDetailDate)
        let day   = cal.component(.day,   from: calendarDetailDate)
        return String(localized: "stats.calendar.summary.date")
            .replacingOccurrences(of: "{M}", with: "\(month)")
            .replacingOccurrences(of: "{D}", with: "\(day)")
    }

    private var calendarDetailRecords: [PracticeRecord] {
        practiceDataStore.practiceRecords
            .filter { normalizedDayKey(for: $0) == calendarDetailDateKey }
            .sorted { $0.startTime < $1.startTime }
    }

    private var calendarDetailMinutes: Int {
        calendarDetailRecords.reduce(0) { $0 + max(0, $1.practiceTime) }
    }

    private var calendarDetailVisibleTracks: [PracticeTrack] {
        tracksStore.tracks(for: calendarDetailDate)
    }

    private var calendarDetailCheckedCount: Int {
        calendarDetailVisibleTracks.filter {
            tracksStore.hasChecked(trackId: $0.id, on: calendarDetailDateKey)
        }.count
    }

    private func shiftCalendarDetailDate(by days: Int) {
        guard let shifted = calendar.date(byAdding: .day, value: days, to: calendarDetailDate) else { return }
        calendarDetailDate = shifted
        dateStore.selectedDate = shifted
    }

    private func calendarSessionTitle(for record: PracticeRecord, in records: [PracticeRecord]) -> String {
        let index = (records.firstIndex { $0.id == record.id } ?? 0) + 1
        return String(localized: "stats.session.title")
            .replacingOccurrences(of: "{INDEX}", with: "\(index)")
            .replacingOccurrences(of: "{DURATION}", with: formattedHoursMinutes(max(0, record.practiceTime)))
    }

    private func calendarSessionTimeRange(for record: PracticeRecord) -> String {
        let start = Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000)
        let end   = Date(timeIntervalSince1970: TimeInterval(record.endTime) / 1000)
        return "\(start.formatted(date: .omitted, time: .shortened)) ~ \(end.formatted(date: .omitted, time: .shortened))"
    }

    private var calendarDetailSheet: some View {
        NavigationStack {
            List {
                // ── 1. 달력 ──
                Section {
                    PracticeCalendarView(
                        selectedDate: Binding(
                            get: { calendarDetailDate },
                            set: {
                                calendarDetailDate = $0
                                dateStore.selectedDate = $0
                            }
                        ),
                        practicedDayKeys: Set(minutesByDayKey.keys.filter { (minutesByDayKey[$0] ?? 0) > 0 })
                    )
                    .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0))
                    .padding(.horizontal, 4)
                }

                // ── 2. 날짜 요약 카드 3개 ──
                Section {
                    HStack(spacing: 10) {
                        detailSummaryCard(
                            icon: "clock.fill",
                            label: String(localized: "stats.today.minutes"),
                            value: formattedHoursMinutes(calendarDetailMinutes)
                        )
                        detailSummaryCard(
                            icon: "timer",
                            label: String(localized: "stats.calendar.sessions"),
                            value: "\(calendarDetailRecords.count)\(String(localized: "stats.count.unit"))"
                        )
                        detailSummaryCard(
                            icon: "checkmark.circle.fill",
                            label: String(localized: "stats.today.songs"),
                            value: "\(calendarDetailCheckedCount)/\(calendarDetailVisibleTracks.count)"
                        )
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                } header: {
                    Text(calendarDetailSummaryHeader)
                }

                // ── 3. 탭 피커 ──
                Section {
                    Picker("", selection: $detailTab) {
                        ForEach(DetailTab.allCases, id: \.self) { tab in
                            Text(tab.rawValue).tag(tab)
                        }
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                }

                // ── 4a. 이날 기록 탭 ──
                if detailTab == .records {
                    Section("stats.calendar.sessionList") {
                        if calendarDetailRecords.isEmpty {
                            Text("stats.record.none").foregroundStyle(.secondary)
                        } else {
                            ForEach(calendarDetailRecords) { record in
                                DisclosureGroup(
                                    isExpanded: Binding(
                                        get: { expandedRecordID == record.id },
                                        set: { expandedRecordID = $0 ? record.id : nil }
                                    )
                                ) {
                                    VStack(alignment: .leading, spacing: 10) {
                                        Text("stats.memo").font(.caption).foregroundStyle(.secondary)
                                        Text(record.memo?.isEmpty == false ? record.memo! : String(localized: "stats.memo.none"))
                                            .font(.subheadline)
                                        HStack(spacing: 8) {
                                            Button("stats.edit.time") {
                                                AppHaptics.tap()
                                                editingTimeRecord = record
                                                editedStartDate = Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000)
                                                editedEndDate   = Date(timeIntervalSince1970: TimeInterval(record.endTime) / 1000)
                                            }
                                            .buttonStyle(.bordered)
                                            Button("stats.edit.memo") {
                                                AppHaptics.tap()
                                                editingMemoRecord = record
                                                editedMemo = record.memo ?? ""
                                            }
                                            .buttonStyle(.bordered)
                                            Button("common.delete", role: .destructive) {
                                                AppHaptics.tap()
                                                deletingRecord = record
                                            }
                                            .buttonStyle(.bordered)
                                        }
                                        .tint(AppPalette.homeTheme)
                                    }
                                    .padding(.top, 8)
                                } label: {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(calendarSessionTitle(for: record, in: calendarDetailRecords))
                                            .font(.subheadline.weight(.semibold))
                                        Text(calendarSessionTimeRange(for: record))
                                            .font(.caption).foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }

                    Section("stats.today.songs") {
                        if calendarDetailVisibleTracks.isEmpty {
                            Text("stats.record.none").foregroundStyle(.secondary)
                        } else {
                            ForEach(calendarDetailVisibleTracks) { track in
                                let checked = tracksStore.hasChecked(trackId: track.id, on: calendarDetailDateKey)
                                HStack(spacing: 8) {
                                    Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(checked ? AppPalette.homeTheme : .secondary)
                                    Text(track.title)
                                        .foregroundStyle(checked ? .primary : .secondary)
                                        .lineLimit(1)
                                }
                            }
                        }
                    }
                }

                // ── 4b. 통계 탭 ──
                if detailTab == .stats {
                    // 주간 차트 (시간 / 연습곡 세그먼트)
                    Section {
                        VStack(alignment: .leading, spacing: 10) {
                            Picker("", selection: $weekChartMode) {
                                ForEach(WeekChartMode.allCases, id: \.self) { m in
                                    Text(m.rawValue).tag(m)
                                }
                            }
                            .pickerStyle(.segmented)

                            if weekChartMode == .time {
                                Text(weekTimeSummary).font(.caption).foregroundStyle(.secondary)
                                Chart {
                                    ForEach(Array(weekDates.enumerated()), id: \.offset) { index, date in
                                        BarMark(
                                            x: .value("idx", index),
                                            y: .value(String(localized: "stats.chart.axis.minutes"),
                                                       minutesByDayKey[dayKey(for: date)] ?? 0),
                                            width: .ratio(0.55)
                                        )
                                        .cornerRadius(4)
                                    }
                                }
                                .frame(height: chartHeight)
                                .chartXAxis {
                                    AxisMarks(values: Array(0..<7)) { val in
                                        AxisValueLabel {
                                            if let i = val.as(Int.self), i < weekdayLabels.count {
                                                Text(weekdayLabels[i]).font(.caption2)
                                            }
                                        }
                                    }
                                }
                                .chartYAxis {
                                    AxisMarks(position: .leading) { _ in AxisGridLine(); AxisValueLabel() }
                                }
                            } else {
                                Text(weekSongSummary).font(.caption).foregroundStyle(.secondary)
                                Chart {
                                    ForEach(Array(weekDates.enumerated()), id: \.offset) { index, date in
                                        BarMark(
                                            x: .value("idx", index),
                                            y: .value(String(localized: "stats.chart.axis.tracks"),
                                                       checkedTrackCount(for: dayKey(for: date))),
                                            width: .ratio(0.55)
                                        )
                                        .cornerRadius(4)
                                    }
                                }
                                .frame(height: chartHeight)
                                .chartXAxis {
                                    AxisMarks(values: Array(0..<7)) { val in
                                        AxisValueLabel {
                                            if let i = val.as(Int.self), i < weekdayLabels.count {
                                                Text(weekdayLabels[i]).font(.caption2)
                                            }
                                        }
                                    }
                                }
                                .chartYAxis {
                                    AxisMarks(position: .leading) { _ in AxisGridLine(); AxisValueLabel() }
                                }
                            }
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    } header: {
                        Text("stats.chart.weekTime") // "주간"
                    }

                    // 월간/연간 트렌드
                    Section("stats.trend.section") {
                        trendSectionView
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    }
                }
            }
            .navigationTitle("stats.calendar.title")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.done") {
                        AppHaptics.tap()
                        dateStore.selectedDate = calendarDetailDate
                        isCalendarSheetPresented = false
                    }
                }
            }
        }
        .presentationDetents([.large])
    }

    /// 상세보기 날짜 요약 카드 — 아이콘 + 레이블 + 값
    @ViewBuilder
    private func detailSummaryCard(icon: String, label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label {
                Text(label).lineLimit(1).minimumScaleFactor(0.7)
            } icon: {
                Image(systemName: icon).foregroundStyle(AppPalette.homeTheme)
            }
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(.secondary)
            .labelStyle(.titleAndIcon)

            Text(value)
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundStyle(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color(.separator).opacity(0.5), lineWidth: 0.5)
        )
    }

    private func calendarEditTimeSheet(record: PracticeRecord) -> some View {
        NavigationStack {
            Form {
                DatePicker("common.start", selection: $editedStartDate, displayedComponents: [.date, .hourAndMinute])
                DatePicker("common.end",   selection: $editedEndDate,   displayedComponents: [.date, .hourAndMinute])
            }
            .navigationTitle("stats.edit.time")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("common.cancel") { AppHaptics.tap(); editingTimeRecord = nil }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.save") {
                        AppHaptics.tap()
                        let s = Int64(editedStartDate.timeIntervalSince1970 * 1000)
                        let e = Int64(editedEndDate.timeIntervalSince1970 * 1000)
                        practiceDataStore.updateRecordTimes(id: record.id, startTimeMs: s, endTimeMs: e)
                        editingTimeRecord = nil
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func calendarEditMemoSheet(record: PracticeRecord) -> some View {
        NavigationStack {
            Form {
                Section("stats.memo") {
                    TextEditor(text: $editedMemo).frame(minHeight: 180)
                }
            }
            .navigationTitle("stats.edit.memo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("common.cancel") { AppHaptics.tap(); editingMemoRecord = nil }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.save") {
                        AppHaptics.tap()
                        practiceDataStore.updateRecordMemo(id: record.id, memo: editedMemo)
                        editingMemoRecord = nil
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    // MARK: - Share

    private func handleShareButtonTap() {
        let records = practiceDataStore.records(for: selectedDateKey).filter { $0.practiceTime > 0 }
        guard !records.isEmpty else { return }
        if records.count == 1 {
            renderAndShare(record: records[0])
        } else {
            shareCandidateRecords = records
            isSharePickerPresented = true
        }
    }

    private func renderAndShare(record: PracticeRecord) {
        guard let windowScene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) else { return }

        let image = ShareCardMaker.makeImage(
            record: record,
            nickname: nickname,
            dateText: selectedDateText,
            avatarPath: avatarPath
        )
        ShareCardMaker.present(image: image, from: window)
    }

    private func shareSessionTimeRange(for record: PracticeRecord) -> String {
        let start = Date(timeIntervalSince1970: TimeInterval(record.startTime) / 1000)
        let end = Date(timeIntervalSince1970: TimeInterval(record.endTime) / 1000)
        return "\(start.formatted(date: .omitted, time: .shortened)) ~ \(end.formatted(date: .omitted, time: .shortened))"
    }

    private var sharePickerSheet: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(Array(shareCandidateRecords.enumerated()), id: \.element.id) { index, record in
                        Button {
                            AppHaptics.tap()
                            isSharePickerPresented = false
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                renderAndShare(record: record)
                            }
                        } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("세션 \(index + 1) · \(formattedHoursMinutes(record.practiceTime))")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.primary)
                                Text(shareSessionTimeRange(for: record))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                } header: {
                    Text("공유할 세션을 선택하세요")
                }
            }
            .navigationTitle("세션 선택")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("common.cancel") {
                        AppHaptics.tap()
                        isSharePickerPresented = false
                    }
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Chart computed properties

    private var previousWeekDates: [Date] {
        weekDates.compactMap { calendar.date(byAdding: .day, value: -7, to: $0) }
    }

    private func checkedTrackCount(for key: String) -> Int {
        guard let dayChecks = tracksStore.practiceChecks[key] else { return 0 }
        return dayChecks.values.filter { $0 }.count
    }

    private func weekdayLetter(for date: Date) -> String {
        switch calendar.component(.weekday, from: date) {
        case 1: return "S"; case 2: return "M"; case 3: return "T"
        case 4: return "W"; case 5: return "T"; case 6: return "F"
        case 7: return "S"; default: return "-"
        }
    }

    private var weekTimeSummary: String {
        let cur = weekDates.reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
        let prev = previousWeekDates.reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
        let diff = cur - prev
        if diff == 0 {
            return String(localized: "stats.week.summary.same")
                .replacingOccurrences(of: "{TOTAL}", with: formattedHoursMinutes(cur))
        }
        let sign = diff > 0 ? "+" : "-"
        return String(localized: "stats.week.summary.diff")
            .replacingOccurrences(of: "{TOTAL}", with: formattedHoursMinutes(cur))
            .replacingOccurrences(of: "{SIGN}", with: sign)
            .replacingOccurrences(of: "{DIFF}", with: formattedHoursMinutes(abs(diff)))
    }

    private var weekSongSummary: String {
        let total = weekDates.reduce(0) { $0 + checkedTrackCount(for: dayKey(for: $1)) }
        let avg = total / 7
        return String(localized: "stats.week.songSummary")
            .replacingOccurrences(of: "{TOTAL}", with: "\(total)")
            .replacingOccurrences(of: "{AVERAGE}", with: "\(avg)")
    }

    private var currentMonthMinutes: Int {
        let today = Date()
        guard let range = calendar.range(of: .day, in: .month, for: today) else { return 0 }
        let start = calendar.date(from: calendar.dateComponents([.year, .month], from: today)) ?? today
        return range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: start) }
            .reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
    }

    private var currentYearMinutes: Int {
        let today = Date()
        guard let range = calendar.range(of: .day, in: .year, for: today) else { return 0 }
        let start = calendar.date(from: calendar.dateComponents([.year], from: today)) ?? today
        return range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: start) }
            .reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
    }

    private var monthTrendMinutes: [Int] {
        let today = Date()
        let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: today)) ?? today
        return (0..<5).map { w in
            let start = calendar.date(byAdding: .day, value: w * 7, to: monthStart) ?? monthStart
            return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
                .reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
        }
    }

    private var yearTrendMinutes: [Int] {
        let today = Date()
        let year = calendar.component(.year, from: today)
        return (1...12).map { month in
            var comps = DateComponents(); comps.year = year; comps.month = month; comps.day = 1
            let monthStart = calendar.date(from: comps) ?? today
            guard let range = calendar.range(of: .day, in: .month, for: monthStart) else { return 0 }
            return range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: monthStart) }
                .reduce(0) { $0 + (minutesByDayKey[dayKey(for: $1)] ?? 0) }
        }
    }

    // MARK: - Chart views (for detail sheet)

    // 월~일 레이블 (weekDates는 월요일 시작)
    private let weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"]

    private var weeklyTimeChartView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("stats.chart.weekTime").font(.subheadline.weight(.semibold))
            Text(weekTimeSummary).font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(Array(weekDates.enumerated()), id: \.offset) { index, date in
                    let minutes = minutesByDayKey[dayKey(for: date)] ?? 0
                    BarMark(
                        x: .value("idx", index),
                        y: .value(String(localized: "stats.chart.axis.minutes"), minutes),
                        width: .ratio(0.55)
                    )
                    .cornerRadius(4)
                }
            }
            .frame(height: chartHeight)
            .chartXAxis {
                AxisMarks(values: Array(0..<7)) { val in
                    AxisValueLabel {
                        if let i = val.as(Int.self), i < weekdayLabels.count {
                            Text(weekdayLabels[i]).font(.caption2)
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { _ in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
        }
    }

    private var weeklySongChartView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("stats.chart.weekSong").font(.subheadline.weight(.semibold))
            Text(weekSongSummary).font(.caption).foregroundStyle(.secondary)
            Chart {
                ForEach(Array(weekDates.enumerated()), id: \.offset) { index, date in
                    BarMark(
                        x: .value("idx", index),
                        y: .value(String(localized: "stats.chart.axis.tracks"), checkedTrackCount(for: dayKey(for: date))),
                        width: .ratio(0.55)
                    )
                    .cornerRadius(4)
                }
            }
            .frame(height: chartHeight)
            .chartXAxis {
                AxisMarks(values: Array(0..<7)) { val in
                    AxisValueLabel {
                        if let i = val.as(Int.self), i < weekdayLabels.count {
                            Text(weekdayLabels[i]).font(.caption2)
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { _ in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
        }
    }

    private var trendSectionView: some View {
        VStack(alignment: .leading, spacing: 10) {
            Picker("", selection: $trendMode) {
                ForEach(TrendMode.allCases, id: \.self) { m in
                    Text(m.rawValue).tag(m)
                }
            }
            .pickerStyle(.segmented)

            if trendMode == .month {
                Text(formattedHoursMinutes(currentMonthMinutes))
                    .font(.caption).foregroundStyle(.secondary)
                Chart {
                    ForEach(Array(monthTrendMinutes.enumerated()), id: \.offset) { i, v in
                        BarMark(
                            x: .value(String(localized: "stats.chart.axis.week"), "W\(i + 1)"),
                            y: .value(String(localized: "stats.chart.axis.minutes"), v),
                            width: .ratio(0.55)
                        )
                        .cornerRadius(4)
                    }
                }
                .frame(height: trendChartHeight)
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in AxisGridLine(); AxisValueLabel() }
                }
            } else {
                Text(formattedHoursMinutes(currentYearMinutes))
                    .font(.caption).foregroundStyle(.secondary)
                Chart {
                    ForEach(Array(yearTrendMinutes.enumerated()), id: \.offset) { i, v in
                        BarMark(
                            x: .value(String(localized: "stats.chart.axis.month"), "\(i + 1)"),
                            y: .value(String(localized: "stats.chart.axis.minutes"), v),
                            width: .ratio(0.55)
                        )
                        .cornerRadius(4)
                    }
                }
                .frame(height: trendChartHeight)
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in AxisGridLine(); AxisValueLabel() }
                }
            }
        }
    }

    private func formattedHoursMinutes(_ minutes: Int) -> String {
        let safeMinutes = max(0, minutes)
        let hour = safeMinutes / 60
        let minute = safeMinutes % 60
        if hour > 0, minute > 0 {
            return String(localized: "stats.minutes.hourMinute")
                .replacingOccurrences(of: "{H}", with: "\(hour)")
                .replacingOccurrences(of: "{M}", with: "\(minute)")
        }
        if hour > 0 {
            return String(localized: "stats.minutes.hourOnly")
                .replacingOccurrences(of: "{H}", with: "\(hour)")
        }
        return String(localized: "stats.minutes.minuteOnly")
            .replacingOccurrences(of: "{M}", with: "\(minute)")
    }
}

#Preview {
    HomeView()
        .environmentObject(SelectedDateStore())
        .environmentObject(PracticeTracksStore())
        .environmentObject(PracticeDataStore())
}

private struct MusicEvent {
    enum Kind { case birthday, memorial, special }
    let icon: String
    let text: String
    let kind: Kind
}

private struct MusicEventCard: View {
    let event: MusicEvent
    @State private var appeared = false

    private var iconColor: Color {
        switch event.kind {
        case .birthday: return AppPalette.homeTheme
        case .memorial: return .secondary
        case .special:  return AppPalette.homeTheme
        }
    }

    /// " — " 앞의 짧은 레이블 + 주기/주년 suffix
    private var displayText: String {
        let shortLabel = event.text.components(separatedBy: " — ").first ?? event.text

        // (YYYY) 패턴이 정확히 하나일 때만 주기 계산
        let pattern = #"\((\d{4})\)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return shortLabel }
        let nsRange = NSRange(shortLabel.startIndex..., in: shortLabel)
        let matches = regex.matches(in: shortLabel, range: nsRange)

        guard matches.count == 1,
              let yearRange = Range(matches[0].range(at: 1), in: shortLabel),
              let year = Int(shortLabel[yearRange]) else {
            return shortLabel
        }

        let currentYear = Calendar(identifier: .gregorian).component(.year, from: .now)
        let diff = currentYear - year
        let suffix = event.kind == .memorial ? "주기" : "주년"
        return "\(shortLabel) · \(diff)\(suffix)"
    }

    var body: some View {
        HStack(spacing: 5) {
            iconView
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(iconColor)
            Text(displayText)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .onAppear { appeared = true }
    }

    @ViewBuilder
    private var iconView: some View {
        if #available(iOS 17, *) {
            Image(systemName: event.icon)
                .symbolEffect(.bounce, value: appeared)
        } else {
            Image(systemName: event.icon)
        }
    }
}

private struct StatRow<Trailing: View>: View {
    let iconName: String
    let iconTint: Color
    let title: String
    let value: String
    @ViewBuilder let trailingButton: () -> Trailing

    init(
        iconName: String,
        iconTint: Color,
        title: String,
        value: String,
        @ViewBuilder trailingButton: @escaping () -> Trailing = { EmptyView() }
    ) {
        self.iconName = iconName
        self.iconTint = iconTint
        self.title = title
        self.value = value
        self.trailingButton = trailingButton
    }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: iconName)
                .foregroundStyle(iconTint)
                .frame(width: 28, height: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.headline)
                    .foregroundStyle(.primary)
            }

            Spacer(minLength: 0)
            trailingButton()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(uiColor: .secondarySystemBackground))
        )
    }
}

// MARK: - Practice Calendar View (UICalendarView 기반 — 연습한 날 점 표시)

private struct PracticeCalendarView: UIViewRepresentable {
    @Binding var selectedDate: Date
    let practicedDayKeys: Set<String>

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        return f
    }()

    func makeUIView(context: Context) -> UICalendarView {
        let view = UICalendarView()
        view.locale = Locale(identifier: "ko_KR")
        view.calendar = Calendar(identifier: .gregorian)
        view.delegate = context.coordinator
        // 가로 확장 억제 — List 셀 width 초과 방지
        view.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        view.setContentHuggingPriority(.defaultLow, for: .horizontal)

        let selection = UICalendarSelectionSingleDate(delegate: context.coordinator)
        view.selectionBehavior = selection

        // 초기 선택 날짜 반영
        let comps = Calendar(identifier: .gregorian).dateComponents([.year, .month, .day], from: selectedDate)
        selection.setSelected(comps, animated: false)

        return view
    }

    func updateUIView(_ uiView: UICalendarView, context: Context) {
        let oldKeys = context.coordinator.practicedDayKeys
        context.coordinator.practicedDayKeys = practicedDayKeys
        context.coordinator.parent = self

        // 선택 날짜 동기화
        if let sel = uiView.selectionBehavior as? UICalendarSelectionSingleDate {
            let cal = Calendar(identifier: .gregorian)
            let current = sel.selectedDate
            let newComps = cal.dateComponents([.year, .month, .day], from: selectedDate)
            if current != newComps {
                sel.setSelected(newComps, animated: false)
            }
        }

        // 연습 데이터가 바뀌었으면 장식 갱신
        if oldKeys != practicedDayKeys {
            uiView.reloadDecorations(forDateComponents: [], animated: false)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    final class Coordinator: NSObject, UICalendarViewDelegate, UICalendarSelectionSingleDateDelegate {
        var parent: PracticeCalendarView
        var practicedDayKeys: Set<String> = []

        init(parent: PracticeCalendarView) {
            self.parent = parent
            self.practicedDayKeys = parent.practicedDayKeys
        }

        // 날짜 장식 — 연습한 날에 turquoise 점
        func calendarView(
            _ calendarView: UICalendarView,
            decorationFor dateComponents: DateComponents
        ) -> UICalendarView.Decoration? {
            guard let date = Calendar(identifier: .gregorian).date(from: dateComponents) else { return nil }
            let key = PracticeCalendarView.dayFormatter.string(from: date)
            guard practicedDayKeys.contains(key) else { return nil }
            return .default(color: UIColor(red: 0.271, green: 0.710, blue: 0.667, alpha: 1))
        }

        // 날짜 선택
        func dateSelection(
            _ selection: UICalendarSelectionSingleDate,
            didSelectDate dateComponents: DateComponents?
        ) {
            guard let comps = dateComponents,
                  let date = Calendar(identifier: .gregorian).date(from: comps) else { return }
            parent.selectedDate = date
        }

        func dateSelection(
            _ selection: UICalendarSelectionSingleDate,
            canSelectDate dateComponents: DateComponents?
        ) -> Bool { true }
    }
}

// MARK: - 공유 카드 GroupBox 스타일

/// 홈 화면 섹션 카드 공통 스타일.
/// GroupBox의 기본 스타일 대신 명시적 배경색 + border를 사용해
/// 다크모드에서도 배경과 카드를 명확히 구분한다.
private struct AppCardGroupBoxStyle: GroupBoxStyle {
    func makeBody(configuration: Configuration) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            configuration.label
            configuration.content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Color(.separator).opacity(0.6), lineWidth: 0.5)
        )
    }
}

