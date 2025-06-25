import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import { HomeStartTimerModal } from "./HomeStartTimerModal";
import { TimePickModal } from "./TimePickModal";
import { HomeStopModal } from "./HomeStopModal";
import { ExportCardModal } from "./ExportCardModal";

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
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});
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

  // 실제 데이터 로딩
  useEffect(() => {
    const savedRecords = localStorage.getItem("practiceRecords");
    const savedChecks = localStorage.getItem("practiceChecks");
    if (savedRecords) setPracticeRecords(JSON.parse(savedRecords) as PracticeRecord[]);
    if (savedChecks) setPracticeChecks(JSON.parse(savedChecks) as PracticeChecks);
    setCheerData(getTodayCheerData());
  }, []);

  // 치어스 롤링 (30초마다)
  useEffect(() => {
    const cheerInterval = setInterval(() => {
      setCheerData(getTodayCheerData());
    }, 30000);
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
  const displayDate = dayjs(selectedDate);
  const todayStr = today.format("YYYY-MM-DD");
  const selectedDateStr = selectedDate;
  const weekStart = displayDate.subtract(displayDate.day() === 0 ? 6 : displayDate.day() - 1, "day");
  const weekDays = Array.from({ length: 7 }).map((_, i) => weekStart.add(i, "day"));
  
  const selectedDateRecords = practiceRecords.filter((r: PracticeRecord) => r.date === selectedDateStr);
  const selectedDateMinutes = selectedDateRecords.reduce((sum: number, r: PracticeRecord) => sum + Number(r.practiceTime || 0), 0);
  const selectedDateCheckedCount = practiceChecks[selectedDateStr] 
    ? Object.values(practiceChecks[selectedDateStr]).filter(Boolean).length 
    : 0;
  
  const todayRecords = practiceRecords.filter((r: PracticeRecord) => r.date === todayStr);
  const totalMinutes = practiceRecords.reduce((sum: number, r: PracticeRecord) => sum + Number(r.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  // 연속 일수 계산
  const getStreak = (): number => {
    let streak = 0;
    let day = dayjs();
    
    const todayPracticed = practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"));
    
    if (todayPracticed) {
      while (practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"))) {
        streak++;
        day = day.subtract(1, "day");
      }
    } else {
      day = day.subtract(1, "day");
      while (practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"))) {
        streak++;
        day = day.subtract(1, "day");
      }
    }
    
    return streak;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // 익스포트 핸들러 - 모달 열기로 변경
  const handleExport = () => {
    setShowExportModal(true);
  };

  // 치어스 렌더링
  const renderCheerContent = () => {
    const baseStyle = {
      position: "absolute" as const,
      left: 102,
      top: 139,
      width: 250,
      height: 80,
      fontSize: 11,
      color: "#9e9c98",
      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
      lineHeight: "20px",
      textAlign: "left" as const,
      display: "flex",
      alignItems: "center"
    };

    switch (cheerData.type) {
      case 'image':
        return (
          <div style={baseStyle}>
            <img 
              src={cheerData.imageUrl} 
              alt={cheerData.imageAlt || "특별 이미지"}
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain",
                borderRadius: 8
              }}
            />
          </div>
        );
      
      case 'textWithImage':
        return (
          <div style={baseStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%" }}>
              <img 
                src={cheerData.imageUrl} 
                alt={cheerData.imageAlt || "이미지"}
                style={{ 
                  width: 40, 
                  height: 40, 
                  objectFit: "contain",
                  borderRadius: 4,
                  flexShrink: 0
                }}
              />
              <span style={{ flex: 1, fontSize: 11, lineHeight: "16px" }}>
                {cheerData.message}
              </span>
            </div>
          </div>
        );
      
      case 'text':
      default:
        return (
          <div style={{...baseStyle, alignItems: "flex-start"}}>
            {cheerData.message}
          </div>
        );
    }
  };

  // 타이머 기능들
  const startTimer = () => {
    setTimerActive(true);
    setTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds((sec: number) => sec + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
  };

  const resumeTimer = () => {
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
      position: "relative",
      width: "375px",
      height: "812px", 
      background: "#ffffff",
      overflow: "hidden",
      ...commonFontStyle
    }}>
      
      {/* Header */}
      <div style={{
        position: "absolute",
        left: 1,
        top: 44,
        width: 375,
        height: 42,
        background: "#ffffff",
        borderBottom: "0.5px solid #9e9c98",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <span style={{
          fontSize: 17,
          color: "#45b5aa",
          lineHeight: "140%",
          textAlign: "center",
          ...commonFontStyle
        }}>
          digital piano gallery 피출앱
        </span>
      </div>

      {/* Date Display */}
      <div style={{
        position: "absolute",
        left: 14,
        top: 101,
        width: 345,
        height: 20,
        fontSize: 14,
        color: "#2d2d2a",
        textAlign: "center",
        lineHeight: "20px",
        ...commonFontStyle
      }}>
        {displayDate.format("YYYY. MM. DD ddd").toUpperCase()}
      </div>

      {/* Profile Avatar */}
      <div 
        style={{
          position: "absolute",
          left: 16,
          top: 139,
          width: 80,
          height: 80,
          borderRadius: 24,
          border: "none",
          overflow: "hidden",
          background: avatar ? "transparent" : "#f9f9f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {avatar ? (
          <img 
            src={avatar} 
            alt="프로필" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 24
          }}>
            <span style={{ 
              fontSize: 12, 
              color: "#9e9c98", 
              textAlign: "center",
              ...commonFontStyle
            }}>
              프로필
            </span>
          </div>
        )}
      </div>

      {/* Nickname */}
      <div style={{
        position: "absolute",
        left: 16,
        top: 226,
        width: 80,
        height: 20,
        fontSize: 16,
        color: "#2d2d2a",
        lineHeight: "20px",
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        ...commonFontStyle
      }}>
        {nickname}
      </div>

      {/* Cheer Content */}
      {renderCheerContent()}

      {/* Total Achievement Card */}
      <div style={{
        position: "absolute",
        left: 15,
        top: 269,
        width: 345,
        height: 60,
        background: "#c7e6df",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 65,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12
      }}>
        <img src={FlameIcon} alt="flame" width="25" height="25" />
        <span style={{
          fontSize: 20,
          color: "#2d2d2a",
          lineHeight: "20px",
          ...commonFontStyle
        }}>
          {getStreak()}일 째 연속 피출
        </span>
      </div>

      {/* Stats Card 1 */}
      <div 
        onClick={handleExport}
        style={{
          position: "absolute",
          left: 15,
          top: 336,
          width: 345,
          height: 60,
          background: "#ffffff",
          border: "0.5px solid #9e9c98",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: 16,
          gap: 12,
          cursor: "pointer"
        }}
      >
        <img src={KeyboardIcon} alt="keyboard" width="24" height="24" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ 
            fontSize: 14, 
            color: "#9e9c98", 
            lineHeight: "20px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {selectedDate === todayStr ? "오늘의 피출 기록" : "선택한 날의 피출 기록"}
          </span>
          <span style={{ 
            fontSize: 12, 
            color: "#2d2d2a", 
            lineHeight: "16px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {Math.floor(selectedDateMinutes / 60)}시간 {selectedDateMinutes % 60}분
          </span>
        </div>
        <img src={ExportIcon} alt="export" width="16" height="20" />
      </div>

      {/* Stats Card 2 */}
      <div style={{
        position: "absolute",
        left: 15,
        top: 403,
        width: 345,
        height: 60,
        background: "#ffffff",
        border: "0.5px solid #9e9c98",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12
      }}>
        <img src={StaffIcon} alt="staff" width="24" height="24" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ 
            fontSize: 14, 
            color: "#9e9c98", 
            lineHeight: "20px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {selectedDate === todayStr ? "오늘 연습한 곡" : "선택한 날 연습한 곡"}
          </span>
          <span style={{ 
            fontSize: 12, 
            color: "#2d2d2a", 
            lineHeight: "16px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {selectedDateCheckedCount}/4 곡
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
        background: "#ffffff",
        border: "0.5px solid #9e9c98",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12
      }}>
        <img src={TrophyIcon} alt="trophy" width="21" height="21" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ 
            fontSize: 14, 
            color: "#9e9c98", 
            lineHeight: "20px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            총 연습 시간
          </span>
          <span style={{ 
            fontSize: 12, 
            color: "#2d2d2a", 
            lineHeight: "16px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {totalHours}시간
          </span>
        </div>
      </div>

      {/* Week Calendar */}
      <div style={{
        position: "absolute",
        left: 16,
        top: 545,
        width: 344,
        height: 56,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        {weekDays.map((date, index) => {
          const dateStr = date.format("YYYY-MM-DD");
          const practiced = practiceRecords.some((r: PracticeRecord) => r.date === dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isSunday = date.day() === 0;
          const isSaturday = date.day() === 6;
          const koreanHolidays = getKoreanHolidays(date.year());
          const isHoliday = koreanHolidays.includes(dateStr);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(dateStr)}
              style={{
                width: 43,
                height: 56,
                background: isToday ? "#c7e6df" : isSelected ? "#f0f0f0" : "#ffffff",
                border: practiced ? "0.5px solid #45b5aa" : "0.5px solid #9e9c98",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 8,
                paddingRight: 8,
                cursor: "pointer"
              }}
            >
              <span style={{
                fontSize: 20,
                color: "#2d2d2a",
                lineHeight: "24px",
                textAlign: "center",
                ...commonFontStyle
              }}>
                {date.format("D")}
              </span>
              <span style={{
                fontSize: 10,
                color: isSunday || isHoliday ? "#bb2649" : isSaturday ? "#0066cc" : "#9e9c98",
                lineHeight: "16px",
                textAlign: "center",
                ...commonFontStyle
              }}>
                {date.format("ddd").toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Start Button - "드가자!" 고정 */}
      {!timerActive && (
        <div style={{
          position: "absolute",
          left: 160,
          top: 644,
          width: 50,
          height: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
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

      {/* HomeStartTimer Modal */}
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

      {/* TimePickModal */}
      {showTimePickModal && (
        <TimePickModal
          isOpen={showTimePickModal}
          onClose={() => setShowTimePickModal(false)}
          onSave={handleTimeSave}
          currentDuration={timerSeconds}
        />
      )}

      {/* HomeStopModal */}
      {showHomeStopModal && (
        <HomeStopModal
          isOpen={showHomeStopModal}
          practiceTime={`${Math.floor(timerSeconds / 3600)}시간 ${Math.floor((timerSeconds % 3600) / 60)}분`}
          onComplete={handlePracticeComplete}
          onEditTime={handleEditTimeFromStop}
          onClose={() => setShowHomeStopModal(false)}
        />
      )}

      {/* ExportCardModal */}
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
