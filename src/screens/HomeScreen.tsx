import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Paper, Dialog, Avatar } from "@mui/material";
import html2canvas from "html2canvas";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function loadPracticeData() {
  const data = localStorage.getItem("practiceRecords");
  return data ? JSON.parse(data) : [];
}
function loadPracticeChecks() {
  const data = localStorage.getItem("practiceChecks");
  return data ? JSON.parse(data) : {};
}
function getWeekStart(date = dayjs()) {
  const dayOfWeek = date.day() === 0 ? 6 : date.day() - 1;
  return date.subtract(dayOfWeek, "day").startOf("day");
}

function HomeScreen() {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "피출러");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [practiceRecords, setPracticeRecords] = useState<any[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<any>({});
  const shareRef = useRef<HTMLDivElement>(null);

  // 타이머 관련 상태
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  // 수동 수정 다이얼로그
  const [editOpen, setEditOpen] = useState(false);
  const [editStart, setEditStart] = useState("18:00");
  const [editEnd, setEditEnd] = useState("18:40");
  const [editError, setEditError] = useState("");

  // 주간 캘린더 데이터
  const today = dayjs();
  const weekStart = getWeekStart(today);
  const weekDays = Array.from({ length: 7 }).map((_, i) => weekStart.add(i, "day"));

  function isPracticed(dateStr: string) {
    if (practiceChecks[dateStr]) {
      for (const key in practiceChecks[dateStr]) {
        if (practiceChecks[dateStr][key]) return true;
      }
    }
    if (practiceRecords.some(r => r.date === dateStr)) return true;
    return false;
  }
  function getStreak() {
    let streak = 0;
    let day = dayjs();
    while (isPracticed(day.format("YYYY-MM-DD"))) {
      streak++;
      day = day.subtract(1, "day");
    }
    return streak;
  }

  const todayStr = getToday();
  const todayPracticed = isPracticed(todayStr);
  const todayRecords = practiceRecords.filter(r => r.date === todayStr);
  const totalTodayMinutes = todayRecords.reduce((sum: number, r: any) => sum + Number(r.practiceTime || 0), 0);

  // 응원 문구, 오늘 체크한 곡 수, 총 연습 시간
  const cheer = getTodayCheer();
  const todayCheckedCount = practiceChecks[todayStr]
    ? Object.values(practiceChecks[todayStr]).filter(Boolean).length
    : 0;

  const totalMinutes = practiceRecords.reduce(
    (sum: number, r: any) => sum + Number(r.practiceTime || 0),
    0
  );
  const totalHour = Math.floor(totalMinutes / 60);
  const totalMin = totalMinutes % 60;

  // 타이머 시작/정지 핸들러
  const handleTimerClick = () => {
    if (timerRunning) {
      // 정지: 타이머 멈추고, 오늘 연습 기록에 누적 저장
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerRunning(false);

      // 초를 분으로 변환해서 누적
      const addMinutes = Math.floor(timerSeconds / 60);
      if (addMinutes > 0) {
        const newRecords = practiceRecords.filter(r => r.date !== todayStr);
        // 기존 기록 있으면 누적, 없으면 새로
        const prev = todayRecords.length > 0 ? todayRecords[0].practiceTime || 0 : 0;
        newRecords.push({ date: todayStr, practiceTime: Number(prev) + addMinutes });
        setPracticeRecords(newRecords);
        localStorage.setItem("practiceRecords", JSON.stringify(newRecords));
      }
      setTimerSeconds(0);

      // 타이머 종료 후 바로 수정 다이얼로그 열기
      setEditStart(dayjs().subtract(addMinutes, "minute").format("HH:mm"));
      setEditEnd(dayjs().format("HH:mm"));
      setEditOpen(true);
    } else {
      // 시작: 타이머 시작
      setTimerRunning(true);
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(sec => sec + 1);
      }, 1000);
    }
  };

  // 타이머가 종료될 때 타이머 클리어
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setPracticeRecords(loadPracticeData());
    setPracticeChecks(loadPracticeChecks());
    setNickname(localStorage.getItem("nickname") || "피출러");
    setAvatar(localStorage.getItem("avatar") || "");
  }, []);

  // 수동 수정 다이얼로그 열기
  const handleOpenEdit = () => {
    // 기본값: 오늘 마지막 기록이 있으면 그 시간, 없으면 현재시간
    const now = dayjs();
    const start = now.subtract(totalTodayMinutes, "minute").format("HH:mm");
    setEditStart(start);
    setEditEnd(now.format("HH:mm"));
    setEditError("");
    setEditOpen(true);
  };

  // 수동 수정 저장
  const handleSaveEdit = () => {
    // 시작, 종료 시각을 dayjs로 변환
    const start = dayjs(`${todayStr}T${editStart}`);
    const end = dayjs(`${todayStr}T${editEnd}`);
    const diff = end.diff(start, "minute");
    if (diff <= 0) {
      setEditError("종료 시각이 시작 시각보다 같거나 빠릅니다.");
      return;
    }
    const newRecords = practiceRecords.filter(r => r.date !== todayStr);
    newRecords.push({ date: todayStr, practiceTime: diff });
    setPracticeRecords(newRecords);
    localStorage.setItem("practiceRecords", JSON.stringify(newRecords));
    setEditOpen(false);
  };

  const handleSave = async () => {
    if (!shareRef.current) return;
    const canvas = await html2canvas(shareRef.current, { background: "#fff" });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg");
    link.download = `피퇴_${getToday()}.jpg`;
    link.click();
  };

  // 타이머 시간 표시 (mm:ss)
  const timerDisplay = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
      {/* 프로필란 */}
      <Paper sx={{ p: 2, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar src={avatar} sx={{ width: 56, height: 56, mr: 2 }} />
        <Box>
          <Typography variant="h6">{nickname}</Typography>
          <Typography sx={{ color: "#888", fontSize: 15 }}>digital piano gallery</Typography>
        </Box>
      </Paper>

      {/* 응원 문구 + 오늘 체크한 곡/총 연습 시간 카드 */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: "#f5f4fc" }}>
        <Typography sx={{ color: "#7e5fff", fontWeight: "bold", fontSize: 20, textAlign: "center" }}>
          {cheer}
        </Typography>
      </Paper>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Paper sx={{ flex: 1, p: 2, textAlign: "center", bgcolor: "#f5f4fc" }}>
          <Typography sx={{ fontSize: 15, color: "#888" }}>오늘 체크한 곡</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: "bold", color: "#7e5fff" }}>
            {todayCheckedCount}
          </Typography>
        </Paper>
        {/* 총 연습 시간 카드: 클릭 시 타이머 시작/정지, 우클릭(길게 누르기)로 수동 수정 */}
        <Paper
          sx={{
            flex: 1,
            p: 2,
            textAlign: "center",
            bgcolor: timerRunning ? "#ffe0b2" : "#f5f4fc",
            cursor: "pointer",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: 4 }
          }}
          onClick={handleTimerClick}
          onContextMenu={e => { e.preventDefault(); handleOpenEdit(); }} // 우클릭(모바일은 롱프레스)으로 수정
        >
          <Typography sx={{ fontSize: 15, color: "#888" }}>
            총 연습 시간
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: "bold", color: "#7e5fff" }}>
            {timerRunning
              ? timerDisplay
              : (totalHour > 0 ? `${totalHour}시간 ` : "") + `${totalMin}분`
            }
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#aaa" }}>
            {timerRunning ? "누르면 정지/저장" : "누르면 타이머 시작 / (길게 누르면 수정)"}
          </Typography>
        </Paper>
      </Box>

      {/* today */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: "#f7f7ff" }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
        today
        </Typography>
        <Typography>
          {todayPracticed
            ? `오늘 피출 완료! (${Math.floor(totalTodayMinutes / 60)}시간 ${totalTodayMinutes % 60}분)`
            : "아직 오늘 피출 기록이 없습니다."}
        </Typography>
      </Paper>

      {/* 주간 캘린더 */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: "#fff8e1" }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          이번 주 연습 캘린더
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          {weekDays.map((date) => {
            const dateStr = date.format("YYYY-MM-DD");
            const practiced = isPracticed(dateStr);
            return (
              <Box
                key={dateStr}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: practiced ? "#ff9800" : "#eee",
                  color: practiced ? "#fff" : "#aaa",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: 16,
                  border: practiced ? "2px solid #ff9800" : "2px solid #eee",
                  position: "relative"
                }}
              >
                <div style={{ fontSize: 12 }}>{date.format("dd")}</div>
                <div>{date.format("D")}</div>
                {practiced && (
                  <span style={{ fontSize: 14, position: "absolute", top: 2, right: 2 }}>✔️</span>
                )}
              </Box>
            );
          })}
        </Box>
        <Typography sx={{ color: "#ff9800", fontWeight: "bold", mt: 1 }}>
          🔥 {getStreak()}일 연속 피출!
        </Typography>
      </Paper>

      {/* 피출 공유 버튼 */}
      <Button
        variant="contained"
        sx={{ width: "100%", bgcolor: "#ff9800", color: "#fff", mt: 3 }}
        onClick={() => setOpen(true)}
      >
        피출 공유
      </Button>

      {/* 피퇴! 카드 팝업 */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box ref={shareRef} sx={{
          p: 3,
          bgcolor: "#fff",
          borderRadius: 3,
          minWidth: 320,
          textAlign: "center",
          position: "relative"
        }}>
          <Typography sx={{ fontWeight: 700, color: "#888", mb: 1 }}>
            digital piano gallery
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1, color: "#ff9800" }}>
            피퇴!
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 2 }}>
            {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
          </Typography>
          {avatar && (
            <img
              src={avatar}
              alt="프로필"
              style={{ width: 48, height: 48, borderRadius: "50%", margin: "0 auto" }}
            />
          )}
          <Typography sx={{ fontWeight: 600, mt: 1 }}>{nickname}</Typography>
          <img
            src="/src/utils/img/logo.png"
            alt="digital piano gallery"
            style={{
              width: 120,
              maxWidth: "70%",
              margin: "24px auto 0 auto",
              display: "block",
              opacity: 0.16,
              pointerEvents: "none",
              zIndex: 0
            }}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, p: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            저장
          </Button>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </Box>
      </Dialog>

      {/* === 수동 수정 다이얼로그 === */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <Box sx={{ p: 3, minWidth: 280 }}>
          <Typography sx={{ mb: 2, fontWeight: "bold" }}>오늘 연습 시간 직접 수정</Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, mb: 0.5 }}>시작 시각</Typography>
              <input
                type="time"
                value={editStart}
                onChange={e => setEditStart(e.target.value)}
                style={{ width: "100%", fontSize: 18, padding: 8 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, mb: 0.5 }}>종료 시각</Typography>
              <input
                type="time"
                value={editEnd}
                onChange={e => setEditEnd(e.target.value)}
                style={{ width: "100%", fontSize: 18, padding: 8 }}
              />
            </Box>
          </Box>
          {editError && (
            <Typography sx={{ color: "red", mb: 1, fontSize: 14 }}>{editError}</Typography>
          )}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
            >
              저장
            </Button>
            <Button variant="outlined" onClick={() => setEditOpen(false)}>
              취소
            </Button>
          </Box>
        </Box>
      </Dialog>
      {/* === 끝 === */}
    </Box>
  );
}

export default HomeScreen;
