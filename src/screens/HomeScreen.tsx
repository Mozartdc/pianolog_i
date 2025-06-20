import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import Icon from "../components/Icon";
import ProfileUploader from "../components/ProfileUploader";
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

  // 프로필 사진 변경 핸들러
  const handleAvatarChange = (newAvatar: string) => {
    setAvatar(newAvatar);
    localStorage.setItem('avatar', newAvatar);
  };

  return (
    <div style={{ 
      maxWidth: '390px',
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: 'var(--WHITE)',
      padding: '24px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 상단 헤더 */}
      <div style={{ 
        marginBottom: '32px'
      }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: '700',
          color: 'var(--BLACK)',
          margin: '0 0 4px 0',
          lineHeight: '1.2'
        }}>
          digital piano gallery 피출앱
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--DARK_GRAY)',
          margin: 0,
          fontWeight: '400'
        }}>
          {today.format('YYYY. MM. DD ddd').toUpperCase()}
        </p>
      </div>

      {/* 프로필 섹션 */}
      <div style={{ 
        backgroundColor: 'var(--WHITE)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        display: 'flex', 
        alignItems: 'center',
        gap: '20px'
      }}>
        <ProfileUploader
          currentAvatar={avatar}
          onAvatarChange={handleAvatarChange}
          size={64}
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            margin: '0 0 8px 0',
            color: 'var(--BLACK)'
          }}>
            {nickname}
          </h2>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700',
            color: 'var(--TURQUOISE)',
            lineHeight: '1.1',
            marginBottom: '4px'
          }}>
            {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--DARK_GRAY)',
            margin: 0,
            fontWeight: '400'
          }}>
            digital piano gallery
          </p>
        </div>
      </div>

      {/* 메인 성취 카드 - 222일째 피출 */}
      <div style={{ 
        background: 'var(--TURQUOISE_GRADIENT)',
        borderRadius: '20px',
        padding: '28px 24px',
        marginBottom: '20px',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(69, 181, 170, 0.25)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <Icon name="flame" size={28} color="var(--WHITE)" />
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            margin: 0,
            color: 'var(--WHITE)'
          }}>
            {getStreak()}일 째 피출
          </h2>
        </div>
        <p style={{ 
          fontSize: '14px',
          opacity: 0.9,
          margin: 0,
          color: 'var(--WHITE)',
          fontWeight: '400'
        }}>
          연속 연습 달성!
        </p>
      </div>

      {/* 통계 카드들 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* 오늘의 피출 기록 */}
        <div style={{ 
          backgroundColor: 'var(--PASTEL_TURQUOISE)',
          borderRadius: '16px',
          padding: '20px 16px',
          textAlign: 'center',
          border: '1px solid rgba(69, 181, 170, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <Icon name="keyboard" size={16} color="var(--VERY_PERI)" />
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--DARK_GRAY)',
              margin: 0,
              fontWeight: '500'
            }}>
              오늘의 피출 기록
            </p>
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: 'var(--VERY_PERI)',
            lineHeight: '1.1'
          }}>
            24시간
          </div>
        </div>

        {/* 오늘 연습한 곡 */}
        <div style={{ 
          backgroundColor: 'var(--PASTEL_TURQUOISE)',
          borderRadius: '16px',
          padding: '20px 16px',
          textAlign: 'center',
          border: '1px solid rgba(69, 181, 170, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <Icon name="staff" size={16} color="var(--VERY_PERI)" />
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--DARK_GRAY)',
              margin: 0,
              fontWeight: '500'
            }}>
              오늘 연습한 곡
            </p>
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: 'var(--VERY_PERI)',
            lineHeight: '1.1'
          }}>
            {todayCheckedCount}곡
          </div>
        </div>
      </div>

      {/* 총 연습 시간 */}
      <div style={{ 
        backgroundColor: 'var(--PASTEL_TURQUOISE)',
        borderRadius: '16px',
        padding: '20px 24px',
        textAlign: 'center',
        marginBottom: '24px',
        border: '1px solid rgba(69, 181, 170, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Icon name="trophy" size={20} color="var(--VERY_PERI)" />
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--DARK_GRAY)',
            margin: 0,
            fontWeight: '500'
          }}>
            총 연습 시간
          </p>
        </div>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: '700',
          color: 'var(--VERY_PERI)',
          lineHeight: '1.1'
        }}>
          {totalHours}시간
        </div>
      </div>

      {/* 주간 캘린더 위젯 */}
      <div style={{ 
        backgroundColor: 'var(--WHITE)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.04)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          margin: '0 0 20px 0',
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: practiced ? 'var(--TURQUOISE)' : 'var(--LIGHT_GRAY)',
                  color: practiced ? 'var(--WHITE)' : 'var(--DARK_GRAY)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '600',
                  border: isToday ? '2px solid var(--VERY_PERI)' : 'none',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ lineHeight: '1' }}>{date.format("dd")}</div>
                <div style={{ lineHeight: '1', marginTop: '1px' }}>{date.format("D")}</div>
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
          padding: '18px',
          backgroundColor: 'var(--TURQUOISE)',
          color: 'var(--WHITE)',
          border: 'none',
          borderRadius: '16px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(69, 181, 170, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(59, 171, 160)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--TURQUOISE)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Icon name="play" size={18} color="var(--WHITE)" />
        드가자
      </button>
    </div>
  );
}

export default HomeScreen;
