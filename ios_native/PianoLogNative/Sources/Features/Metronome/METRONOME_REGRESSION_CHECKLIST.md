# Metronome Regression Checklist

## Layout (Relative Coordinates)
- [ ] iPhone SE class width에서 상단 3버튼(박자/세분화/리듬훈련) 줄바꿈 없이 표시된다.
- [ ] iPhone Pro Max class width에서 다이얼/탭 버튼이 화면 밖으로 밀리지 않는다.
- [ ] iPad portrait/landscape에서 비트 시각화, 컨트롤 행, 다이얼 블록이 서로 겹치지 않는다.
- [ ] Dynamic Type 기본값에서 `Practice Session` 라벨과 트레이닝 상태 문구가 다이얼과 충돌하지 않는다.

## Subdivision Render Pipeline (PNG-Only)
- [ ] 세분화 아이콘은 `SubdivisionPNGs` 자산만 읽는다 (SVG/PDF 런타임 렌더 경로 없음).
- [ ] `/1, /2, /4, /8` 모든 분모에서 아이콘 누락이 없다.
- [ ] one-beat, triplet, rest 조합에서 아이콘 크기/위치가 버튼 미리보기와 모달 picker에서 일관된다.

## Audio/Visual Beat Sync
- [ ] 재생 직후 첫 박에서 소리와 비트 강조가 동시에 시작된다.
- [ ] BPM 변경 중(재생 상태) 첫 1~2박 이내에 새 템포가 반영된다.
- [ ] 일시정지 후 재생 재개 시 첫 박이 다시 밀리지 않는다.

## Gesture/Haptic Tuning
- [ ] 다이얼 느린 회전에서 미세 BPM 조정, 빠른 회전에서 가속 조정이 유지된다.
- [ ] 다이얼 햅틱이 과도하게 연속 발생하지 않는다(프레임 드랍 유발 없음).
- [ ] 버튼 탭 햅틱이 홈/투데이/메트로놈 전반에서 누락 없이 동작한다.

## Performance Smoke
- [ ] 메트로놈 탭 진입 후 초기 1초 내 인터랙션 가능 상태가 된다.
- [ ] 사운드 설정/라이브러리 시트 여닫기 반복 시 프레임 저하가 누적되지 않는다.
- [ ] 녹음 버튼 진입 시 권한 문구 누락으로 인한 크래시가 발생하지 않는다.
