# Today 1:1 Parity Spec (PWA 기준 고정)

이 문서는 `src/screens/Today.tsx`를 기준으로, 네이티브 변환 시 화면/기능/데이터 흐름을 1:1로 유지하기 위한 고정 스펙이다.

## 1. 화면 구조 (순서/배치 고정)

1. 상단 고정 헤더 (`Header title="today"`).
2. 헤더 아래 스크롤 영역:
   - `WeekCalendar`
   - `PracticeItem` 리스트
3. 하단 고정 `SongPlus` 플로팅 버튼.
4. 모달 계층:
   - 연습곡 추가 모달
   - TrackDetailModal
   - TodayCalendarModal

## 2. Today 리스트 표시 규칙 (핵심)

트랙은 아래 조건 중 하나를 만족하면 표시:

- `addedDate <= selectedDate` AND (`completedDate`가 없거나 `completedDate >= selectedDate`)
- 또는 `practiceChecks[selectedDate][track.id] == true`

즉, 완료/추가일 범위를 벗어나도 해당 날짜에 체크 기록이 있으면 보인다.

## 3. 아이템 데이터 계산 규칙

- subtitle: `오늘로 {daysSince}일째`
  - `daysSince = dayjs().diff(addedDate, "day") + 1`
- checked: `practiceChecks[selectedDate][track.id]` (없으면 false)
- count: `partialCounts[selectedDate][track.id]` (없으면 0)

## 4. 상호작용 규칙

- 체크 아이콘 탭: `toggleCheck(selectedDate, trackId)`
- `+`: `incPartial(selectedDate, trackId)`
- `-`: `decPartial(selectedDate, trackId)`
- 제목 탭: `TrackDetailModal` 오픈
- count 탭: `/timer?trackId={id}` 이동
- 메뉴 수정: `updateTrackTitle`
- 메뉴 삭제: confirm 후 `removeTrack`

## 5. 모달 전환 규칙

- TrackDetail -> Calendar 상세 진입:
  - TrackDetail 닫기
  - TodayCalendarModal 열기
- Calendar 닫기:
  - Calendar 닫기
  - `selectedTrackId`가 있으면 TrackDetail 다시 열기

## 6. 현재 코드 기준 저장소(단일 소스)

- 데이터 소스: `PracticeDataContext`
  - `tracks`
  - `practiceChecks`
  - `partialCounts`
  - `practiceRecords`
- Today는 직접 상태를 소유하지 않고 Context 액션만 호출한다.

## 7. 네이티브 변환 시 필수 검증 항목

1. 선택 날짜별 가시성 규칙이 동일한지
2. 체크/카운트 반영 즉시 리스트에 반영되는지
3. TrackDetail <-> Calendar 왕복이 동일한지
4. 타이머 이동 파라미터(`trackId`)가 동일한지
5. 앱 재시작 후 데이터 복원 시 결과가 동일한지
