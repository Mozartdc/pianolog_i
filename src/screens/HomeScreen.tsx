import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import { HomeStartTimerModal } from "./HomeStartTimerModal";
import { TimePickModal } from "./TimePickModal";
import { HomeStopModal } from "./HomeStopModal";
import { ExportCardModal } from "./ExportCardModal";
import Header from "../components/Header";
import ProfileSection from "../components/ProfileSection";
import StatsCard from "../components/StatsCard";
import WeekCalendar from "../components/WeekCalendar";

// 실제 SVG/이미지 파일들 import
import KeyboardIcon from "../assets/icons/keyboard.svg";
import StaffIcon from "../assets/icons/staff.svg";
import TrophyIcon from "../assets/icons/trophy.svg";
import FlameIcon from "../assets/icons/flame.svg";
import ExportIcon from "../assets/icons/export.svg";
import PlayIcon from "../assets/icons/play.svg";

// 타입 정의
interface PracticeRecord {
  date: string;
  practiceTime: number;
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
    `${year}-01-01`, // 신정
    `${year}-03-01`, // 삼일절
    `${year}-05-05`, // 어린이날
    `${year}-06-06`, // 현충일
    `${year}-08-15`, // 광복절
    `${year}-10-03`, // 개천절
    `${year}-10-09`, // 한글날
    `${year}-12-25`, // 크리스마스
  ];
  if (year === 2025) {
    holidays.push(
      '2025-01-28', '2025-01-29', '2025-01-30', // 설날
      '2025-05-13', // 부처님오신날
      '2025-09-06', '2025-09-07', '2025-09-08'  // 추석
    );
  }
  return holidays;
};

// 특별 치어스
const specialCheers: CheerData[] = [];

