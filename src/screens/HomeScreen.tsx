import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import { HomeStartTimerModal } from "./HomeStartTimerModal";
import { TimePickModal } from "./TimePickModal";
import { HomeStopModal } from "./HomeStopModal";
import { ExportCardModal } from "./ExportCardModal";
import { usePracticeData } from "../contexts/PracticeDataContext";
import Header from "../components/Header";
import ProfileSection from "../components/ProfileSection";
import StatsCard from "../components/StatsCard";
import WeekCalendar from "../components/WeekCalendar";
import './Home.css';

import KeyboardIcon from "../assets/icons/keyboard.svg?react";
import StaffIcon from "../assets/icons/staff.svg?react";
import TrophyIcon from "../assets/icons/trophy.svg?react";
import FlameIcon from "../assets/icons/flame.svg?react";
import ExportIcon from "../assets/icons/export.svg?react";
import Lottie from 'lottie-react';
import playButtonAnimation from '../assets/playbutton.json';
import { useLocation } from "react-router-dom";
import { specialEvents, getTodayEvents, getTodayCheerData, CheerData } from "../utils/specialEvents";
import { validateTimeSettings, logTimeInfo } from "../utils/timeValidation";

// 타입 정의
interface PracticeRecord {
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  id: string;
  memo?: string;
  track?: string;
}

type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

type PracticeChecks = {
  [date: string]: {
    [key: string]: boolean;
  };
};

// 한국 공휴일 계산 함수
const getKoreanHolidays = (year: number): string[] => {
  const holidays = [
    `${year}-01-01`, `${year}-03-01`, `${year}-05-05`, `${year}-06-06`,
    `${year}-08-15`, `${year}-10-03`, `${year}-10-09`, `${year}-12-25`,
  ];
  if (year === 2025) {
    holidays.push(
      '2025-01-28', '2025-01-29', '2025-01-30',
      '2025-05-13', '2025-09-06', '2025-09-07', '2025-09-08'
    );
  }
  return holidays;
};

// localStorage 안전 함수들
const safeLocalStorageGet = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`localStorage get error for key ${key}:`, e);
    return defaultValue;
  }
};

const safeLocalStorageSet = (key: string, value: any) => {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > 5 * 1024 * 1024) {
      console.warn(`Data too large for localStorage key ${key}`);
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      cleanupTemporaryData();
    } else {
      console.error(`localStorage set error for key ${key}:`, e);
    }
    return false;
  }
};

// 임시 데이터 정리 함수
const cleanupTemporaryData = () => {
  try {
    const savedCheers = localStorage.getItem('temporaryCheers');
    if (savedCheers) {
      const cheers = JSON.parse(savedCheers);
      const now = new Date();
      const validCheers = cheers.filter((cheer: CheerData) => {
        if (!cheer.expiresAt) return true;
        return new Date(cheer.expiresAt) > now;
      });
      if (validCheers.length < cheers.length) {
        localStorage.setItem('temporaryCheers', JSON.stringify(validCheers));
      }
    }
    const oneYearAgo = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
    const practiceRecords = safeLocalStorageGet('practiceRecords', []);
    if (Array.isArray(practiceRecords)) {
      const recentRecords = practiceRecords.filter((record: PracticeRecord) =>
        record.date >= oneYearAgo
      );
      if (recentRecords.length < practiceRecords.length) {
        safeLocalStorageSet('practiceRecords', recentRecords);
      }
    }
  } catch (e) {
    console.error('Cleanup error:', e);
  }
};

