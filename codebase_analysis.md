# PianoScoreLog 코드베이스 종합 분석

분석 기준일: 2026-05-12  
대상 파일: 39개 Swift 소스 파일 전체

---

## 1. 잠재적 위험요소

### 🔴 HIGH — 즉시 대응 필요

#### 1-1. `item.value(forKey: "view")` Private KVC
**파일**: `EditorToolbarModule.swift` (popover anchor 계산부)  
`UIBarButtonItem`의 내부 뷰를 KVC로 꺼내는 코드다. 공개 API가 아니며, Apple이 내부 구현을 바꾸는 순간 `nil`을 반환해 폴오버 위치가 화면 좌상단으로 날아간다. App Store 심사에서 private API 스캔에 걸릴 가능성도 있다.

```swift
// EditorToolbarModule.swift ~490
let anchor = item.value(forKey: "view") as? UIView
```

**위험 수준**: 빌드는 통과하지만 런타임 또는 심사에서 터질 수 있음  
**권장 대응**: `UIBarButtonItem.customView`를 사용하거나, popover sourceRect를 toolbar 전체 기준으로 fallback 처리

---

#### 1-2. SwiftData 고아 레코드 (Orphan Records)
**파일**: `Models.swift`, `ScoreFileStore.swift` (deletePiece 구현부)  
`Piece`를 삭제할 때 연결된 `PracticeSession`, `PieceDailyStatus`, `Recording`, `MetronomePreset`을 수동으로 지우지 않는다. `@Relationship`이 아닌 UUID 소프트 참조이므로 SwiftData가 cascade delete를 할 수 없다.

**결과**: DB에 pieceID는 있지만 Piece 자체는 없는 레코드가 무한정 쌓임. 특히 Recording은 파일도 남아 용량 누수 발생.

**권장 대응**: `deletePiece()` 안에 5개 모델 각각 `modelContext.delete()` 루프 추가 (스키마 변경 불필요)

---

#### 1-3. `withObservationTracking` 수동 재귀 루프
**파일**: `ScorePDFViewController.swift` 또는 EditorToolbar 연결부  
`@Observable` 값 변화를 UIKit에 반영하기 위해 `withObservationTracking { ... } onChange: { self.someMethod() }` 패턴을 재귀 호출하고 있다. 이 패턴은 공식 문서에서 UIKit 대상으로 권장하지 않으며, 특정 조건에서 onChange 블록이 메인 스레드 외에서 호출될 수 있다.

**위험 수준**: 미묘한 레이스 컨디션, 관찰 트리 누수 가능성  
**권장 대응**: `@Observable`을 `ObservableObject`/`@Published`로 교체하거나, `withObservationTracking` 호출에 `DispatchQueue.main.async` 보호 추가

---

### 🟡 MEDIUM — 다음 릴리즈 전 처리 권장

#### 1-4. `UIScribbleInteraction` 제거 (UISearchTextField 내부 탐색)
**파일**: `UIKitBridge.swift`  
UISearchBar의 내부 뷰 계층을 재귀 탐색해 `UISearchTextField`를 찾은 뒤 `UIScribbleInteraction`을 강제 제거한다. UIKit 내부 구조가 바뀌면 탐색이 실패하고 Scribble 점 문제가 재발한다.

**현재 상태**: `⚠️ FRAGILE` 주석 달아 관리 중  
**권장 대응**: Apple이 `UISearchTextField.isScribbleInteractionEnabled`를 공개 Swift API로 노출하면 즉시 교체. 그 전까지는 현행 유지 + iOS 버전별 QA

---

#### 1-5. `preferredContentSize` 하드코딩 (UIHostingController 팝오버 5곳)
**파일**: `EditorToolbarModule.swift`  
모든 팝오버의 `preferredContentSize`가 픽셀값으로 고정돼 있다. Dynamic Type 확대, 다국어(특히 아랍어·히브리어 RTL), 접근성 설정 변경 시 내용이 잘리거나 넘친다.

**위험 수준**: 접근성 심사 기준 미달 가능성  
**권장 대응**: `sizingOptions = .preferredContentSize`를 사용하되, `@Observable` 피드백 루프를 막기 위해 최초 1회만 설정하는 `once` 패턴 적용

---

#### 1-6. ARKit 페이스 트래킹 — 전면 카메라 상시 점유
**파일**: `FaceGestureInputProvider.swift`  
`ARFaceTrackingConfiguration`을 실행하면 전면 카메라가 활성화된다. 화면 잠금·앱 백그라운드 시 세션을 중단하는 코드가 없으면 배터리·개인정보 문제가 된다.

