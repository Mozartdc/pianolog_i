// src/utils/cheers.ts
const cheersList = [
  "드가자!",
  "고고혓!",
  "디피갤 피출앱과 함께 파이팅!",
  "포기하지 않는 당신이 최고!",
  "연습은 배신하지 않는다!",
  // ...추가 가능
];

export function getTodayCheer() {
  const today = new Date();
  const idx = today.getDate() % cheersList.length;
  return cheersList[idx];
}