function HomeScreen() {
  const location = useLocation();

  // ✅ Context에서 타이머 상태와 메서드들 가져오기
  const { 
    practiceRecords, setPracticeRecords, tracks, practiceChecks,
    timerActive, timerSeconds, timerMilliseconds, timerRunning, timerStartTime,
    startSession, pauseSession, resumeSession, completeSession, updateTimerStartTime
  } = usePracticeData();

  // 스크롤 방지
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/home') {
      const originalBodyStyle = document.body.style.cssText;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';

      return () => {
        document.body.style.cssText = originalBodyStyle;
      };
    }
  }, [location.pathname]);

  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [cheerData, setCheerData] = useState<CheerData>(getTodayCheerData());
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));

  // 모달 상태들
  const [showTimePickModal, setShowTimePickModal] = useState(false);
  const [showHomeStopModal, setShowHomeStopModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const playLottieRef = useRef<any>(null);

  // ✅ 제거된 상태들: 모든 타이머 관련 로컬 상태 제거
  // - timerMilliseconds, timerRef, actualStartTime, pausedDuration, isCompleting, fromStopModal 등

  const [fromStopModal, setFromStopModal] = useState(false);

  useEffect(() => {
    cleanupTemporaryData();
  }, []);

  // ✅ 타이머 복원 로직 완전 제거 - Context가 담당

  // 응원 메시지 롤링
  useEffect(() => {
    const cheerInterval = setInterval(() => {
      setCheerData(getTodayCheerData());
    }, 86400000);
    return () => clearInterval(cheerInterval);
  }, []);

  // localStorage 변경 감지 (닉네임, 아바타)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAvatar = localStorage.getItem("avatar") || "";
      const currentNickname = localStorage.getItem("nickname") || "디붕이";
      if (currentAvatar !== avatar) setAvatar(currentAvatar);
      if (currentNickname !== nickname) setNickname(currentNickname);
    }, 5000);
    return () => { clearInterval(interval); };
  }, [avatar, nickname]);

  // 기타
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTimePickModal(false);
        setShowHomeStopModal(false);
        setShowExportModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // ✅ timerRef 정리 로직 제거 - Context가 담당
    };
  }, []);

  // ✅ 새로운 단순화된 타이머 메서드들 - Context 메서드 직접 호출
  const handleStartTimer = () => {
    console.log('🎯 HomeScreen: 타이머 시작 요청');
    startSession();
  };

  const handlePauseTimer = () => {
    console.log('🎯 HomeScreen: 타이머 일시정지 요청');
    pauseSession();
  };

  const handleResumeTimer = () => {
    console.log('🎯 HomeScreen: 타이머 재시작 요청');
    resumeSession();
  };

  const handleCompleteTimer = () => {
    console.log('🎯 HomeScreen: 타이머 완료 모달 표시');
    setShowHomeStopModal(true);
  };

  const handleEditTimer = () => {
    console.log('🎯 HomeScreen: 타이머 수정 모달 표시');
    setFromStopModal(false);
    setShowTimePickModal(true);
  };

  // ✅ 수정된 시간 업데이트 핸들러 - Context의 timerV2와 연동
  const handleTimeSave = (startTimestamp: number, endTimestamp: number) => {
    console.log('HomeScreen 시간 저장:', {
      startTimestamp,
      endTimestamp,
      startFormatted: dayjs(startTimestamp).format('YYYY-MM-DD HH:mm'),
      endFormatted: dayjs(endTimestamp).format('YYYY-MM-DD HH:mm'),
      currentSelectedDate: selectedDate
    });

    // ✅ 강화된 미래 시간 검증
    const now = Date.now();
    const oneMinuteLater = now + 60 * 1000;

    if (startTimestamp > oneMinuteLater) {
      alert("피출 시간은 현재 시간보다 미래로 설정할 수 없습니다.");
      return;
    }

    if (endTimestamp > oneMinuteLater) {
      alert("피퇴 시간은 현재 시간보다 미래로 설정할 수 없습니다.");
      return;
    }

    const validation = validateTimeSettings(startTimestamp, endTimestamp);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const newDurationSeconds = (endTimestamp - startTimestamp) / 1000;
    const newPracticeTime = Math.floor(newDurationSeconds / 60);
    logTimeInfo('HomeScreen 시간 저장', startTimestamp, endTimestamp);

    const recordDate = dayjs(startTimestamp).format("YYYY-MM-DD");
    const dateChanged = recordDate !== selectedDate;
    
    if (dateChanged) {
      console.log('📅 날짜 변경 감지:', {
        기존날짜: selectedDate,
        새날짜: recordDate
      });
      setSelectedDate(recordDate);
    }

    // ✅ Context에서 timerV2 상태 읽어서 sessionId 가져오기
    const timerV2 = safeLocalStorageGet('timerV2', {});
    const sessionId = timerV2.sessionId || dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8);

    const newRecord: PracticeRecord = {
      id: sessionId,
      date: recordDate,
      practiceTime: newPracticeTime,
      startTime: startTimestamp,
      endTime: endTimestamp,
      memo: timerV2.memo || ""
    };

    setPracticeRecords(prev => {
      const existingRecordIndex = prev.findIndex(record => record.id === newRecord.id);
      let updatedRecords;
      if (existingRecordIndex > -1) {
        updatedRecords = [...prev];
        updatedRecords[existingRecordIndex] = newRecord;
      } else {
        updatedRecords = [...prev, newRecord];
      }
      return updatedRecords;
    });

    // ✅ Context의 timerV2 상태 업데이트 (수동으로 localStorage 조작)
    // ✅ Context 메서드로 시작시간 수정
    updateTimerStartTime(startTimestamp);

    if (!fromStopModal) {
      setShowTimePickModal(false);
    }
    
    console.log('📝 시간 수정 완료:', {
      새시작시간: dayjs(startTimestamp).format('YYYY-MM-DD HH:mm'),
      새종료시간: dayjs(endTimestamp).format('YYYY-MM-DD HH:mm'),
      새날짜: recordDate,
      설정된시간: newPracticeTime + '분'
    });
  };

  const handlePracticeComplete = () => {
    console.log('🎯 HomeScreen: 연습 완료 처리');
    
    // ✅ HomeStopModal에서 저장한 memo 읽기
    const timerV2 = safeLocalStorageGet('timerV2', {});
    const memo = timerV2.memo || '';
    
    // ✅ Context 메서드로 완료 처리
    completeSession(memo);
    
    setShowHomeStopModal(false);
  };

  const handleEditTimeFromStop = () => {
    console.log('🎯 HomeScreen: 피퇴모달에서 시간 수정');
    setShowHomeStopModal(false);
    setFromStopModal(true);
    setShowTimePickModal(true);
  };

  const handleReturnToStopModal = () => {
    console.log('🎯 HomeScreen: 피퇴모달로 복귀');
    setShowTimePickModal(false);
    setFromStopModal(false);
    setShowHomeStopModal(true);
  };

  // ✅ 나머지 계산 로직들 (변경 없음)
  const today = dayjs();
  const todayStr = today.format("YYYY-MM-DD");
  const displayDate = dayjs(selectedDate);
  const selectedDateFormatted = displayDate.format("YYYY년 MM월 DD일");
  const selectedDateRecords = Array.isArray(practiceRecords)
    ? practiceRecords.filter((r: PracticeRecord) => r.date === selectedDate)
    : [];
  const selectedDateMinutes = selectedDateRecords.reduce((sum: number, r: PracticeRecord) => sum + Number(r.practiceTime || 0), 0);
  const selectedDateCheckedCount = (() => {
    try {
      const visibleTracksForDate = tracks.filter(
        (track) => {
          const addedBeforeOrOn = dayjs(track.addedDate).isSameOrBefore(selectedDate, "day");
          const notCompletedOrCompletedAfter = !track.completedDate ||
                                              dayjs(track.completedDate).isSameOrAfter(selectedDate, "day");
          
          const hasPracticeOnDate = practiceChecks[selectedDate] && 
                                   practiceChecks[selectedDate][track.id];
          
          return (addedBeforeOrOn && notCompletedOrCompletedAfter) || hasPracticeOnDate;
        }
      );
      const denominator = visibleTracksForDate.length;
      const checksForDate = practiceChecks[selectedDate];
      if (!checksForDate) return { numerator: 0, denominator };
      const numerator = visibleTracksForDate.filter(track =>
        checksForDate[track.id]
      ).length;
      return { numerator, denominator };

    } catch (error) {
      console.error("practiceChecks 읽기 실패:", error);
      return { numerator: 0, denominator: tracks.length };
    }
  })();
  
  const todayRecords = Array.isArray(practiceRecords)
    ? practiceRecords.filter((r: PracticeRecord) => r.date === todayStr)
    : [];
  const totalMinutes = Array.isArray(practiceRecords)
    ? practiceRecords.reduce((sum: number, r: PracticeRecord) => sum + Number(r.practiceTime || 0), 0)
    : 0;
  const totalHours = Math.floor(totalMinutes / 60);

  const getStreak = (): number => {
    if (!Array.isArray(practiceRecords)) return 0;
    let streak = 0;
    let day = dayjs();
    try {
      const todayPracticed = practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"));
      if (todayPracticed) {
        while (practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"))) {
          streak++;
          day = day.subtract(1, "day");
          if (streak > 365) break;
        }
      } else {
        day = day.subtract(1, "day");
        while (practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"))) {
          streak++;
          day = day.subtract(1, "day");
          if (streak > 365) break;
        }
      }
    } catch (error) {
      console.error("getStreak 계산 실패:", error);
      return 0;
    }
    return streak;
  };

  const handleDateClick = (dateStr: string) => { setSelectedDate(dateStr); };
  const handleExport = () => { setShowExportModal(true); };

  // 공통 폰트 스타일
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: "100%",
      minHeight: "100vh",
      background: "var(--bg-primary)",
      overflowX: "hidden",
      overflowY: "hidden",
      margin: "0 auto",
      padding: "0",
      boxSizing: "border-box",
      ...commonFontStyle
    }}>
      {/* Header */}
      <div style={{ width: "calc(100% - 32px)", margin: "0 auto" }}>
        <Header
          title="digital piano gallery 피출앱"
          color="var(--TURQUOISE)"
          topMargin={5}
        />
      </div>
      
      {/* Date Display */}
      <div style={{
        width: "100%",
        height: 20,
        fontSize: 14,
        color: "var(--text-primary)",
        textAlign: "center",
        lineHeight: "20px",
        marginTop: "12px",
        padding: "0 16px",
        boxSizing: "border-box",
        ...commonFontStyle
      }}>
        {displayDate.format("YYYY. MM. DD ddd").toLowerCase()}
      </div>

      {/* Profile Section */}
      <ProfileSection avatar={avatar} nickname={nickname} cheerData={cheerData} />

      {/* Total Achievement Card */}
      <div style={{
        width: "calc(100% - 32px)",
        height: 60,
        background: "var(--PASTEL_TURQUOISE)",
        borderRadius: "var(--border-radius-large)",
        display: "flex",
        alignItems: "center",
        padding: "16px",
        gap: 12,
        margin: "20px auto 0 auto",
        boxSizing: "border-box"
      }}>
        <FlameIcon width={25} height={25} />
        <span style={{
          fontSize: 20,
          color: "var(--text-primary)",
          lineHeight: "20px",
          ...commonFontStyle
        }}>
          {getStreak()}일 연속 피출
        </span>
      </div>

      {/* Stats Cards */}
      <StatsCard
        Icon={KeyboardIcon}
        iconColor="var(--TURQUOISE)"
        iconAlt="keyboard"
        iconWidth={24}
        iconHeight={24}
        title={selectedDate === todayStr ? "오늘의 피출 기록" : `${dayjs(selectedDate).format("YY.MM.DD")} 피출 기록`}
        value={`${Math.floor(selectedDateMinutes / 60)}시간 ${selectedDateMinutes % 60}분`}
        showExportIcon={true}
        ExportIcon={ExportIcon}
      />
      <StatsCard
        Icon={StaffIcon}
        iconColor="var(--TURQUOISE)"
        iconAlt="staff"
        iconWidth={24}
        iconHeight={24}
        title={selectedDate === todayStr ? "오늘 연습한 곡" : `${dayjs(selectedDate).format("YY.MM.DD")} 연습한 곡`}
        value={`${selectedDateCheckedCount.numerator}/${selectedDateCheckedCount.denominator} 곡`}
      />
      <StatsCard
        Icon={TrophyIcon}
        iconColor="var(--TURQUOISE)"
        iconAlt="trophy"
        iconWidth={21}
        iconHeight={21}
        title="누적 연습 시간"
        value={`${totalHours}시간`}
      />

      {/* Week Calendar */}
      <WeekCalendar
        selectedDate={selectedDate}
        practiceRecords={practiceRecords}
        onDateClick={handleDateClick}
        getKoreanHolidays={getKoreanHolidays}
        themePastelColor="var(--PASTEL_TURQUOISE)"
      />

      {/* Start Button - ✅ 단순화된 로직 */}
      {!timerActive && (
        <div style={{
          width: 100,
          height: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "0px auto 0 auto"
        }}>
          <button
            onClick={handleStartTimer}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "var(--transition-fast)"
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Lottie
                lottieRef={playLottieRef}
                animationData={playButtonAnimation}
                loop
                autoplay
                renderer="svg"
                rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          </button>
        </div>
      )}

      {/* Modals - ✅ 새로운 핸들러들 사용 */}
      {timerActive && (
        <HomeStartTimerModal
          timerSeconds={timerSeconds}
          timerMilliseconds={timerMilliseconds}
          isRunning={timerRunning}
          onPause={handlePauseTimer}
          onResume={handleResumeTimer}
          onComplete={handleCompleteTimer}
          onEdit={handleEditTimer}
        />
      )}

     {showTimePickModal && (
        <TimePickModal
          isOpen={showTimePickModal}
          onClose={() => {
            setShowTimePickModal(false);
            setFromStopModal(false);
          }}
          onSave={handleTimeSave}
          actualStartTime={timerStartTime}
          actualEndTime={timerStartTime ? timerStartTime + timerMilliseconds : null}
          fromStopModal={fromStopModal}
          onReturnToStopModal={handleReturnToStopModal}
        />
      )}

      {showHomeStopModal && (
        <HomeStopModal
          isOpen={showHomeStopModal}
          practiceTime={`${Math.floor(timerSeconds / 3600)}시간 ${Math.floor((timerSeconds % 3600) / 60)}분`}
          onComplete={handlePracticeComplete}
          onEditTime={handleEditTimeFromStop}
          onClose={() => setShowHomeStopModal(false)}
        />
      )}

      {showExportModal && (
        <ExportCardModal
          isOpen={showExportModal}
          nickname={nickname}
          date={displayDate.format("YYYY. MM. DD ddd").toUpperCase()}
          practiceTime={`${Math.floor(selectedDateMinutes / 60)}시간 ${selectedDateMinutes % 60}분`}
          avatar={avatar}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

// 임시 응원 메시지 추가 함수
export function addTemporaryCheer(cheerData: CheerData) {
  const savedCheers = safeLocalStorageGet('temporaryCheers', []);
  let cheers: CheerData[] = Array.isArray(savedCheers) ? savedCheers : [];
  const existingIndex = cheers.findIndex(cheer => cheer.date === cheerData.date);
  if (existingIndex >= 0) { cheers[existingIndex] = cheerData; } else { cheers.push(cheerData); }
  safeLocalStorageSet('temporaryCheers', cheers);
}

export default HomeScreen;