**권장 대응**: `scenePhase` 변화 또는 `UIApplicationDidEnterBackground` 에서 `session.pause()` / `session.run()` 확인

---

### 🟢 LOW — 인지하고 관리

#### 1-7. PDF 스크롤뷰 내부 탐색 (`PDFView` 서브뷰 접근)
**파일**: `ScorePDFViewController.swift`  
PDFKit 내부 `UIScrollView`에 직접 접근하는 코드가 있다면 iOS 업데이트마다 확인이 필요하다. 현재는 공식 `PDFPageOverlayViewProvider` API 범위 안에서 처리 중이나, 스크롤뷰 접근 부분은 매 OS 버전마다 QA 필요.

---

## 2. iOS 시스템이 그리도록 맡기지 않은 항목 (커스텀 렌더링 목록)

### 2-1. ScoreTabBar — 완전 커스텀 탭 바
**파일**: `ScoreTabBar.swift`  
`UITabBar` / SwiftUI `TabView`를 쓰지 않고 `ScrollView` + `HStack` + 직접 계산한 너비로 탭을 그린다.

| 항목 | 시스템 대안 |
|------|-----------|
| 탭 너비 계산 | `UITabBarItem` 자동 크기 조정 |
| 선택 인디케이터 | 시스템 탭 선택 애니메이션 |
| 스크롤 탭 | 없음 (iOS 18 이전 기준) — 커스텀 필요성 있음 |

**결론**: 악보 뷰어의 멀티 탭은 시스템 `TabView`로 표현하기 어려운 요구사항(스크롤 가능, PDF 탭)이 있으므로 커스텀이 정당화된다.

---

### 2-2. 스티커 렌더링 — CoreText 직접 드로잉
**파일**: `EditorStickerRendering.swift`  
음악 기호를 Bravura 폰트의 글리프로 렌더링할 때 `CTLine`, `CTLineDraw`, `UIGraphicsImageRenderer`를 직접 사용한다. SwiftUI의 `Text`나 `Image`를 쓰지 않는다.

**사용한 이유**: Bravura는 음악 기호 전용 폰트로, 표준 텍스트 렌더링 경로로는 기준선·크기·정렬을 제어하기 어렵다.  
**결론**: 기술적으로 필요한 커스텀이다. 단, per-symbol 매직 넘버(§5 참조)는 분리 관리 필요.

---

### 2-3. 색상 선택 팝오버 — 커스텀 SwiftUI 그리드
**파일**: `EditorToolbarModule.swift` (색상 팔레트 팝오버)  
`UIColorPickerViewController` 또는 SwiftUI `.colorPicker` modifier를 사용하지 않고 색상 스와치를 직접 그린다.

**사용한 이유**: 시스템 컬러 피커는 Hex 입력, 스포이드 등 불필요한 UI가 포함되고, 팔레트 제한이 어렵다.  
**결론**: UX상 의도적 선택. 단, 접근성(VoiceOver 라벨, 포커스 순서)은 별도 확인 필요.

---

### 2-4. EditorToolbar — UIToolbar 래핑
**파일**: `EditorToolbarModule.swift`  
`UIToolbar`를 `UIViewController`로 감싸 SwiftUI에서 `UIViewControllerRepresentable`로 사용한다. `UIToolbarAppearance`를 투명으로 설정하고 SwiftUI `.background(.bar)` 처리를 위임한다.

**결론**: 시스템 컴포넌트를 활용하되 외형만 커스터마이징한 케이스 — 적절한 접근이다.

---

### 2-5. PassthroughView / hitTest 오버라이드
**파일**: `ScorePDFControllerTypes.swift`  
`ScorePDFLayeredPageOverlayView`, `PassthroughView`, `ScorePDFImageContainerView`가 `hitTest(_:with:)`를 오버라이드해 터치를 조건부로 통과시킨다.

**결론**: PDFKit 오버레이와 PencilKit 캔버스가 겹치는 구조에서 불가피한 선택이다. 다만 hitTest 체인이 복잡해지면 추후 디버깅이 어려우므로 각 뷰의 의도를 주석으로 관리하는 것이 중요하다.

---

### 2-6. 페이지 썸네일 위치 — 하드코딩 높이
**파일**: `ScorePDFViewController.swift`  
`PDFThumbnailView`는 시스템 컴포넌트를 사용하지만, 위치 잡기에 `64pt` 고정 높이를 쓴다.

