import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, List, ListItem, ListItemText } from "@mui/material";
import Calendar from "react-calendar";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "react-calendar/dist/Calendar.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// 데이터 불러오기
function loadPracticeData() {
  const data = localStorage.getItem("practiceRecords");
  return data ? JSON.parse(data) : [];
}

function loadPracticeChecks() {
  const data = localStorage.getItem("practiceChecks");
  return data ? JSON.parse(data) : {};
}

// 날짜별 연습 여부
function isPracticed(dateStr: string, practiceRecords: any[], practiceChecks: any) {
  if (practiceChecks[dateStr]) {
    for (const key in practiceChecks[dateStr]) {
      if (practiceChecks[dateStr][key]) return true;
    }
  }
  if (practiceRecords.some(r => r.date === dateStr)) return true;
  return false;
}

// 주간 날짜 배열 (월~일)
function getWeekDates() {
  const today = dayjs();
  const weekStart = today.startOf("week"); // 일요일 시작
  return Array.from({ length: 7 }).map((_, i) =>
    weekStart.add(i, "day").format("YYYY-MM-DD")
  );
}

function StatsScreen() {
  const [practiceRecords, setPracticeRecords] = useState<any[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPracticeRecords(loadPracticeData());
    setPracticeChecks(loadPracticeChecks());
  }, []);

  // 달력에서 연습한 날만 강조
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      if (isPracticed(dateStr, practiceRecords, practiceChecks)) {
        return (
          <span
            style={{
              display: "block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ff9800",
              margin: "3px auto 0 auto",
            }}
          ></span>
        );
      }
    }
    return null;
  };

  // 날짜 클릭 시 상세로 이동 (또는 그래프처럼 리스트 표시)
  const handleDateClick = (date: Date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    if (isPracticed(dateStr, practiceRecords, practiceChecks)) {
      setSelectedDate(dateStr);
      // navigate(`/stats/${dateStr}`); // 기존 상세페이지 이동은 주석처리
    }
  };

  // 주간 데이터 집계
  const weekDates = getWeekDates();
  const weekData = weekDates.map(dateStr => {
    // 연습 기록
    const records = practiceRecords.filter((r: any) => r.date === dateStr);
    // 체크 기록(곡별 체크도 포함)
    const checks = practiceChecks[dateStr] ? Object.values(practiceChecks[dateStr]) : [];
    // 총 연습 시간(분)
    const totalTime = records.reduce((sum: number, r: any) => sum + Number(r.practiceTime || 0), 0);
    // 곡수: 체크된 곡 + 기록된 곡(중복제거)
    const checkedTracks = Object.keys(practiceChecks[dateStr] || {});
    const recordTracks = records.flatMap((r: any) => r.tracks || []);
    const allTracks = Array.from(new Set([...checkedTracks, ...recordTracks]));
    const trackCount = allTracks.length;

    return {
      date: dateStr.slice(5), // MM-DD
      dateFull: dateStr,
      totalTime, // 분
      trackCount,
    };
  });

  // Y축 최대값 플렉서블 계산
  const maxTime = Math.max(...weekData.map(d => d.totalTime), 180); // 3시간(180분) 이상이면 자동 확장
  const maxTracks = Math.max(...weekData.map(d => d.trackCount), 5); // 5곡 이상이면 자동 확장

  // 전체 연습 시간
  const totalMinutes = practiceRecords.reduce((sum: number, r: any) => sum + Number(r.practiceTime || 0), 0);

  // 선택된 날짜의 연습내역
  const selectedRecords = selectedDate
    ? practiceRecords.filter((r: any) => r.date === selectedDate)
    : [];

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>통계</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography>총 연습 시간: {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분</Typography>
      </Paper>

      {/* 주간 연습 시간 그래프 */}
      <Typography variant="h6" mb={1}>주간 연습 시간</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[0, Math.ceil(maxTime / 30) * 30]}
              tickFormatter={v => {
                const num = Number(v);
                return `${Math.floor(num/60)}h${num%60}m`;
              }}
            />
            <Tooltip formatter={v => {
              const num = Number(v);
              return `${Math.floor(num / 60)}시간 ${num % 60}분`;
            }} />
            <Bar
              dataKey="totalTime"
              fill="#7e5fff"
              radius={[8, 8, 0, 0]}
              onClick={(_, idx) => setSelectedDate(weekData[idx].dateFull)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* 주간 연습 곡수 그래프 */}
      <Typography variant="h6" mb={1}>주간 연습 곡수</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, Math.ceil(maxTracks / 1) * 1]} />
            <Tooltip formatter={v => `${v}곡`} />
            <Bar
              dataKey="trackCount"
              fill="#ff9800"
              radius={[8, 8, 0, 0]}
              onClick={(_, idx) => setSelectedDate(weekData[idx].dateFull)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* 월간 연습 캘린더 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>월간 연습 캘린더</Typography>
        <Calendar
          calendarType="gregory"
          locale="ko-KR"
          tileContent={tileContent}
          onClickDay={handleDateClick}
        />
        <Typography sx={{ color: "#888", fontSize: 14, mt: 1 }}>
          ● 표시가 있는 날짜만 클릭해 아래에서 상세 연습 내역을 볼 수 있습니다.
        </Typography>
      </Paper>

      {/* 선택한 날짜의 연습 내역 */}
      {selectedDate && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" mb={1}>
            {selectedDate} 연습 내역
          </Typography>
          <List>
            {selectedRecords.length === 0 && (
              <ListItem>
                <ListItemText primary="연습 기록이 없습니다." />
              </ListItem>
            )}
            {selectedRecords.map((r: any, idx: number) => (
              <ListItem key={idx}>
                <ListItemText
                  primary={`연습 시간: ${Math.floor(Number(r.practiceTime || 0) / 60)}시간 ${Number(r.practiceTime || 0) % 60}분`}
                  secondary={r.tracks ? `곡: ${r.tracks.join(", ")}` : ""}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}

export default StatsScreen;