// 치어스 데이터 가져오기
function getTodayCheerData(): CheerData {
  const today = new Date().toISOString().slice(0, 10);
  
  // localStorage에서 임시 치어스 확인
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
  
  // 기본 특별 치어스 확인
  const specialCheer = specialCheers.find(cheer => cheer.date === today);
  if (specialCheer) return specialCheer;
  
  // src/utils/cheers.ts에서 메시지 가져오기
  try {
    const cheerMessage = getTodayCheer();
    if (typeof cheerMessage === 'string' && cheerMessage.trim()) {
      return { type: 'text', message: cheerMessage };
    }
  } catch (e) {
    console.error('getTodayCheer error:', e);
  }
  
  // 대체 메시지
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
  
  // ✅ tracks 상태 추가 - 체크박스 정보 동기화를 위해
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

  // 데이터 로딩
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem("practiceRecords");
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          setPracticeRecords(parsed);
        } else if (parsed && typeof parsed === 'object') {
          setPracticeRecords([parsed]);
        }
      }

      const savedChecks = localStorage.getItem("practiceChecks");
      if (savedChecks) {
        setPracticeChecks(JSON.parse(savedChecks));
      }

      // ✅ tracks 데이터 로딩
      const savedTracks = localStorage.getItem("tracks");
      if (savedTracks) {
        setTracks(JSON.parse(savedTracks));
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
    
    setCheerData(getTodayCheerData());
  }, []);

  // ✅ 타이머 상태 복원 useEffect 추가
  useEffect(() => {
    const restoreTimer = () => {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        try {
          const { isRunning, startTime, pausedTime = 0, pausedAt } = JSON.parse(timerState);
          
          let currentTime = Date.now();
          let totalPausedTime = pausedTime;
          
          // 현재 일시정지 중이라면 일시정지 시간 계산
          if (!isRunning && pausedAt) {
            totalPausedTime += (currentTime - pausedAt);
          }
          
          // 실제 경과 시간 계산
          const elapsedSeconds = Math.floor((currentTime - startTime - totalPausedTime) / 1000);
          
          setTimerSeconds(Math.max(0, elapsedSeconds));
          setTimerActive(true);
          setTimerRunning(isRunning);
          
          // 타이머가 실행 중이면 interval 시작
          if (isRunning) {
            timerRef.current = window.setInterval(() => {
              setTimerSeconds((sec: number) => sec + 1);
            }, 1000);
          }
          
          console.log('타이머 복원됨:', { elapsedSeconds, isRunning });
        } catch (error) {
          console.error('타이머 복원 실패:', error);
          localStorage.removeItem('timerState');
        }
      }
    };
    
    restoreTimer();
  }, []);

  // ✅ tracks 변경 감지 및 동기화
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

  // ✅ 검색 결과[1]의 정확한 방법: practiceChecks 정리
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
  
  // 날짜 형식 변경
  const selectedDateFormatted = displayDate.format("YYYY년 MM월 DD일");
  
  // 안전한 practiceRecords 필터링
  const selectedDateRecords = Array.isArray(practiceRecords)
    ? practiceRecords.filter((r: PracticeRecord) => r.date === selectedDate)
    : [];
  const selectedDateMinutes = selectedDateRecords.reduce((sum: number, r: PracticeRecord) => sum + Number(r.practiceTime || 0), 0);

  // ✅ 핵심 해결책: 분모는 현재 tracks 개수로 계산!
  const selectedDateCheckedCount = (() => {
    try {
      const checks = practiceChecks[selectedDate];
      if (!checks) return { numerator: 0, denominator: tracks.length };
      
      // 실제 존재하는 곡만 필터링
      const existingTrackIds = new Set(tracks.map(t => t.id.toString()));
      const validChecks = Object.entries(checks).filter(([trackId]) => 
        existingTrackIds.has(trackId)
      );
      
      const numerator = validChecks.filter(([, checked]) => checked).length;
      const denominator = tracks.length; // ✅ 핵심: 현재 tracks 개수로 분모 계산!
      
      console.log("분모 계산 디버그 (수정됨):", {
        selectedDate,
        allChecks: Object.keys(checks),
        existingTrackIds: Array.from(existingTrackIds),
        validChecks: validChecks.map(([id]) => id),
        numerator,
        denominator,
        tracksLength: tracks.length
      });
      
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

  // ✅ 타이머 기능들 (지속성 추가)
  const startTimer = () => {
    const startTime = Date.now();
    
    // localStorage에 타이머 상태 저장
    localStorage.setItem('timerState', JSON.stringify({
      isRunning: true,
      startTime: startTime,
      initialSeconds: 0,
      pausedTime: 0
    }));
    
    setTimerActive(true);
    setTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds((sec: number) => sec + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    
    // 일시정지 시간 기록
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    timerState.isRunning = false;
    timerState.pausedAt = Date.now();
    localStorage.setItem('timerState', JSON.stringify(timerState));
  };

  const resumeTimer = () => {
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    
    // 일시정지된 시간 누적
    if (timerState.pausedAt) {
      timerState.pausedTime = (timerState.pausedTime || 0) + (Date.now() - timerState.pausedAt);
    }
    
    timerState.isRunning = true;
    delete timerState.pausedAt;
    localStorage.setItem('timerState', JSON.stringify(timerState));
    
    setTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds((sec: number) => sec + 1);
    }, 1000);
  };

  const completeTimer = () => {
    setShowHomeStopModal(true);
  };

  const editTimer = () => {
    setShowTimePickModal(true);
  };

  const handleTimeSave = (startTime: string, endTime: string) => {
    const today = dayjs();
    const start = dayjs(`${today.format('YYYY-MM-DD')} ${startTime}`);
    const end = dayjs(`${today.format('YYYY-MM-DD')} ${endTime}`);
    const newDuration = end.diff(start, 'second');
    
    setTimerSeconds(newDuration);
    setShowTimePickModal(false);
    
    const newMinutes = Math.floor(newDuration / 60);
    if (newMinutes > 0) {
      const newRecords = practiceRecords.filter((r: PracticeRecord) => r.date !== todayStr);
      const newRecord: PracticeRecord = { date: todayStr, practiceTime: newMinutes };
      newRecords.push(newRecord);
      setPracticeRecords(newRecords);
      localStorage.setItem("practiceRecords", JSON.stringify(newRecords));
    }
  };

  const handlePracticeComplete = () => {
    const addMinutes = Math.floor(timerSeconds / 60);
    if (addMinutes > 0) {
      const newRecords = practiceRecords.filter((r: PracticeRecord) => r.date !== todayStr);
      const prev = todayRecords.length > 0 ? todayRecords[0].practiceTime || 0 : 0;
      const newRecord: PracticeRecord = { date: todayStr, practiceTime: Number(prev) + addMinutes };
      newRecords.push(newRecord);
      setPracticeRecords(newRecords);
      localStorage.setItem("practiceRecords", JSON.stringify(newRecords));
    }
    
    // ✅ 타이머 상태 삭제
    localStorage.removeItem('timerState');
    
    setTimerActive(false);
    setTimerRunning(false);
    setTimerSeconds(0);
    setShowHomeStopModal(false);
  };

  const handleEditTimeFromStop = () => {
    setShowHomeStopModal(false);
    setShowTimePickModal(true);
  };

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 375,
      height: "812px", 
      background: "#ffffff",
      overflow: "hidden",
      margin: "0 auto",
      ...commonFontStyle
    }}>
      
      {/* Header */}
      <Header 
        title="digital piano gallery 피출앱"
        color="#45b5aa"
        topMargin={44}
      />

      {/* Date Display */}
      <div style={{
        width: "100%",
        maxWidth: 345,
        height: 20,
        fontSize: 14,
        color: "#2d2d2a",
        textAlign: "center",
        lineHeight: "20px",
        margin: "15px auto 0 auto",
        ...commonFontStyle
      }}>
        {displayDate.format("YYYY. MM. DD ddd").toUpperCase()}
      </div>

      {/* Profile Section */}
      <ProfileSection 
        avatar={avatar}
        nickname={nickname}
        cheerData={cheerData}
      />

      {/* Total Achievement Card */}
      <div style={{
        width: "100%",
        maxWidth: 345,
        height: 60,
        background: "#c7e6df",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 65,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
        margin: "23px auto 0 auto"
      }}>
        <img src={FlameIcon} alt="flame" width="25" height="25" />
        <span style={{
          fontSize: 20,
          color: "#2d2d2a",
          lineHeight: "20px",
          ...commonFontStyle
        }}>
          {getStreak()}일 연속 피출
        </span>
      </div>

      {/* Stats Cards */}
      <StatsCard
        icon={KeyboardIcon}
        iconAlt="keyboard"
        iconWidth={24}
        iconHeight={24}
        title={selectedDate === todayStr ? "오늘의 피출 기록" : `${selectedDateFormatted} 피출 기록`}
        value={`${Math.floor(selectedDateMinutes / 60)}시간 ${selectedDateMinutes % 60}분`}
        onClick={handleExport}
        showExportIcon={true}
        exportIcon={ExportIcon}
      />

      <StatsCard
        icon={StaffIcon}
        iconAlt="staff"
        iconWidth={24}
        iconHeight={24}
        title={selectedDate === todayStr ? "오늘 연습한 곡" : `${selectedDateFormatted} 연습한 곡`}
        value={`${selectedDateCheckedCount.numerator}/${selectedDateCheckedCount.denominator} 곡`}
      />

      <StatsCard
        icon={TrophyIcon}
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
      />

      {/* Start Button */}
      {!timerActive && (
        <div style={{
          width: 50,
          height: 80,
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
              padding: 0
            }}
          >
            <img src={PlayIcon} alt="play" width="50" height="50" />
          </button>
          
          <span style={{
            marginTop: 8,
            fontSize: 14,
            color: "#45b5aa",
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
