import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import { HomeStartTimerModal} from "./HomeStartTimerModal";
import { TimePickModal } from "./TimePickModal";
import { HomeStopModal } from "./HomeStopModal";
import { ExportCardModal } from "./ExportCardModal";
import Header from "../components/Header";
import ProfileSection from "../components/ProfileSection";
import StatsCard from "../components/StatsCard";
import WeekCalendar from "../components/WeekCalendar";
import './Home.css';

// 실제 SVG/이미지 파일들 import
// 수정할 내용
import KeyboardIcon from "../assets/icons/keyboard.svg?react";
import StaffIcon from "../assets/icons/staff.svg?react";
import TrophyIcon from "../assets/icons/trophy.svg?react";
import FlameIcon from "../assets/icons/flame.svg?react";
import ExportIcon from "../assets/icons/export.svg?react";
import PlayIcon from "../assets/icons/play.svg?react";

// 타입 정의
interface PracticeRecord {
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  id: string;
  memo?: string;
  track?: string; // StatsCard와 Total.tsx와 일관성을 위해 추가
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

// 특별 치어스 (현재 비어있음)
const specialCheers: CheerData[] = [];

// 치어스 데이터 가져오기
function getTodayCheerData(): CheerData {
  const today = new Date().toISOString().slice(0, 10);
  
  const savedCheers = localStorage.getItem('temporaryCheers');
  if (savedCheers) {
    try {
      const tempCheers = JSON.parse(savedCheers) as CheerData[];
      const todaySpecial = tempCheers.find(cheer => cheer.date === today);
      if (todaySpecial) return todaySpecial;
    } catch (e) {
      console.error('Failed to parse temporary cheers:', e);
    }
  }
  
  const specialCheer = specialCheers.find(cheer => cheer.date === today);
  if (specialCheer) return specialCheer;
  
  try {
    const cheerMessage = getTodayCheer();
    if (typeof cheerMessage === 'string' && cheerMessage.trim()) {
      return { type: 'text', message: cheerMessage };
    }
  } catch (e) {
    console.error('getTodayCheer error:', e);
  }
  
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
  const now = new Date();
  const seed = now.getHours() + now.getMinutes() + now.getSeconds();
  const messageIndex = seed % fallbackMessages.length;
  return { type: 'text', message: fallbackMessages[messageIndex] };
}

function HomeScreen() {
  // 상태 관리
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});
  const [cheerData, setCheerData] = useState<CheerData>(getTodayCheerData());
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("tracks");
    return saved ? JSON.parse(saved) : [];
  });
  
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

  // 데이터 로딩
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem("practiceRecords");
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          const recordsWithIds = parsed.map((record: PracticeRecord) => ({
            ...record,
            id: record.id || dayjs(record.startTime || record.date).valueOf().toString() + Math.random().toString(36).substring(2, 8)
          }));
          setPracticeRecords(recordsWithIds);
        } else if (parsed && typeof parsed === 'object') {
          setPracticeRecords([{ 
            ...parsed, 
            id: parsed.id || dayjs(parsed.startTime || parsed.date).valueOf().toString() + Math.random().toString(36).substring(2, 8)
          }]);
        }
      }

      const savedChecks = localStorage.getItem("practiceChecks");
      if (savedChecks) {
        setPracticeChecks(JSON.parse(savedChecks));
      }

      const savedTracks = localStorage.getItem("tracks");
      if (savedTracks) {
        setTracks(JSON.parse(savedTracks));
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
    
    setCheerData(getTodayCheerData());
  }, []);

  // 타이머 상태 복원
  useEffect(() => {
    const restoreTimer = () => {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        try {
          const { isRunning, startTime, pausedTime = 0, pausedAt, sessionId, memo } = JSON.parse(timerState);
          
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
          
          console.log('타이머 복원됨:', { elapsedSeconds, isRunning, sessionId, startTime, currentPausedDuration, memo });
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
        setTracks(JSON.parse(savedTracks));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const currentTracks = localStorage.getItem("tracks");
      if (currentTracks && currentTracks !== JSON.stringify(tracks)) {
        setTracks(JSON.parse(currentTracks));
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
            console.log(`삭제된 곡 ID ${trackId} 제거됨`);
          }
        });
      });
      
      if (needsUpdate) {
        setPracticeChecks(cleanedChecks);
        localStorage.setItem("practiceChecks", JSON.stringify(cleanedChecks));
        console.log("practiceChecks 정리 완료");
      }
    };
    
    if (tracks.length > 0) {
      cleanupPracticeChecks();
    }
  }, [tracks]);

  // 치어스 롤링
  useEffect(() => {
    const cheerInterval = setInterval(() => {
      setCheerData(getTodayCheerData());
    }, 86400000);
    return () => clearInterval(cheerInterval);
  }, []);

  // localStorage 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const newAvatar = localStorage.getItem("avatar") || "";
      const newNickname = localStorage.getItem("nickname") || "디붕이";
      setAvatar(newAvatar);
      setNickname(newNickname);
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const currentAvatar = localStorage.getItem("avatar") || "";
      const currentNickname = localStorage.getItem("nickname") || "디붕이";
      if (currentAvatar !== avatar) {
        setAvatar(currentAvatar);
      }
      if (currentNickname !== nickname) {
        setNickname(currentNickname);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
      const checks = practiceChecks[selectedDate];
      if (!checks) return { numerator: 0, denominator: tracks.length };
      
      const existingTrackIds = new Set(tracks.map(t => t.id.toString()));
      const validChecks = Object.entries(checks).filter(([trackId]) => 
        existingTrackIds.has(trackId)
      );
      
      const numerator = validChecks.filter(([, checked]) => checked).length;
      const denominator = tracks.length;
      
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

    localStorage.setItem('timerState', JSON.stringify({
      isRunning: true,
      startTime: currentTimestamp,
      pausedTime: 0,
      sessionId: sessionId,
      memo: ""
    }));
    
    setTimerActive(true);
    setTimerRunning(true);
    setTimerSeconds(0);
    setActualStartTime(currentTimestamp);
    setPausedDuration(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - currentTimestamp - 0) / 1000));
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    const newPausedDuration = (pausedDuration || 0) + (Date.now() - (timerState.pausedAt || Date.now()));
    setPausedDuration(newPausedDuration);

    localStorage.setItem('timerState', JSON.stringify({
      ...timerState,
      isRunning: false,
      pausedAt: Date.now(),
      pausedTime: newPausedDuration
    }));
  };

  const resumeTimer = () => {
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    const newPausedDuration = (pausedDuration || 0) + (Date.now() - (timerState.pausedAt || Date.now()));
    setPausedDuration(newPausedDuration);

    localStorage.setItem('timerState', JSON.stringify({
      ...timerState,
      isRunning: true,
      pausedAt: undefined,
      pausedTime: newPausedDuration
    }));
    
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

    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    const sessionId = timerState.sessionId || dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8); 

    const newRecord: PracticeRecord = {
      id: sessionId, 
      date: today.format("YYYY-MM-DD"),
      practiceTime: Math.floor(newDurationSeconds / 60), 
      startTime: recordStartTime,
      endTime: recordEndTime,
      memo: timerState.memo || ""
    };

    let updatedRecords: PracticeRecord[];
    const existingRecordIndex = practiceRecords.findIndex(record => record.id === newRecord.id);

    if (existingRecordIndex > -1) {
      updatedRecords = [...practiceRecords];
      updatedRecords[existingRecordIndex] = newRecord;
    } else {
      updatedRecords = [...practiceRecords, newRecord];
    }
    
    setPracticeRecords(updatedRecords);
    localStorage.setItem("practiceRecords", JSON.stringify(updatedRecords));

    setActualStartTime(recordStartTime); 
    setTimerSeconds(newDurationSeconds);

    localStorage.setItem('timerState', JSON.stringify({
      isRunning: timerRunning,
      startTime: recordStartTime,
      pausedTime: 0,
      sessionId: sessionId,
      memo: timerState.memo || ""
    }));

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
        const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
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

        const existingRecordIndex = practiceRecords.findIndex(record => record.id === newRecord.id);
        let updatedRecords: PracticeRecord[];

        if (existingRecordIndex > -1) {
          updatedRecords = [...practiceRecords];
          updatedRecords[existingRecordIndex] = newRecord;
        } else {
          updatedRecords = [...practiceRecords, newRecord];
        }

        setPracticeRecords(updatedRecords);
        localStorage.setItem("practiceRecords", JSON.stringify(updatedRecords));
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
    fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: "100%", // ⭐ 이 부분을 "100%"로 변경했습니다.
      minHeight: "100vh", 
      background: "var(--bg-primary)", // ✅ CSS 변수 적용
      overflowX: "hidden",
      overflowY: "auto", 
      margin: "0 auto",
      padding: "0",
      boxSizing: "border-box", 
      ...commonFontStyle
    }}>
      
      {/* Header */}
      <Header 
        title="digital piano gallery 피출앱"
        color="var(--TURQUOISE)" // ✅ CSS 변수 적용
        topMargin={30}
      />

      {/* Date Display */}
      <div style={{
        width: "100%", 
        height: 20,
        fontSize: 14,
        color: "var(--text-primary)", // ✅ CSS 변수 적용
        textAlign: "center",
        lineHeight: "20px",
        marginTop: "15px", 
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
        // ✅ 완전 반응형: 고정 maxWidth 제거
        width: "calc(100% - 32px)", // 좌우 16px 패딩 고려
        height: 60,
        background: "var(--PASTEL_TURQUOISE)", // ✅ CSS 변수 적용
        borderRadius: "var(--border-radius-large)", // ✅ CSS 변수 적용
        display: "flex",
        alignItems: "center",
        padding: "16px", // ✅ 패딩 통일
        gap: 12,
        margin: "23px auto 0 auto", // 중앙 정렬
        boxSizing: "border-box"
      }}>
        <FlameIcon width={25} height={25} />
        <span style={{
          fontSize: 20,
          color: "var(--text-primary)", // ✅ CSS 변수 적용
          lineHeight: "20px",
          ...commonFontStyle
        }}>
          {getStreak()}일 연속 피출
        </span>
      </div>

      {/* Stats Cards */}
      <StatsCard
        icon={KeyboardIcon}
        iconColor="var(--TURQUOISE)" // ✅ 이 줄을 추가해주세요
        iconAlt="keyboard"
        iconWidth={24}
        iconHeight={24}
        title={selectedDate === todayStr ? "오늘의 피출 기록" : `${selectedDateFormatted} 피출 기록`}
        value={`${Math.floor(selectedDateMinutes / 60)}시간 ${selectedDateMinutes % 60}분`}
        showExportIcon={true}
        exportIcon={ExportIcon}
      />

      <StatsCard
        icon={StaffIcon}
        iconColor="var(--TURQUOISE)" // ✅ 이 줄을 추가해주세요
        iconAlt="staff"
        iconWidth={24}
        iconHeight={24}
        title={selectedDate === todayStr ? "오늘 연습한 곡" : `${selectedDateFormatted} 연습한 곡`}
        value={`${selectedDateCheckedCount.numerator}/${selectedDateCheckedCount.denominator} 곡`}
      />

      <StatsCard
        icon={TrophyIcon}
        iconColor="var(--TURQUOISE)" // ✅ 이 줄을 추가해주세요
        iconAlt="trophy"
        iconWidth={21}
        iconHeight={21}
        title="총 연습 시간"
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
          margin: "43px auto 0 auto"
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
            marginTop: 1,
            fontSize: 14,
            color: "var(--TURQUOISE)", // ✅ CSS 변수 적용
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

export function addTemporaryCheer(cheerData: CheerData) {
  const savedCheers = localStorage.getItem('temporaryCheers');
  let cheers: CheerData[] = [];
  
  if (savedCheers) {
    try {
      cheers = JSON.parse(savedCheers);
    } catch (e) {
      console.error('Failed to parse temporary cheers:', e);
    }
  }
  
  const existingIndex = cheers.findIndex(cheer => cheer.date === cheerData.date);
  if (existingIndex >= 0) {
    cheers[existingIndex] = cheerData;
  } else {
    cheers.push(cheerData);
  }
  
  localStorage.setItem('temporaryCheers', JSON.stringify(cheers));
}

export default HomeScreen;