---

## 3. 커스터마이징이 iOS 시스템 범위 안에 있는지

| 항목 | 시스템 범위 내 여부 | 설명 |
|------|----------------|------|
| PKCanvasView.isHidden으로 DisplayLink 정지 | ✅ 공식 API | `isHidden`은 공개 프로퍼티 |
| PDFPageOverlayViewProvider | ✅ 공식 API | PDFKit 공개 델리게이트 |
| UIToolbarAppearance 투명 처리 | ✅ 공식 API | iOS 15+ appearance API |
| CTLine/CTLineDraw 렌더링 | ✅ 공개 프레임워크 | CoreText는 공개 API |
| ARFaceTrackingConfiguration | ✅ 공식 API | ARKit 공개 API |
| CMHeadphoneMotionManager | ✅ 공식 API | Core Motion 공개 API |
| UIScribbleInteraction 제거 | ⚠️ 내부 구조 의존 | UISearchTextField 탐색은 비공식 |
| item.value(forKey: "view") | ❌ Private KVC | 공개 API 아님 |
| PDFView 내부 스크롤뷰 접근 | ⚠️ 구현 의존 | PDFKit 내부 뷰 계층 구조 |
| withObservationTracking UIKit 재귀 | ⚠️ 비권장 패턴 | 공식 UIKit 지원 없음 |

---

## 4. 시스템과 다른 방향 → iOS 업데이트 시 영향 분석

### 4-1. ScoreTabBar vs. iOS 18 Tab View 진화
iOS 18에서 `TabView`에 `.tabViewStyle(.sidebarAdaptable)` 등 새로운 스타일이 추가됐다. 현재 완전 커스텀 ScoreTabBar는 이런 시스템 진화를 자동으로 받지 못한다.

**영향 예측**: 중간. UX 일관성 저하 가능성. 기능 동작에는 문제없음.

---

### 4-2. UIBarButtonItem Private KVC vs. iOS 개선
iOS가 내부 `UIBarButtonItem` 구현을 변경(예: SwiftUI 기반으로 재작성)하면 `value(forKey: "view")`가 `nil`을 반환한다. 이미 iOS 16→17에서 일부 UIKit 컴포넌트가 내부적으로 SwiftUI로 전환됐다.

**영향 예측**: 높음. 팝오버 앵커가 없어지면 팝오버가 화면 좌상단(0,0)에 뜬다.

---

### 4-3. withObservationTracking vs. Swift Observation 진화
Swift 5.9에서 `@Observable`이 도입됐고, UIKit 바인딩 패턴은 아직 공식화되지 않았다. 향후 Apple이 권장 패턴(예: `UIHostingConfiguration`처럼)을 제시하면 현재 재귀 루프는 deprecated 동작에 의존하게 될 수 있다.

**영향 예측**: 낮음~중간. 동작은 유지되나 경고 또는 메모리 누수 가능성.

---

### 4-4. UIScribbleInteraction vs. 검색창 구현 변경
Apple이 `UISearchBar` 내부를 SwiftUI 기반으로 재작성하거나 `UISearchTextField` 구조를 바꾸면 현재의 계층 탐색이 실패한다.

**영향 예측**: 중간. Scribble 점 문제가 재발하지만 앱 크래시는 아님.

---

### 4-5. CoreText 직접 렌더링 vs. 미래 폰트 API
CoreText는 안정적인 저수준 API로 iOS 업데이트에서 breaking change가 거의 없다. Bravura 폰트 로딩(`CTFontManagerRegisterFontsForURL`)도 공식 API다.

**영향 예측**: 낮음. 가장 안정적인 커스텀 렌더링 영역.

---

### 4-6. CMHeadphoneMotionManager vs. AirPods 세대
새 AirPods 세대에서 헤드 모션 API의 축(axis) 정의나 감도가 바뀔 수 있다. 현재 하드코딩된 임계값(`0.35`, `1.5초 쿨다운`)이 새 하드웨어에서 오작동할 수 있다.

**영향 예측**: 낮음. 기능이 고장나도 앱 필수 기능은 아님. 설정 가능하게 만들면 해결.

---

### 4-7. SwiftData UUID 소프트 참조 vs. SwiftData 성숙
SwiftData가 성숙하면서 `@Relationship` cascade delete가 더 안정화됐다. 현재 수동 UUID 참조 방식은 향후 SwiftData의 migration 도구나 iCloud 동기화 기능을 활용하기 어렵게 만든다.

