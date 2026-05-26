# LogScore iOS 앱 코드 리뷰 리포트

작성일: 2026-05-26  
대상: `PianoLogNative` iOS 앱 전체 소스 (`Sources/`)

---

## 1. 패치로 대충/임시로 넘어간 곳

### 1-1. `_practiceActivity: Any?` — 타입 소거 임시 처리
**파일:** `Sources/Shared/PracticeDataStore.swift`

ActivityKit의 `Activity<PianoLogActivityAttributes>` 제네릭 타입을 stored property로 선언하면 `@available(iOS 16.1+)` 어트리뷰트가 필요한데, `ObservableObject`의 `@Published`와 충돌하므로 `Any?`로 타입 소거해서 우회함.

```swift
private var _practiceActivity: Any? // Activity<PianoLogActivityAttributes> — iOS 16.1+ 만 사용, Any?로 타입 소거
```

cast가 실패해도 silently nil처리되어 Live Activity가 의도치 않게 고아(orphan)가 될 수 있음. 근본 해결은 `ObservableObject`에서 분리한 별도 `LiveActivityManager` 클래스로 책임을 위임하는 것.

---

### 1-2. `UIScreen.main.bounds` — deprecated API로 높이 계산
**파일:** `Sources/Features/Home/HomeView.swift` (homeHeader 섹션)

```swift
let screenW = UIScreen.main.bounds.width
```

`GeometryReader`가 이미 뷰 크기를 제공하고 있음에도 `.frame(height:)` 클로저 안에서는 `geo`에 접근할 수 없어 `UIScreen.main`을 임시로 사용. `UIScreen.main`은 iOS 16부터 deprecated이고 멀티윈도우 환경(Stage Manager, iPad)에서 잘못된 값을 반환함.

**해결 방향:** `GeometryReader`가 반환한 `geo.size`를 `@State` 또는 `PreferenceKey`로 올리거나, `frame(height:)` 호출을 GeometryReader 안으로 이동.

---

### 1-3. `HomeSettingsSheet` — `onChange(of:)` 구식 형태 직접 사용
**파일:** `Sources/Features/Home/HomeSettingsSheet.swift` (lines 54, 62)

`ViewCompatibility.swift`에 `onChangeSafe(of:perform:)` 래퍼가 있음에도 `HomeSettingsSheet`는 이를 사용하지 않고 구식 1-파라미터 form을 직접 사용. iOS 17 SDK에서 deprecated 경고가 발생.

같은 문제가 `StatsView.swift` (line 91), `TrackDetailView.swift` (lines 162, 165), `WeeklyCalendarModule.swift` (line 81)에도 존재.

---

### 1-4. `BeatVisualizerView` — `ViewCompatibility.swift` 중복 복사
**파일:** `Sources/Features/Metronome/BeatVisualizerView.swift` (lines 142~165)

`Sources/Shared/ViewCompatibility.swift`에 이미 `OnChangeCompat` + `onChangeSafe` 확장이 정의되어 있는데, `BeatVisualizerView.swift`에 완전히 동일한 코드가 `private` scope로 복붙되어 있음. 중복 정의로 DRY 원칙 위반.

---

### 1-5. `parseClockTime()` — `ko_KR` 로케일 하드코딩
**파일:** `Sources/Features/Home/HomeSettingsSheet.swift`

```swift
formatter.locale = Locale(identifier: "ko_KR")
formatter.dateFormat = "yyyy-MM-dd h:mm:ss a"
```

웹앱 CSV 내보내기가 한국어 날짜 포맷(오전/오후)을 사용했으므로 불가피한 선택이었으나, 영어 기기에서 임포트 시 파싱 실패 가능성 있음. 현재 fallback(`en_US_POSIX` + 24시간)이 있어 일단 작동하지만, 포맷 매칭 실패 시 silent null 처리됨.

---

### 1-6. `StatsView` — 뷰가 placeholder만 표시하는 미완성 상태
**파일:** `Sources/Features/Stats/StatsView.swift`

