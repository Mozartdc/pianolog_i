import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { Box, Button, Typography, Paper } from "@mui/material";

type Track = {
  id: number;
  title: string;
  addedDate: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD | undefined
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

type PartialCounts = {
  [trackId: number]: number;
};

function getToday() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

// 오늘 기준 주간 시작(월요일)
function getWeekStart(date: Dayjs) {
  const dayOfWeek = date.day() === 0 ? 6 : date.day() - 1;
  return date.subtract(dayOfWeek, "day").startOf("day");
}

// ✅ practiceRecords 연동 함수
function loadPracticeData() {
  const data = localStorage.getItem("practiceRecords");
  return data ? JSON.parse(data) : [];
}
function savePracticeData(data: any[]) {
  localStorage.setItem("practiceRecords", JSON.stringify(data));
}

function TrackScreen() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("tracks");
    return saved ? JSON.parse(saved) : [];
  });

  // 연습 체크 상태
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>(() => {
    const saved = localStorage.getItem("practiceChecks");
    return saved ? JSON.parse(saved) : {};
  });

  // 부분 연습 카운트
  const [partialCounts, setPartialCounts] = useState<PartialCounts>(() => {
    const saved = localStorage.getItem("partialCounts");
    return saved ? JSON.parse(saved) : {};
  });

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editInput, setEditInput] = useState("");
  const navigate = useNavigate();

  // 주간 이동/요일 선택 바 관련 상태
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentWeekStart, setCurrentWeekStart] = useState<Dayjs>(getWeekStart(dayjs()));

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    currentWeekStart.add(i, "day")
  );

  // 저장
  useEffect(() => {
    localStorage.setItem("tracks", JSON.stringify(tracks));
  }, [tracks]);
  useEffect(() => {
    localStorage.setItem("practiceChecks", JSON.stringify(practiceChecks));
  }, [practiceChecks]);
  useEffect(() => {
    localStorage.setItem("partialCounts", JSON.stringify(partialCounts));
  }, [partialCounts]);

  // 곡 추가 (추가일 기록)
  const addTrack = () => {
    if (!input.trim()) return;
    const today = getToday();
    const newTrack: Track = { id: Date.now(), title: input, addedDate: today };
    setTracks([...tracks, newTrack]);
    setInput("");
  };

  // 곡 삭제
  const removeTrack = (id: number) => {
    setTracks(tracks.filter((t) => t.id !== id));
    setPartialCounts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setPracticeChecks((prev) => {
      const copy: PracticeChecks = {};
      for (const date in prev) {
        copy[date] = { ...prev[date] };
        delete copy[date][id];
      }
      return copy;
    });
    // ✅ practiceRecords에서도 해당 곡 기록 삭제
    const prevRecords = loadPracticeData();
    const track = tracks.find(t => t.id === id);
    if (track) {
      const updated = prevRecords.filter((r: any) => r.track !== track.title);
      savePracticeData(updated);
    }
  };

  // 곡 수정
  const startEdit = (track: Track) => {
    setEditingId(track.id);
    setEditInput(track.title);
  };
  const saveEdit = (id: number) => {
    const oldTrack = tracks.find(t => t.id === id);
    setTracks(tracks.map((t) => (t.id === id ? { ...t, title: editInput } : t)));
    setEditingId(null);
    setEditInput("");
    // ✅ practiceRecords에서도 곡명 변경 반영
    if (oldTrack && oldTrack.title !== editInput) {
      const prevRecords = loadPracticeData();
      const updated = prevRecords.map((r: any) =>
        r.track === oldTrack.title ? { ...r, track: editInput } : r
      );
      savePracticeData(updated);
    }
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditInput("");
  };

  // ✅ 연습 체크 토글 (practiceRecords 연동)
  const toggleCheck = (trackId: number) => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    setPracticeChecks((prev) => {
      const dayChecks = prev[dateStr] ? { ...prev[dateStr] } : {};
      const checked = !dayChecks[trackId];
      dayChecks[trackId] = checked;
      const updated = { ...prev, [dateStr]: dayChecks };

      // practiceRecords 연동
      let practiceRecords = loadPracticeData();
      const track = tracks.find(t => t.id === trackId);
      if (checked && track) {
        // 체크 ON → 기록 추가
        practiceRecords = [
          ...practiceRecords,
          { date: dateStr, track: track.title, repeatCount: 1 }
        ];
      } else if (!checked && track) {
        // 체크 OFF → 해당 기록 삭제
        practiceRecords = practiceRecords.filter(
          (r: any) => !(r.date === dateStr && r.track === track.title)
        );
      }
      savePracticeData(practiceRecords);

      return updated;
    });
  };

  // 부분 연습 +1
  const incPartial = (trackId: number) => {
    setPartialCounts((prev) => ({
      ...prev,
      [trackId]: (prev[trackId] || 0) + 1,
    }));
  };
  // 부분 연습 -1
  const decPartial = (trackId: number) => {
    setPartialCounts((prev) => ({
      ...prev,
      [trackId]: Math.max((prev[trackId] || 0) - 1, 0),
    }));
  };

  // 곡명 클릭 → 곡별 연습 캘린더 페이지 이동
  const goToCalendar = (trackId: number) => {
    navigate(`/calendar?trackId=${trackId}`);
  };

  // 숫자 클릭 → 전자사과(반복 카운트) 페이지 이동
  const goToRepeat = (trackId: number) => {
    navigate(`/repeat?trackId=${trackId}`);
  };

  // 선택한 날짜 관련
  const selectedDateStr = selectedDate.format("YYYY-MM-DD");
  const todayStr = getToday();
  const isFuture = selectedDate.isAfter(dayjs(), "day");

  // 곡 리스트: 선택한 날짜 이전에 추가된 곡만, 그리고 완성된 곡은 제외
  const visibleTracks = tracks.filter(
    (track) =>
      track.addedDate <= selectedDateStr &&
      (!track.completedDate || selectedDateStr <= track.completedDate)
  );

  return (
    <div>
      {/* 상단 주간 이동/요일 선택 바 */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 1,
            bgcolor: "#181818",
            borderRadius: 2,
          }}
        >
          <Button
            size="small"
            onClick={() => {
              setCurrentWeekStart(currentWeekStart.subtract(1, "week"));
            }}
            sx={{ minWidth: 32, color: "#aaa" }}
          >
            &lt;
          </Button>
          {weekDays.map((date) => {
            const dateStr = date.format("YYYY-MM-DD");
            const isSelected = selectedDate.isSame(date, "day");
            const isToday = date.isSame(dayjs(), "day");
            return (
              <Box
                key={dateStr}
                sx={{
                  mx: 0.5,
                  px: 1.2,
                  py: 0.7,
                  borderRadius: 2,
                  bgcolor: isSelected ? "#7e5fff" : "transparent",
                  color: isSelected
                    ? "#fff"
                    : isToday
                    ? "#7e5fff"
                    : "#aaa",
                  fontWeight: isSelected || isToday ? "bold" : "normal",
                  cursor: "pointer",
                  border: isToday && !isSelected ? "1.5px solid #7e5fff" : "none",
                  textAlign: "center",
                  transition: "all 0.1s",
                }}
                onClick={() => setSelectedDate(date)}
              >
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  {date.format("dd")}
                </Typography>
                <Typography variant="body1" sx={{ fontSize: 18 }}>
                  {date.format("D")}
                </Typography>
              </Box>
            );
          })}
          <Button
            size="small"
            onClick={() => {
              setCurrentWeekStart(currentWeekStart.add(1, "week"));
            }}
            sx={{ minWidth: 32, color: "#aaa" }}
          >
            &gt;
          </Button>
        </Paper>
      </Box>

      <h1>트랙 관리</h1>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="곡 이름 입력"
      />
      <button onClick={addTrack}>추가</button>
      <ul>
        {visibleTracks.map((track) => (
          <li key={track.id} style={{ margin: "8px 0" }}>
            <input
              type="checkbox"
              checked={
                !!(
                  practiceChecks[selectedDateStr] &&
                  practiceChecks[selectedDateStr][track.id]
                )
              }
              onChange={() => toggleCheck(track.id)}
              disabled={isFuture}
              style={{ marginRight: 8 }}
            />
            {editingId === track.id ? (
              <>
                <input
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                <button onClick={() => saveEdit(track.id)}>저장</button>
                <button onClick={cancelEdit}>취소</button>
              </>
            ) : (
              <>
                <span
                  onClick={() => goToCalendar(track.id)}
                  style={{
                    marginRight: 8,
                    cursor: "pointer",
                    textDecoration: "underline",
                    color: "#4b72c2",
                  }}
                  title="곡별 연습 캘린더로 이동"
                >
                  {track.title}
                </span>
                <button onClick={() => decPartial(track.id)}>-</button>
                <span
                  onClick={() => goToRepeat(track.id)}
                  style={{
                    margin: "0 8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#5bb98c",
                  }}
                  title="전자사과(반복 카운트) 페이지로 이동"
                >
                  {partialCounts[track.id] || 0}
                </span>
                <button onClick={() => incPartial(track.id)}>+</button>
                <button onClick={() => startEdit(track)} style={{ marginLeft: 8 }}>
                  수정
                </button>
                <button onClick={() => removeTrack(track.id)}>삭제</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div style={{ color: "#888", fontSize: "0.9em", marginTop: 16 }}>
        <p>
          <b>체크박스:</b> 선택한 날짜의 연습 완료 여부 (통계/캘린더에 사용)
        </p>
        <p>
          <b>곡명:</b> 클릭 시 곡별 연습 캘린더로 이동
        </p>
        <p>
          <b>숫자:</b> 부분 연습 횟수 (참고용, 통계에는 미반영) <br />
          숫자 클릭 시 전자사과(반복 카운트) 페이지로 이동
        </p>
        <p>
          <b>미래 날짜:</b> 체크박스 비활성화, 체크 불가
        </p>
        <p>
          <b>과거 날짜:</b> 곡이 아직 없었다면 리스트에 안 나옴
        </p>
        <p>
          <b>완성된 곡:</b> 곡별 캘린더에서 "곡 완성" 버튼을 누르면 그 다음날부터 리스트에 안 나옴
        </p>
      </div>
    </div>
  );
}

export default TrackScreen;
