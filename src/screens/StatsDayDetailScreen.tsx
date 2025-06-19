import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";

type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

function StatsDayDetailScreen() {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();

  // 곡 목록
  const trackList: Track[] = JSON.parse(localStorage.getItem("tracks") || "[]");

  // 타이머 기록
  const practiceRecords = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
  const dayRecords = date
    ? practiceRecords.filter((r: any) => r.date === date)
    : [];

  // 곡 체크 기록
  const practiceChecks = JSON.parse(localStorage.getItem("practiceChecks") || "{}");
  const checkedTrackIds =
    date && practiceChecks[date]
      ? Object.keys(practiceChecks[date]).filter((k) => practiceChecks[date][k])
      : [];

  // trackId → 곡명 변환
  function getTrackTitleById(id: number | string) {
    const track = trackList.find((t) => String(t.id) === String(id));
    return track ? track.title : String(id);
  }

  // 타이머 기록 곡명
  const timerTracks = dayRecords.map((r: any) => r.track);

  // 체크/타이머 기록 합치기 (중복 제거, 곡명만)
  const allTrackTitles = Array.from(
    new Set([
      ...timerTracks,
      ...checkedTrackIds.map((id) => getTrackTitleById(id)),
    ])
  ) as string[];

  const totalMinutes = dayRecords.reduce((sum: number, r: any) => sum + (r.practiceTime || 0), 0);

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← 돌아가기</Button>
      <Typography variant="h5" sx={{ mb: 2 }}>{date} 연습 내역</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>
          총 연습 시간: {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분
        </Typography>
        <Typography sx={{ mt: 1, mb: 1 }}>연습한 곡:</Typography>
        <ul>
          {allTrackTitles.length === 0 ? (
            <li>연습 기록 없음</li>
          ) : (
            allTrackTitles.map((title) => <li key={title}>{title}</li>)
          )}
        </ul>
      </Paper>
    </Box>
  );
}
export default StatsDayDetailScreen;