탭바 3번째 탭(Stats)이 "연습기록 상세 보기에서 통계를 확인하세요" 메시지만 표시함. 이전 리팩토링 과정에서 실제 통계 UI가 HomeView의 `calendarDetailSheet`로 이전되었으나, StatsView 자체의 UI는 삭제하지 않고 placeholder로 대체된 상태.

관련 zombie State 변수도 남아 있음:
```swift
@State private var isMonthTrendExpanded = false  // 미사용
@State private var isYearTrendExpanded = false   // 미사용
```

**해결 방향:** StatsView를 독립적인 통계 화면으로 구성하거나, 탭 자체를 제거하고 HomeView에 통합.

---

## 2. 커스텀 구현 — 시스템이 해주는 것을 직접 그린 곳

### 2-1. 원형 버튼 — `.buttonBorderShape(.circle)` 대신 `Circle()` 배경 수동 구현
**파일:** `Sources/Features/Home/HomeView.swift`

iOS 17+에서는 `.buttonBorderShape(.circle)`으로 해결 가능하지만, iOS 16 배포 타겟 때문에 수동 구현:

```swift
private func circleButton(icon: String, tint: Color, action: @escaping () -> Void) -> some View {
    Button(action: action) {
        Image(systemName: icon)
            .frame(width: 44, height: 44)
            .background(tint.opacity(0.12), in: Circle())
    }
    .buttonStyle(.plain)
    .hoverEffect(.lift)
}
```

iOS 16 지원이 종료되면 `.buttonStyle(.borderedProminent).buttonBorderShape(.circle)`으로 교체하면 시스템 색상, 접근성, pressed 상태를 자동으로 얻을 수 있음.

---

### 2-2. 앱 테마 색상 — Asset Catalog 미사용, 코드 내 hex 하드코딩
**파일:** `Sources/Theme/AppPalette.swift`

```swift
static let homeTheme: Color = Color(UIColor { traits in
    traits.userInterfaceStyle == .dark
    ? UIColor(red: 0x8B/255, green: 0xB5/255, blue: 0xB1/255, alpha: 1)
    : UIColor(red: 0x45/255, green: 0xB5/255, blue: 0xAA/255, alpha: 1)
})
```

Asset Catalog의 Named Color를 사용하면 Xcode에서 시각적으로 관리하고, Dynamic Color, High Contrast 모드도 자동 지원됨. 현재 방식은 색상 변경 시 코드 수정 필요.

---

### 2-3. 공유 카드(Share Image) — UIGraphicsImageRenderer로 전체 수동 렌더링
**파일:** `Sources/Features/Home/HomeView.swift` (약 1700~1789 라인)

Core Graphics로 텍스트, 배경, 브랜딩을 수동으로 그림. iOS 16 이상에서는 SwiftUI 뷰를 `ImageRenderer`로 직접 이미지화할 수 있으므로 유지보수가 훨씬 쉬워짐. 지금 구현은 레이아웃 수정마다 좌표 계산을 직접 업데이트해야 함.

---

### 2-4. heatmap — `LazyVGrid` + `Rectangle` 수동 구현
**파일:** `Sources/Features/Home/HomeView.swift`

GitHub contribution graph 스타일의 히트맵을 직접 레이아웃. iOS 17의 `Chart` + `RectangleMark` 조합으로 교체하면 접근성 및 다크모드 대응이 자동화됨.

---

## 3. 향후 iOS 업데이트 때 문제가 될 곳

### 3-1. `UIScreen.main.bounds` (iOS 16 deprecated)
위 1-2 참조. `UIScreen.main`이 미래 iOS에서 제거될 경우 컴파일 에러.

### 3-2. `onChange(of:perform:)` 구식 형태 (iOS 17 deprecated)
위 1-3 참조. 미래 Swift/iOS SDK에서 API가 제거될 경우 `onChangeSafe` 미사용 파일들에서 빌드 에러. 현재 `ViewCompatibility.swift`의 래퍼를 도입해 통일해야 함.