**영향 예측**: 장기적으로 중간. 지금 당장은 문제없으나 iCloud Sync 추가 시 복잡도 급증.

---

## 5. 하드코딩된 값 목록

### 5-1. 팝오버 크기 (UIHostingController.preferredContentSize)
| 팝오버 | 크기 | 파일 |
|--------|------|------|
| 도구 선택 팝오버 | (180, 80) | EditorToolbarModule.swift |
| 색상 팔레트 팝오버 | (340, 360) | EditorToolbarModule.swift |
| 스트로크 굵기 팝오버 | (200, 88) | EditorToolbarModule.swift |
| 스티커 팔레트 팝오버 | (320, 440) | EditorToolbarModule.swift |
| 레이어 관리 팝오버 | (250, 150) | EditorToolbarModule.swift |
| 기타 팝오버 | (300, 190) | EditorToolbarModule.swift |

**권장**: `UIHostingController` sizing 옵션 또는 SwiftUI `fixedSize()`로 자동화

---

### 5-2. 레이아웃·위치 상수
| 값 | 위치 | 용도 |
|----|------|------|
| `y: 44` | EditorToolbarModule.swift | 팝오버 앵커 fallback (내비바 높이 가정) |
| `64` | ScorePDFViewController.swift | PDFThumbnailView 높이 |
| `34` | ScoreTabBar.swift | itemOverhead (탭 아이템 오버헤드) |
| `16` | ScoreTabBar.swift | 탭 바 외부 패딩 |

---

### 5-3. 스티커 렌더링 매직 넘버
| 값 | 파일 | 설명 |
|----|------|------|
| `1.35`, `0.80`, `0.31`, ... | EditorStickerRendering.swift | per-symbol 파인튜닝 배율 |
| `1.25`, `1.48`, `1.52`, `1.35`, `0.88` | EditorStickerRendering.swift | baseSize 글리프별 배율 |
| `stickerSizeScale` exempt 집합 | EditorStickerRendering.swift | 스케일 적용 제외 심볼 집합 |

**권장**: `StickerMetrics` 구조체로 분리해 각 글리프의 의도를 명시화

---

### 5-4. 인터랙션 임계값
| 값 | 파일 | 용도 |
|----|------|------|
| `0.35` | AirPodsHeadGestureInputProvider.swift | 헤드폰 기울기 감도 |
| `1.5` (초) | AirPodsHeadGestureInputProvider.swift | AirPods 제스처 쿨다운 |
| `1.2` (초) | FaceGestureInputProvider.swift | 얼굴 제스처 쿨다운 |

**권장**: `PageTurnSensitivity` 설정 화면에서 사용자가 조정할 수 있도록

---

### 5-5. 비즈니스 로직 상수
| 값 | 파일 | 용도 |
|----|------|------|
| `8` | ScoreEditorState.swift | 최근 사용 색상 최대 개수 (`maxRecentColorCount`) |

**현재 상태**: 상수명이 있으므로 양호. 설정 화면 노출 고려 가능.

---

### 5-6. 문자열 리터럴 (현지화 미처리)
| 문자열 | 파일 | 비고 |
|--------|------|------|
| `"저장소 초기화 실패"` | RootShellView.swift | alert 타이틀 — 현지화 필요 시 `LocalizedStringKey` 처리 |
| `"악보를 선택하세요"` | RootShellView.swift | EmptyState 문자열 |
| `"Add Image"`, `"Move Image"`, `"Resize Image"`, `"Delete Image"` | ScorePDFViewController+Image.swift | UndoManager action name — 영문 고정 |

---

## 요약 우선순위

| 우선순위 | 항목 | 예상 작업량 |
|---------|------|-----------|
| 🔴 즉시 | `item.value(forKey: "view")` 교체 | 중간 |
| 🔴 즉시 | `deletePiece()` 고아 레코드 정리 | 소 |
| 🟡 다음 릴리즈 | `preferredContentSize` 하드코딩 → 자동화 | 중간 |
| 🟡 다음 릴리즈 | `withObservationTracking` 패턴 검토 | 중간 |
| 🟡 다음 릴리즈 | AirPods/Face 쿨다운 사용자 설정화 | 소 |
| 🟢 장기 | ScoreTabBar → 시스템 TabView 적합성 재검토 | 대 |
| 🟢 장기 | SwiftData `@Relationship` 마이그레이션 | 대 |
| 🟢 장기 | StickerMetrics 구조체 분리 | 소 |
