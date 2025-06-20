import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import Icon from "../components/Icon";
import "../colors.css";

type PracticeRecord = { date: string; practiceTime: number };
type PracticeChecks = Record<string, Record<string, boolean>>;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function loadPracticeData(): PracticeRecord[] {
  const data = localStorage.getItem("practiceRecords");
  return data ? JSON.parse(data) : [];
}

function loadPracticeChecks(): PracticeChecks {
  const data = localStorage.getItem("practiceChecks");
  return data ? JSON.parse(data) : {};
}

function getWeekStart(date = dayjs()) {
  const dayOfWeek = date.day() === 0 ? 6 : date.day() - 1;
  return date.subtract(dayOfWeek, "day").startOf("day");
}

function HomeScreen() {
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디봉이");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});

  // 타이머 상태
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 모달 상태
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
  const todayRecords = practiceRecords.filter(r => r.date === todayStr);
  const totalTodayMinutes = todayRecords.reduce((sum, r) => sum + Number(r.practiceTime || 0), 0);
  const todayCheckedCount = practiceChecks[todayStr]
    ? Object.values(practiceChecks[todayStr]).filter(Boolean).length
    : 0;

  const totalMinutes = practiceRecords.reduce(
    (sum, r) => sum + Number(r.practiceTime || 0),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);

  useEffect(() => {
    setPracticeRecords(loadPracticeData());
    setPracticeChecks(loadPracticeChecks());
    setNickname(localStorage.getItem("nickname") || "디봉이");
    setAvatar(localStorage.getItem("avatar") || "");
  }, []);

  // 타이머 시작
  const handleTimerStart = () => setShowTimeModal(true);

  const startTimer = () => {
    setShowTimeModal(false);
    setShowTimerModal(true);
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimerSeconds(sec => sec + 1);
    }, 1000);
  };

  // 타이머 정지 및 기록 저장
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setShowTimerModal(false);
    setShowCompleteModal(true);
    
    const addMinutes = Math.floor(timerSeconds / 60);
    if (addMinutes > 0) {
      const newRecords = practiceRecords.filter(r => r.date !== todayStr);
      const prev = todayRecords.length > 0 ? todayRecords[0].practiceTime || 0 : 0;
      newRecords.push({ date: todayStr, practiceTime: Number(prev) + addMinutes });
      setPracticeRecords(newRecords);
      localStorage.setItem("practiceRecords", JSON.stringify(newRecords));
    }
    setTimerSeconds(0);
  };

  const timerDisplay = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  return (
    <div style={{ 
      maxWidth: "375px", 
      height: "812px", 
      background: "#fff", 
      position: "relative", 
      fontFamily: "Pretendard Variable, sans-serif",
      overflow: "hidden",
      padding: "20px 16px 100px 16px"
    }}>
      {/* Header */}
      <div style={{
        position: "absolute",
        left: 1,
        top: 44,
        width: 375,
        height: 42,
        borderBottom: "1px solid #9e9c98",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <span style={{ fontSize: 17, color: "#45b5aa", fontWeight: 400, lineHeight: "140%" }}>
          digital piano gallery 피출앱
        </span>
      </div>

      {/* Date */}
      <div style={{
        position: "absolute",
        left: 14,
        top: 101,
        width: 345,
        height: 20,
        fontSize: 14,
        color: "#2d2d2a",
        textAlign: "center"
      }}>
        {today.format("YYYY. MM. DD ddd").toUpperCase()}
      </div>

      {/* Profile Avatar */}
      <div style={{
        position: "absolute",
        left: 16,
        top: 139,
        width: 80,
        height: 80,
        background: "#c7e6df",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {avatar ? (
          <img src={avatar} alt="프로필" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <Icon name="keyboard" size={32} color="#45b5aa" />
        )}
      </div>

      {/* Nickname */}
      <div style={{
        position: "absolute",
        left: 33,
        top: 226,
        width: 326,
        height: 20,
        fontSize: 16,
        color: "#2d2d2a",
        fontWeight: 600
      }}>
        {nickname}
      </div>

      {/* Cheer Message */}
      <div style={{
        position: "absolute",
        left: 102,
        top: 139,
        width: 250,
        height: 80,
        fontSize: 11,
        color: "#9e9c98",
        lineHeight: "20px"
      }}>
        {getTodayCheer()}
      </div>

      {/* Achievement Card */}
      <div style={{
        position: "absolute",
        left: 15,
        top: 269,
        width: 345,
        height: 60,
        background: "linear-gradient(180deg, #45b5aa 0%, #3ba7a0 100%)",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        padding: "16px 65px 16px 16px",
        gap: "12px"
      }}>
        <Icon name="flame" size={25} color="#fff" />
        <span style={{ fontSize: "20px", color: "#fff", fontWeight: 700 }}>
          {getStreak()}일 째 피출
        </span>
      </div>

      {/* Stats Card 1 */}
      <div style={{
        position: "absolute",
        left: 15,
        top: 336,
        width: 345,
        height: 60,
        background: "#fff",
        border: "1px solid #9e9c98",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        padding: "16px 65px 16px 16px",
        gap: "12px"
      }}>
        <Icon name="keyboard" size={24} color="#6667ab" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", color: "#9e9c98" }}>오늘의 피출 기록</span>
          <span style={{ fontSize: "12px", color: "#2d2d2a" }}>
            {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
          </span>
        </div>
        <div style={{ position: "absolute", right: "20px" }}>
          <Icon name="export" size={16} color="#2d2d2a" />
        </div>
      </div>

      {/* Stats Card 2 */}
      <div style={{
        position: "absolute",
        left: 15,
        top: 403,
        width: 345,
        height: 60,
        background: "#fff",
        border: "1px solid #9e9c98",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        padding: "16px 16px 16px 16px",
        gap: "12px"
      }}>
        <Icon name="staff" size={24} color="#6667ab" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", color: "#9e9c98" }}>오늘 연습한 곡</span>
          <span style={{ fontSize: "12px", color: "#2d2d2a" }}>
            {todayCheckedCount}/4 곡
          </span>
        </div>
      </div>

      {/* Stats Card 3 */}
      <div style={{
        position: "absolute",
        left: 15,
        top: 470,
        width: 345,
        height: 60,
        background: "#fff",
        border: "1px solid #9e9c98",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        padding: "16px 16px 16px 16px",
        gap: "12px"
      }}>
        <Icon name="trophy" size={21} color="#45b5aa" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", color: "#9e9c98" }}>총 연습 시간</span>
          <span style={{ fontSize: "12px", color: "#2d2d2a" }}>
            {totalHours}시간
          </span>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div style={{
        position: "absolute",
        left: 16,
        top: 545,
        width: 344,
        height: 56,
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(0, 0, 0, 0.04)",
        display: "flex",
        justifyContent: "space-between",
        padding: "14px"
      }}>
        {weekDays.map((date) => {
          const dateStr = date.format("YYYY-MM-DD");
          const practiced = isPracticed(dateStr);
          const isToday = dateStr === todayStr;
          
          return (
            <div
              key={dateStr}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: practiced ? "#45b5aa" : "#f5f5f5",
                color: practiced ? "#fff" : "#2d2d2a",
                fontSize: "8px",
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: isToday ? "2px solid #6667ab" : "none",
                boxSizing: "border-box"
              }}
            >
              <span>{date.format("dd")}</span>
              <span style={{ marginTop: "2px" }}>{date.format("D")}</span>
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <button
        onClick={handleTimerStart}
        style={{
          position: "absolute",
          left: "16px",
          top: "644px",
          width: "343px",
          height: "50px",
          background: "#45b5aa",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          boxShadow: "0 4px 16px rgba(69, 181, 170, 0.3)"
        }}
      >
        <Icon name="play" size={16} color="#fff" />
        드가자
      </button>

      {/* Bottom Tab Bar */}
      <div style={{
        position: "absolute",
        left: "0",
        top: "738px",
        width: "375px",
        height: "78px",
        background: "#fff",
        boxShadow: "0 -0.5px 0 rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(20px)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center"
      }}>
        {["홈", "투데이", "타이머", "통계", "설정"].map((tab, i) => (
          <div
            key={i}
            style={{
              width: "76px",
              height: "44px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: i === 0 ? "#45b5aa" : "#333",
              fontWeight: i === 0 ? "bold" : "normal"
            }}
          >
            <Icon name={i === 0 ? "home" : i === 1 ? "today" : i === 2 ? "timer" : i === 3 ? "stats" : "settings"} size={24} color={i === 0 ? "#45b5aa" : "#333"} />
            <span style={{ fontSize: "12px", marginTop: "4px" }}>{tab}</span>
          </div>
        ))}
      </div>

      {/* Time Setting Modal */}
      {showTimeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowTimeModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              width: "320px",
              maxWidth: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 600, textAlign: "center", marginBottom: "24px" }}>
              연습 시간 설정
            </h3>
            <p style={{ fontSize: "14px", color: "#9e9c98", textAlign: "center", marginBottom: "24px" }}>
              오늘 연습할 시간을 설정해주세요
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={startTimer}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "#45b5aa",
                  color: "#fff",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                시작하기
              </button>
              <button
                onClick={() => setShowTimeModal(false)}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "#9e9c98",
                  color: "#fff",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Running Modal */}
      {showTimerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              width: "320px",
              maxWidth: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 600, textAlign: "center", marginBottom: "24px" }}>
              연습 중
            </h3>
            <div style={{ textAlign: "center", fontSize: "48px", color: "#45b5aa", marginBottom: "24px", fontWeight: 700 }}>
              {timerDisplay}
            </div>
            <button
              onClick={stopTimer}
              style={{
                width: "100%",
                padding: "16px",
                background: "#45b5aa",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              연습 완료
            </button>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowCompleteModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              width: "320px",
              maxWidth: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 600, textAlign: "center", marginBottom: "24px" }}>
              연습 완료! 🎉
            </h3>
            <p style={{ fontSize: "14px", color: "#9e9c98", textAlign: "center", marginBottom: "24px" }}>
              {Math.floor(timerSeconds / 60)}분간 연습하셨습니다
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setShowShareModal(true);
                }}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "#45b5aa",
                  color: "#fff",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                공유하기
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "#9e9c98",
                  color: "#fff",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              width: "320px",
              maxWidth: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 600, textAlign: "center", marginBottom: "24px" }}>
              피출 인증
            </h3>
            <div style={{
              background: "linear-gradient(180deg, #45b5aa 0%, #3ba7a0 100%)",
              color: "#fff",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
                피퇴!
              </div>
              <p style={{ fontSize: "14px", opacity: 0.9 }}>
                {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
              </p>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                width: "100%",
                padding: "16px",
                background: "#45b5aa",
                color: "white",
                border: "none",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