### 3-3. `plus.arrow.trianglehead.counterclockwise` — SF Symbols 버전 종속
**파일:** `Sources/App/RootTabView.swift`

```swift
Image(systemName: "plus.arrow.trianglehead.counterclockwise")
```

이 심볼이 도입된 SF Symbols 버전을 확인해야 함. 배포 타겟(iOS 16)에서 해당 심볼이 없을 경우 탭바 아이콘이 빈 상태로 표시됨. SF Symbols 앱에서 버전 확인 후 `@available` 분기 또는 대안 심볼 사용 권장.

### 3-4. `UserDefaults.standard` — 전체 데이터 단일 저장소
**파일:** `Sources/Shared/PracticeDataStore.swift`, `PracticeTracksStore.swift`, `MetronomeViewModel.swift`

모든 사용자 데이터(연습 기록, 트랙, 메트로놈 세션)가 `UserDefaults.standard`에 JSON 직렬화로 저장됨. 데이터 양이 많아질 경우 성능 저하 및 `UserDefaults`의 저장 한도 이슈 가능성. iCloud 동기화, 데이터 마이그레이션, 기기 간 공유가 불가능한 구조.

장기적으로 SwiftData 또는 CoreData + CloudKit으로 마이그레이션 고려.

### 3-5. Live Activity 타입 소거 + `@available` 분기
**파일:** `Sources/Shared/PracticeDataStore.swift`

`if #available(iOSApplicationExtension 16.1, *)` 분기가 중첩되어 있고 `Any?` 캐스팅이 여러 지점에 분산됨. ActivityKit API가 변경될 때 캐스팅 실패 지점이 명확하지 않아 디버깅 어려움.

---

## 4. 앱 로고·네이밍 반영이 안 된 곳

| 위치 | 현재 값 | 변경 필요 |
|------|---------|----------|
| `PianoLogNativeApp.swift` line 28 | `struct PianoLogNativeApp` | `struct LogScoreApp` |
| `PracticeTimerLiveActivityWidget.swift` line 8 | `struct PianoLogLiveActivityWidget` | `struct LogScoreLiveActivityWidget` |
| `PracticeTimerLiveActivityWidget.swift` line 13 | `PianoLogLockView` | `LogScoreLockView` |
| `PracticeTimerLiveActivityWidget.swift` line 32 | `Text("PianoLog")` | `Text("LogScore")` |
| `PianoLogActivityAttributes.swift` | `struct PianoLogActivityAttributes` | `struct LogScoreActivityAttributes` |
| `PianoLogNativeLiveActivityBundle.swift` | `struct PianoLogNativeLiveActivityBundle` | `struct LogScoreLiveActivityBundle` |
| `HomeView.swift` line 1772 | `"PianoLog" as NSString` (공유 카드 브랜딩) | `"LogScore"` |
| `PracticeDataStore.swift` 주석 line 57 | `// Activity<PianoLogActivityAttributes>` | 주석 업데이트 |
| `MetronomeViewModel.swift` line 880 | `// PianoLogLiveActivityWidget이 담당` | 주석 업데이트 |
| `PracticeTimerLiveActivityWidget.swift` line 30 | `Image(systemName: "pianokeys")` (Dynamic Island 하단) | 아이콘은 유지하되 브랜딩 텍스트 교체 |

**번들 ID:** `com.mozartdc.pianolog.native` → App Store Connect 등록 전 변경 필요 (`com.mozartdc.logscore` 등). 앱이 출시 후라면 번들 ID는 변경 불가.

---

## 5. 시스템이 그리는 방식과 다른 곳 (SCOREViewer 스타일 비교 기준)

### 5-1. 탭바 — 텍스트 레이블 없음
**파일:** `Sources/App/RootTabView.swift`

```swift
.tabItem { Image(systemName: "house") }  // 레이블 없음
```

iOS HIG는 탭바에 아이콘 + 텍스트 레이블 조합을 권장. 레이블 없는 아이콘만의 탭바는 접근성(VoiceOver) 미지원. SCOREViewer가 레이블을 표시한다면 일관성 필요.

