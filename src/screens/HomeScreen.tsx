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
import PlayIcon from "../assets/icons/play.svg?react";
import { useLocation } from "react-router-dom";
import { specialEvents, getTodayEvents } from "../utils/specialEvents";

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

interface CheerData {
  type: 'text' | 'image' | 'textWithImage';
  message?: string;
  imageUrl?: string;
  imageAlt?: string;
  date?: string;
  expiresAt?: string;
}

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

// ✅ 특별 이벤트 데이터 (이미지 URL은 public 경로 사용)


// ✅ localStorage 안전 함수들
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
    // 크기 체크 (5MB 제한)
    if (serialized.length > 5 * 1024 * 1024) {
      console.warn(`Data too large for localStorage key ${key}`);
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // 임시 데이터 정리
      cleanupTemporaryData();
    } else {
      console.error(`localStorage set error for key ${key}:`, e);
    }
    return false;
  }
};

// ✅ 임시 데이터 정리 함수
const cleanupTemporaryData = () => {
  try {
    // 만료된 임시 응원 메시지 정리
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
    
    // 오래된 연습 기록 정리 (1년 이상 된 기록)
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

function getTodayCheerData(): CheerData {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date(); // ✅ now 변수 정의

  // 임시 응원 메시지 확인
  const savedCheers = safeLocalStorageGet('temporaryCheers', []);
  if (Array.isArray(savedCheers)) {
    const todaySpecial = savedCheers.find((cheer: CheerData) => {
      if (cheer.date !== today) return false;
      
      // 만료 시간 체크
      if (cheer.expiresAt && new Date(cheer.expiresAt) <= now) {
        return false; // 만료된 cheer는 제외
      }
      
      return true;
    });
    
    if (todaySpecial) return todaySpecial;
  }

  // 만료되지 않은 특별한 cheer 찾기
  const specialCheer = specialCheers.find(cheer => {
    if (cheer.date !== today) return false;
    
    // 만료 시간이 설정되어 있고, 현재 시간이 만료 시간을 넘었으면 제외
    if (cheer.expiresAt && new Date(cheer.expiresAt) <= now) {
      return false;
    }
    
    return true;
  });

  if (specialCheer) return specialCheer;

  // 기본 응원 메시지
  try {
    const cheerMessage = getTodayCheer();
    if (typeof cheerMessage === 'string' && cheerMessage.trim()) {
      return { type: 'text', message: cheerMessage };
    }
  } catch (e) {
    console.error('getTodayCheer error:', e);
  }

  // 폴백 메시지
  const fallbackMessages = [
    "오늘도 화이팅!",
    "꾸준히 연습하는 당신이 멋져요",
    "음악과 함께하는 하루",
    "피아노 소리가 아름다워요",
    "연습이 완벽을 만듭니다",
    "드가자!",
    "오늘의 연습도 파이팅!",
    "멋진 연주를 위해!",
    "한 음 한 음 정성스럽게"
  ];
  
  const seed = now.getHours() + now.getMinutes() + now.getSeconds();
  const messageIndex = seed % fallbackMessages.length;
  return { type: 'text', message: fallbackMessages[messageIndex] };
}

function HomeScreen() {
  const location = useLocation();

  // ✅ 스크롤 방지 로직
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

  // Context에서 연습 기록, 곡 목록, 체크 데이터를 가져옵니다.
  const { practiceRecords, setPracticeRecords, tracks, practiceChecks } = usePracticeData();

  // 로컬 상태
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [cheerData, setCheerData] = useState<CheerData>(getTodayCheerData());
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));

  // 타이머 상태
  const [timerActive, setTimerActive] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimePickModal, setShowTimePickModal] = useState(false);
  const [showHomeStopModal, setShowHomeStopModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const timerRef = useRef<number | null>(null);

  const [actualStartTime, setActualStartTime] = useState<number | null>(null);
  const [pausedDuration, setPausedDuration] = useState<number>(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // ✅ 초기 정리 작업
  useEffect(() => {
    cleanupTemporaryData();
  }, []);

  // 타이머 상태 복원
  useEffect(() => {
    const restoreTimer = () => {
      const timerState = safeLocalStorageGet('timerState', null);
      if (timerState) {
        try {
          const { isRunning, startTime, pausedTime = 0, pausedAt, sessionId, memo } = timerState;

          let currentPausedDuration = pausedTime;
          if (!isRunning && pausedAt) {
            currentPausedDuration += (Date.now() - pausedAt);
          }

          const elapsedSeconds = Math.floor((Date.now() - startTime - currentPausedDuration) / 1000);

          setTimerSeconds(Math.max(0, elapsedSeconds));
          setTimerActive(true);
          setTimerRunning(isRunning);
          setActualStartTime(startTime);
          setPausedDuration(currentPausedDuration);

          if (isRunning) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = window.setInterval(() => {
              setTimerSeconds(Math.floor((Date.now() - startTime - currentPausedDuration) / 1000));
            }, 1000);
          }
        } catch (error) {
          console.error('타이머 복원 실패:', error);
          localStorage.removeItem('timerState');
          setTimerActive(false);
        }
      }
    };

    restoreTimer();
  }, []);

  // tracks 변경 감지 및 동기화
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTracks = localStorage.getItem("tracks");
      if (savedTracks) {
        // Context에서 tracks를 관리하므로 별도 setTracks 불필요
      }
    };

    const interval = setInterval(() => {
      // Context에서 tracks를 관리하므로 별도 setTracks 불필요
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [tracks]);

  // practiceChecks 정리
  useEffect(() => {
    const cleanupPracticeChecks = () => {
      const existingTrackIds = new Set(tracks.map(t => t.id.toString()));
      let needsUpdate = false;
      const cleanedChecks = { ...practiceChecks };

      Object.keys(cleanedChecks).forEach(date => {
        const dayChecks = cleanedChecks[date];
        Object.keys(dayChecks).forEach(trackId => {
          if (!existingTrackIds.has(trackId)) {
            delete cleanedChecks[date][trackId];
            needsUpdate = true;
          }
        });
      });

      if (needsUpdate) {
        safeLocalStorageSet("practiceChecks", cleanedChecks);
      }
    };

    if (tracks.length > 0) {
      cleanupPracticeChecks();
    }
  }, [tracks, practiceChecks]);

  // ✅ 치어스 롤링 (24시간마다)
  useEffect(() => {
    const cheerInterval = setInterval(() => {
      setCheerData(getTodayCheerData());
    }, 86400000); // 24시간
    return () => clearInterval(cheerInterval);
  }, []);

  // ✅ localStorage 변경 감지 (간격 늘림)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAvatar = localStorage.getItem("avatar") || "";
      const currentNickname = localStorage.getItem("nickname") || "디붕이";
      if (currentAvatar !== avatar) {
        setAvatar(currentAvatar);
      }
      if (currentNickname !== nickname) {
        setNickname(currentNickname);
      }
    }, 5000); // 5초로 간격 늘림

    return () => {
      clearInterval(interval);
    };
  }, [avatar, nickname]);

  // 키보드 이벤트 처리
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 계산된 값들
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
        (track) =>
          dayjs(track.addedDate).isSameOrBefore(selectedDate, "day") &&
          (!track.completedDate ||
            dayjs(track.completedDate).isSameOrAfter(selectedDate, "day"))
      );

      const denominator = visibleTracksForDate.length;
      const checksForDate = practiceChecks[selectedDate];

      if (!checksForDate) {
        return { numerator: 0, denominator };
      }

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

  // 연속 일수 계산
  const getStreak = (): number => {
    if (!Array.isArray(practiceRecords)) {
      return 0;
    }

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

  // 이벤트 핸들러들
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  // 타이머 기능들
  const startTimer = () => {
    const currentTimestamp = Date.now();
    const sessionId = dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8);

    const timerState = {
      isRunning: true,
      startTime: currentTimestamp,
      pausedTime: 0,
      sessionId: sessionId,
      memo: ""
    };

    if (safeLocalStorageSet('timerState', timerState)) {
      setTimerActive(true);
      setTimerRunning(true);
      setTimerSeconds(0);
      setActualStartTime(currentTimestamp);
      setPausedDuration(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - currentTimestamp - 0) / 1000));
      }, 1000);
    }
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);

    const timerState = safeLocalStorageGet('timerState', {});
    const newPausedDuration = (pausedDuration || 0) + (Date.now() - (timerState.pausedAt || Date.now()));
    setPausedDuration(newPausedDuration);

    safeLocalStorageSet('timerState', {
      ...timerState,
      isRunning: false,
      pausedAt: Date.now(),
      pausedTime: newPausedDuration
    });
  };

  const resumeTimer = () => {
    const timerState = safeLocalStorageGet('timerState', {});
    const newPausedDuration = (pausedDuration || 0) + (Date.now() - (timerState.pausedAt || Date.now()));
    setPausedDuration(newPausedDuration);

    safeLocalStorageSet('timerState', {
      ...timerState,
      isRunning: true,
      pausedAt: undefined,
      pausedTime: newPausedDuration
    });

    setTimerRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (actualStartTime !== null) {
        setTimerSeconds(Math.floor((Date.now() - actualStartTime - newPausedDuration) / 1000));
      }
    }, 1000);
  };

  const completeTimer = () => {
    setShowHomeStopModal(true);
  };

  const editTimer = () => {
    setShowTimePickModal(true);
  };

  const handleTimeSave = (startInput: string, endInput: string) => {
    const today = dayjs();
    const startMoment = today.hour(Number(startInput.split(':')[0])).minute(Number(startInput.split(':')[1]));
    const endMoment = today.hour(Number(endInput.split(':')[0])).minute(Number(endInput.split(':')[1]));

    if (endMoment.isAfter(dayjs())) {
      alert("피퇴 시간은 현재 시간보다 미래로 설정할 수 없습니다.");
      return;
    }

    let newDurationSeconds = endMoment.diff(startMoment, 'second');

    if (newDurationSeconds < 0) {
      newDurationSeconds += 24 * 60 * 60;
    }

    if (newDurationSeconds <= 0) {
      alert("연습 시간은 1분 이상이어야 합니다.");
      return;
    }

    const recordStartTime = startMoment.valueOf();
    const recordEndTime = endMoment.valueOf();

    const isEndTimeInPast = endMoment.isBefore(dayjs());
    const timeDiffMinutes = dayjs().diff(endMoment, 'minute');
    const shouldCompleteSession = isEndTimeInPast && timeDiffMinutes > 5;

    const timerState = safeLocalStorageGet('timerState', {});
    const sessionId = timerState.sessionId || dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8);

    const newRecord: PracticeRecord = {
      id: sessionId,
      date: today.format("YYYY-MM-DD"),
      practiceTime: Math.floor(newDurationSeconds / 60),
      startTime: recordStartTime,
      endTime: recordEndTime,
      memo: timerState.memo || ""
    };

    setPracticeRecords(prev => {
      const existingRecordIndex = prev.findIndex(record => record.id === newRecord.id);
      if (existingRecordIndex > -1) {
        const updatedRecords = [...prev];
        updatedRecords[existingRecordIndex] = newRecord;
        return updatedRecords;
      } else {
        return [...prev, newRecord];
      }
    });

    if (shouldCompleteSession) {
      localStorage.removeItem('timerState');
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerActive(false);
      setTimerRunning(false);
      setTimerSeconds(0);
      setActualStartTime(null);
      setPausedDuration(0);
      
      setShowTimePickModal(false);
      return;
    }

    setActualStartTime(recordStartTime);
    setTimerSeconds(newDurationSeconds);

    safeLocalStorageSet('timerState', {
      isRunning: timerRunning,
      startTime: recordStartTime,
      pausedTime: 0,
      sessionId: sessionId,
      memo: timerState.memo || ""
    });

    if (timerRef.current) clearInterval(timerRef.current);
    if (timerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - recordStartTime - 0) / 1000));
      }, 1000);
    }

    setTimerActive(true);
    setShowTimePickModal(false);
  };

  const handlePracticeComplete = () => {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      const addMinutes = Math.floor(timerSeconds / 60);

      if (addMinutes > 0) {
        const timerState = safeLocalStorageGet('timerState', {});
        const recordedStartTime = timerState.startTime;
        const recordedEndTime = Date.now();

        const newRecord: PracticeRecord = {
          id: timerState.sessionId,
          date: dayjs().format("YYYY-MM-DD"),
          practiceTime: addMinutes,
          startTime: recordedStartTime,
          endTime: recordedEndTime,
          memo: timerState.memo || ""
        };

        setPracticeRecords(prev => {
          const existingRecordIndex = prev.findIndex(record => record.id === newRecord.id);
          if (existingRecordIndex > -1) {
            const updatedRecords = [...prev];
            updatedRecords[existingRecordIndex] = newRecord;
            return updatedRecords;
          } else {
            return [...prev, newRecord];
          }
        });
      }

      localStorage.removeItem('timerState');
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerActive(false);
      setTimerRunning(false);
      setTimerSeconds(0);
      setActualStartTime(null);
      setPausedDuration(0);
      setShowHomeStopModal(false);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEditTimeFromStop = () => {
    setShowHomeStopModal(false);
    setShowTimePickModal(true);
  };

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
      <div style={{
        width: "calc(100% - 32px)",
        margin: "0 auto"
      }}>
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
      <ProfileSection
        avatar={avatar}
        nickname={nickname}
        cheerData={cheerData}
      />

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
        title={selectedDate === todayStr ? "오늘의 피출 기록" : `${selectedDateFormatted} 피출 기록`}
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
        title={selectedDate === todayStr ? "오늘 연습한 곡" : `${selectedDateFormatted} 연습한 곡`}
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

      {/* Start Button */}
      {!timerActive && (
        <div style={{
          width: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "30px auto 0 auto"
        }}>
          <button
            onClick={startTimer}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "var(--transition-fast)"
            }}
          >
            <PlayIcon style={{ color: "var(--TURQUOISE)" }} width={50} height={50} />
          </button>

          <span style={{
            marginTop: -1,
            fontSize: 14,
            color: "var(--TURQUOISE)",
            lineHeight: "32px",
            pointerEvents: "none",
            ...commonFontStyle
          }}>
            드가자!
          </span>
        </div>
      )}

      {/* Modals */}
      {timerActive && (
        <HomeStartTimerModal
          timerSeconds={timerSeconds}
          isRunning={timerRunning}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onComplete={completeTimer}
          onEdit={editTimer}
        />
      )}

      {showTimePickModal && (
        <TimePickModal
          isOpen={showTimePickModal}
          onClose={() => setShowTimePickModal(false)}
          onSave={handleTimeSave}
          currentDuration={timerSeconds}
          actualStartTime={actualStartTime}
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

// ✅ 임시 응원 메시지 추가 함수 (안전한 localStorage 사용)
export function addTemporaryCheer(cheerData: CheerData) {
  const savedCheers = safeLocalStorageGet('temporaryCheers', []);
  let cheers: CheerData[] = Array.isArray(savedCheers) ? savedCheers : [];

  const existingIndex = cheers.findIndex(cheer => cheer.date === cheerData.date);
  if (existingIndex >= 0) {
    cheers[existingIndex] = cheerData;
  } else {
    cheers.push(cheerData);
  }

  safeLocalStorageSet('temporaryCheers', cheers);
}

export default HomeScreen;