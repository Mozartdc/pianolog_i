import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import Icon from "../components/Icon";
import "../colors.css";

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
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디봉이");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [practiceRecords, setPracticeRecords] = useState<any[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<any>({});
  
  // 타이머 관련 상태
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

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
  const todayRecords = practiceRecords.filter(r => r.date === todayStr);
  const totalTodayMinutes = todayRecords.reduce((sum: number, r: any) => sum + Number(r.practiceTime || 0), 0);
  const todayCheckedCount = practiceChecks[todayStr]
    ? Object.values(practiceChecks[todayStr]).filter(Boolean).length
    : 0;

  const totalMinutes = practiceRecords.reduce(
    (sum: number, r: any) => sum + Number(r.practiceTime || 0),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);

  useEffect(() => {
    setPracticeRecords(loadPracticeData());
    setPracticeChecks(loadPracticeChecks());
    setNickname(localStorage.getItem("nickname") || "디봉이");
    setAvatar(localStorage.getItem("avatar") || "");
  }, []);

  // 타이머 시작/정지
  const handleTimerStart = () => {
    setTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds(sec => sec + 1);
    }, 1000);
  };

  return (
    <div className="app-container" style={{ padding: '20px' }}>
      {/* 상단 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: 'var(--BLACK)',
            margin: 0
          }}>
            digital piano gallery 피출앱
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--DARK_GRAY)',
            margin: '4px 0 0 0'
          }}>
            {today.format('YYYY. MM. DD ddd').toUpperCase()}
          </p>
        </div>
      </div>

      {/* 프로필 섹션 */}
      <div className="card" style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--PASTEL_TURQUOISE)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          {avatar ? (
            <img src={avatar} alt="프로필" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          ) : (
            <Icon name="keyboard" size={32} color="var(--TURQUOISE)" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            margin: '0 0 4px 0',
            color: 'var(--BLACK)'
          }}>
            {nickname}
          </h2>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: 'var(--TURQUOISE)'
          }}>
            {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--DARK_GRAY)',
            margin: '4px 0 0 0'
          }}>
            digital piano gallery
          </p>
        </div>
      </div>

      {/* 메인 성취 카드 - 222일째 피출 */}
      <div className="card card-turquoise" style={{ 
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <Icon name="flame" size={32} color="var(--WHITE)" />
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            margin: 0
          }}>
            {getStreak()}일 째 피출
          </h2>
        </div>
        <p style={{ 
          fontSize: '16px',
          opacity: 0.9,
          margin: 0
        }}>
          연속 연습 달성!
        </p>
      </div>

      {/* 통계 카드들 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* 오늘의 피출 기록 */}
        <div className="card card-light" style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Icon name="keyboard" size={20} color="var(--VERY_PERI)" />
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--DARK_GRAY)',
              margin: 0
            }}>
              오늘의 피출 기록
            </p>
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: 'var(--VERY_PERI)'
          }}>
            24시간
          </div>
        </div>

        {/* 오늘 연습한 곡 */}
        <div className="card card-light" style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Icon name="staff" size={20} color="var(--VERY_PERI)" />
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--DARK_GRAY)',
              margin: 0
            }}>
              오늘 연습한 곡
            </p>
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: 'var(--VERY_PERI)'
          }}>
            {todayCheckedCount}곡
          </div>
        </div>
      </div>

      {/* 총 연습 시간 */}
      <div className="card card-light" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <Icon name="trophy" size={24} color="var(--VERY_PERI)" />
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--DARK_GRAY)',
            margin: 0
          }}>
            총 연습 시간
          </p>
        </div>
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 'bold',
          color: 'var(--VERY_PERI)'
        }}>
          {totalHours}시간
        </div>
      </div>

      {/* 주간 캘린더 위젯 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          color: 'var(--BLACK)'
        }}>
          이번 주 연습 기록
        </h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          {weekDays.map((date) => {
            const dateStr = date.format("YYYY-MM-DD");
            const practiced = isPracticed(dateStr);
            const isToday = dateStr === todayStr;
            
            return (
              <div
                key={dateStr}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: practiced ? 'var(--TURQUOISE)' : 'var(--LIGHT_GRAY)',
                  color: practiced ? 'var(--WHITE)' : 'var(--DARK_GRAY)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: isToday ? '2px solid var(--VERY_PERI)' : 'none'
                }}
              >
                <div>{date.format("dd")}</div>
                <div>{date.format("D")}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 타이머 시작 버튼 */}
      <button
        onClick={handleTimerStart}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: 'var(--TURQUOISE)',
          color: 'var(--WHITE)',
          border: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(59, 171, 160)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--TURQUOISE)';
        }}
      >
        <Icon name="play" size={20} color="var(--WHITE)" />
        드가자
      </button>
    </div>
  );
}

export default HomeScreen;