### 5-2. 네비게이션 바 버튼 — `.buttonStyle(.plain)` 수동 적용
**파일:** `HomeView.swift`, `TodayView.swift`

```swift
Button { ... } label: { Image(systemName: "chevron.left") }
.buttonStyle(.plain)
.foregroundStyle(.primary)
.hoverEffect(.lift)
```

툴바 내 버튼에는 `.buttonStyle(.plain)`을 수동으로 적용하지 않아도 시스템이 적절한 스타일을 제공. `.foregroundStyle`도 명시적 지정 없이 시스템 tint color를 따르게 하는 게 더 일관성 있음.

### 5-3. 날짜 이동 컨트롤 — Toolbar principal에 커스텀 HStack
**파일:** `HomeView.swift`, `TodayView.swift`

두 뷰 모두 `ToolbarItem(placement: .principal)`에 동일한 `[◁ 날짜텍스트 ▷]` HStack 구조를 복사해서 구현. 공용 컴포넌트로 추출되지 않아 수정 시 양쪽 모두 변경 필요. DateNavigationToolbar 같은 재사용 View로 추출 권장.

### 5-4. List 스타일 — `.plain` + 배경 수동 제거
**파일:** `TodayView.swift`

```swift
.listStyle(.plain)
.scrollContentBackground(.hidden)
.background(Color(uiColor: .systemBackground))
```

시스템 List 기본 배경을 숨기고 수동으로 systemBackground를 다시 칠함. SCOREViewer가 insetGrouped 스타일을 쓴다면 불일치.

### 5-5. `Form` 피커 — `.pickerStyle(.inline).labelsHidden()` 조합
**파일:** `HomeSettingsSheet.swift`

```swift
Picker(...) { ... }
.pickerStyle(.inline)
.labelsHidden()
```

Settings 앱과 동일한 스타일이나, `EmptyView()` label을 주고 `labelsHidden()`으로 숨기는 패턴은 VoiceOver에서 피커 설명이 사라짐. label에 실제 텍스트를 넣고 `labelsHidden()`을 제거하거나, `.pickerStyle(.segmented)`로 교체 권장.

---

## 요약 — 우선순위 권장 조치

| 우선순위 | 항목 | 작업량 |
|---------|------|-------|
| 🔴 즉시 | `PianoLog` 네이밍 → `LogScore` 전체 교체 | 소 |
| 🔴 즉시 | Dynamic Island `Text("PianoLog")` → `Text("LogScore")` | 소 |
| 🔴 즉시 | 공유 카드 브랜딩 `"PianoLog"` → `"LogScore"` | 소 |
| 🔴 즉시 | `PracticeTimerLiveActivityAttributes.swift` 좀비 파일 삭제 | 소 |
| 🟠 단기 | `onChange(of:)` 구식 형태 → 전체 `onChangeSafe` 래퍼 통일 | 소 |
| 🟠 단기 | `BeatVisualizerView` 내 `OnChangeCompat` 중복 제거 | 소 |
| 🟠 단기 | `UIScreen.main.bounds` → GeometryReader 기반으로 교체 | 중 |
| 🟠 단기 | `StatsView` 정리 — 탭 제거 또는 독립 화면화 | 중 |
| 🟠 단기 | 탭바 레이블 추가 (접근성) | 소 |
| 🟡 중기 | `AppPalette` → Asset Catalog Named Color 이전 | 소 |
| 🟡 중기 | 날짜 네비게이션 Toolbar 공용 컴포넌트 추출 | 중 |
| 🟡 중기 | `_practiceActivity: Any?` → `LiveActivityManager` 분리 | 대 |
| 🔵 장기 | `UserDefaults` → SwiftData/CoreData + iCloud 마이그레이션 | 대 |
| 🔵 장기 | 공유 카드 → `ImageRenderer` 기반 SwiftUI 렌더링 전환 | 대 |
