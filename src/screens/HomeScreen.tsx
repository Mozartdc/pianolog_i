import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import { HomeStartTimerModal } from "./HomeStartTimerModal";
import { TimePickModal } from "./TimePickModal";
import { HomeStopModal } from "./HomeStopModal";
import { ExportCardModal } from "./ExportCardModal";
import { usePracticeData, type PracticeRecord, type Track, type PracticeChecks } from "../contexts/PracticeDataContext";
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
import { getStoredJson, getStoredString, setStoredJson } from "../utils/localStorage";
import { getKoreanHolidays } from "../utils/statsUtils";
import { validateTimeSettings, logTimeInfo } from "../utils/timeValidation";

// Temporary data cleanup function
const cleanupTemporaryData = () => {
  try {
    const cheers = getStoredJson<CheerData[]>('temporaryCheers', []);
    if (cheers.length > 0) {
      const now = new Date();
      const validCheers = cheers.filter((cheer: CheerData) => {
        if (!cheer.expiresAt) return true;
        return new Date(cheer.expiresAt) > now;
      });
      if (validCheers.length < cheers.length) {
        setStoredJson('temporaryCheers', validCheers);
      }
    }
    const oneYearAgo = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
    const practiceRecords = getStoredJson<PracticeRecord[]>('practiceRecords', []);
    if (Array.isArray(practiceRecords)) {
      const recentRecords = practiceRecords.filter((record: PracticeRecord) =>
        record.date >= oneYearAgo
      );
      if (recentRecords.length < practiceRecords.length) {
        setStoredJson('practiceRecords', recentRecords);
      }
    }
  } catch (e) {
    console.error('Cleanup error:', e);
  }
};

function HomeScreen() {
  const location = useLocation();

  // Get timer state and methods from Context
  const { 
    practiceRecords, setPracticeRecords, tracks, practiceChecks,
    timerActive, timerSeconds, timerMilliseconds, timerRunning, timerStartTime, timerMemo, timerSessionId,
    startSession, pauseSession, resumeSession, completeSession, updateTimerStartTime
  } = usePracticeData();

  // Prevent scrolling
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

  const [nickname, setNickname] = useState(getStoredString("nickname", "디붕이"));
  const [avatar, setAvatar] = useState(getStoredString("avatar", ""));
  const [cheerData, setCheerData] = useState<CheerData>(getTodayCheerData());
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));

  // Modal states
  const [showTimePickModal, setShowTimePickModal] = useState(false);
  const [showHomeStopModal, setShowHomeStopModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const playLottieRef = useRef<any>(null);

  // Removed states: All timer-related local states removed
  // - timerMilliseconds, timerRef, actualStartTime, pausedDuration, isCompleting, fromStopModal, etc.

  const [fromStopModal, setFromStopModal] = useState(false);

  useEffect(() => {
    cleanupTemporaryData();
  }, []);

  // Timer restoration logic completely removed - Context handles it

  // Cheer message rolling
  useEffect(() => {
    const cheerInterval = setInterval(() => {
      setCheerData(getTodayCheerData());
    }, 86400000);
    return () => clearInterval(cheerInterval);
  }, []);

  // localStorage change detection (nickname, avatar)
  useEffect(() => {
    const syncProfile = () => {
      const currentAvatar = getStoredString("avatar", "");
      const currentNickname = getStoredString("nickname", "디붕이");
      if (currentAvatar !== avatar) setAvatar(currentAvatar);
      if (currentNickname !== nickname) setNickname(currentNickname);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "avatar" || event.key === "nickname" || event.key === null) {
        syncProfile();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncProfile();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncProfile);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncProfile);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [avatar, nickname]);

  // Other effects
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
      // timerRef cleanup logic removed - Context handles it
    };
  }, []);

  // New simplified timer methods - directly call Context methods
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

  // Modified time update handler - integrated with Context's timerV2
  const handleTimeSave = (startTimestamp: number, endTimestamp: number) => {
    console.log('HomeScreen 시간 저장:', {
      startTimestamp,
      endTimestamp,
      startFormatted: dayjs(startTimestamp).format('YYYY-MM-DD HH:mm'),
      endFormatted: dayjs(endTimestamp).format('YYYY-MM-DD HH:mm'),
      currentSelectedDate: selectedDate
    });

    // Enhanced future time validation
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

    const sessionId = timerSessionId || dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8);

    const newRecord: PracticeRecord = {
      id: sessionId,
      date: recordDate,
      practiceTime: newPracticeTime,
      startTime: startTimestamp,
      endTime: endTimestamp,
      memo: timerMemo || ""
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

    // Update Context's timerV2 state (manual localStorage manipulation)
    // Update start time using Context method
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
    
    completeSession(timerMemo);
    
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

  // Rest of the calculation logic (no changes)
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

  // Common font styles
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

      {/* Start Button - Simplified logic */}
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

      {/* Modals - Using new handlers */}
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

// Temporary cheer message add function
export function addTemporaryCheer(cheerData: CheerData) {
  const savedCheers = getStoredJson<CheerData[]>('temporaryCheers', []);
  let cheers: CheerData[] = Array.isArray(savedCheers) ? savedCheers : [];
  const existingIndex = cheers.findIndex(cheer => cheer.date === cheerData.date);
  if (existingIndex >= 0) { cheers[existingIndex] = cheerData; } else { cheers.push(cheerData); }
  setStoredJson('temporaryCheers', cheers);
}

export default HomeScreen;
