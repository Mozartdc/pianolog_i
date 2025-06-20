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

  // 모달 상태
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  // 타이머 시작 핸들러
  const handleTimerStart = () => {
    setShowTimeModal(true);
  };

  // 타이머 시작 확인
  const startTimer = () => {
    setShowTimeModal(false);
    setShowTimerModal(true);
    setTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds(sec => sec + 1);
    }, 1000);
  };

  // 타이머 정지
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setShowTimerModal(false);
    setShowCompleteModal(true);
    
    // 연습 기록 저장
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

  // 타이머 시간 표시
  const timerDisplay = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="app-container">
      {/* 상단 헤더 */}
      <header className="mb-xl">
        <h1 className="text-large mb-xs">digital piano gallery 피출앱</h1>
        <p className="text-tiny text-gray">
          {today.format('YYYY. MM. DD ddd').toUpperCase()}
        </p>
      </header>

      {/* 프로필 섹션 (읽기 전용) */}
      <div className="card-base mb-lg">
        <div className="flex flex-gap-md">
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--RADIUS_CIRCLE)',
            backgroundColor: 'var(--PASTEL_TURQUOISE)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {avatar ? (
              <img src={avatar} alt="프로필" style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: 'var(--RADIUS_CIRCLE)',
                objectFit: 'cover'
              }} />
            ) : (
              <Icon name="keyboard" size={32} color="var(--TURQUOISE)" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="text-medium mb-xs">{nickname}</h2>
            <div className="text-large text-turquoise mb-xs">
              {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
            </div>
            <p className="text-tiny text-gray">digital piano gallery</p>
          </div>
        </div>
      </div>

      {/* 메인 성취 카드 */}
      <div className="card-turquoise mb-lg">
        <div className="flex-center flex-gap-sm mb-sm">
          <Icon name="flame" size={28} color="var(--WHITE)" />
          <h2 className="text-large">{getStreak()}일 째 피출</h2>
        </div>
        <p className="text-small" style={{ opacity: 0.9, textAlign: 'center' }}>
          연속 연습 달성!
        </p>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid-2x1 mb-lg">
        <div className="card-light">
          <div className="flex-center flex-gap-sm mb-sm">
            <Icon name="keyboard" size={16} color="var(--VERY_PERI)" />
            <p className="text-tiny text-gray">오늘의 피출 기록</p>
          </div>
          <div className="text-large text-peri" style={{ textAlign: 'center' }}>
            {Math.floor(totalTodayMinutes / 60)}시간
          </div>
        </div>
        <div className="card-light">
          <div className="flex-center flex-gap-sm mb-sm">
            <Icon name="staff" size={16} color="var(--VERY_PERI)" />
            <p className="text-tiny text-gray">오늘 연습한 곡</p>
          </div>
          <div className="text-large text-peri" style={{ textAlign: 'center' }}>
            {todayCheckedCount}곡
          </div>
        </div>
      </div>

      {/* 총 연습 시간 카드 */}
      <div className="card-light mb-lg">
        <div className="flex-center flex-gap-sm mb-sm">
          <Icon name="trophy" size={20} color="var(--VERY_PERI)" />
          <p className="text-tiny text-gray">총 연습 시간</p>
        </div>
        <div className="text-large text-peri" style={{ textAlign: 'center' }}>
          {totalHours}시간
        </div>
      </div>

      {/* 주간 캘린더 위젯 */}
      <div className="card-base mb-xl">
        <h3 className="text-medium mb-lg">이번 주 연습 기록</h3>
        <div className="flex-between">
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
                  borderRadius: 'var(--RADIUS_CIRCLE)',
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
      <button className="btn-primary" onClick={handleTimerStart}>
        <Icon name="play" size={18} color="var(--WHITE)" />
        드가자
      </button>

      {/* 시간 설정 모달 */}
      {showTimeModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowTimeModal(false)}>
          <div className="modal-container slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-medium mb-lg" style={{ textAlign: 'center' }}>
              연습 시간 설정
            </h3>
            <p className="text-small text-gray mb-lg" style={{ textAlign: 'center' }}>
              오늘 연습할 시간을 설정해주세요
            </p>
            <div className="flex flex-gap-sm">
              <button className="btn-primary" onClick={startTimer}>
                시작하기
              </button>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--MEDIUM_GRAY)' }}
                onClick={() => setShowTimeModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 타이머 실행 모달 */}
      {showTimerModal && (
        <div className="modal-overlay fade-in">
          <div className="modal-container slide-up">
            <h3 className="text-medium mb-lg" style={{ textAlign: 'center' }}>
              연습 중
            </h3>
            <div className="text-large mb-lg" style={{ 
              textAlign: 'center', 
              fontSize: '48px',
              color: 'var(--TURQUOISE)'
            }}>
              {timerDisplay}
            </div>
            <button className="btn-primary" onClick={stopTimer}>
              연습 완료
            </button>
          </div>
        </div>
      )}

      {/* 연습 완료 모달 */}
      {showCompleteModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowCompleteModal(false)}>
          <div className="modal-container slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-medium mb-lg" style={{ textAlign: 'center' }}>
              연습 완료! 🎉
            </h3>
            <p className="text-small text-gray mb-lg" style={{ textAlign: 'center' }}>
              {Math.floor(timerSeconds / 60)}분간 연습하셨습니다
            </p>
            <div className="flex flex-gap-sm">
              <button className="btn-primary" onClick={() => {
                setShowCompleteModal(false);
                setShowShareModal(true);
              }}>
                공유하기
              </button>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--MEDIUM_GRAY)' }}
                onClick={() => setShowCompleteModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공유 모달 */}
      {showShareModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowShareModal(false)}>
          <div className="modal-container slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-medium mb-lg" style={{ textAlign: 'center' }}>
              피출 인증
            </h3>
            <div className="card-turquoise mb-lg">
              <div className="text-large mb-sm" style={{ textAlign: 'center' }}>
                피퇴!
              </div>
              <p className="text-small" style={{ textAlign: 'center', opacity: 0.9 }}>
                {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
              </p>
            </div>
            <button className="btn-primary" onClick={() => setShowShareModal(false)}>
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
