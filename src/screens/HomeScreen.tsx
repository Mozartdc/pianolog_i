import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers"; // 기존 cheers.ts 파일 import

// 실제 SVG 파일들 import
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

// 특별 치어스 (필요시 추가)
const specialCheers: CheerData[] = [
  // 예시:
  // {
  //   type: 'image',
  //   imageUrl: '/assets/special/gwangbok.png',
  //   imageAlt: '광복절 기념',
  //   date: '2025-08-15'
  // }
];

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
  
  // 기본 동적 치어스 (기존 cheers.ts 파일 사용)
  return {
    type: 'text',
    message: getTodayCheer() // 기존 함수 사용
  };
}

function HomeScreen() {
  const [nickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const [avatar] = useState(localStorage.getItem("avatar") || "");
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});
  const [cheerData, setCheerData] = useState<CheerData>(getTodayCheerData());
  
  // 타이머 상태
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 실제 데이터 로딩
  useEffect(() => {
    const savedRecords = localStorage.getItem("practiceRecords");
    const savedChecks = localStorage.getItem("practiceChecks");
    if (savedRecords) setPracticeRecords(JSON.parse(savedRecords) as PracticeRecord[]);
    if (savedChecks) setPracticeChecks(JSON.parse(savedChecks) as PracticeChecks);
    
    // 치어스 데이터 업데이트
    setCheerData(getTodayCheerData());
  }, []);

  // 실제 계산된 값들
  const today = dayjs();
  const todayStr = today.format("YYYY-MM-DD");
  const weekStart = today.subtract(today.day() === 0 ? 6 : today.day() - 1, "day");
  const weekDays = Array.from({ length: 7 }).map((_, i) => weekStart.add(i, "day"));
  
  const todayRecords = practiceRecords.filter((r: PracticeRecord) => r.date === todayStr);
  const totalTodayMinutes = todayRecords.reduce((sum: number, r: PracticeRecord) => sum + Number(r.practiceTime || 0), 0);
  const todayCheckedCount = practiceChecks[todayStr] 
    ? Object.values(practiceChecks[todayStr]).filter(Boolean).length 
    : 0;
  const totalMinutes = practiceRecords.reduce((sum: number, r: PracticeRecord) => sum + Number(r.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  // 연속 일수 계산
  const getStreak = (): number => {
    let streak = 0;
    let day = dayjs();
    while (practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"))) {
      streak++;
      day = day.subtract(1, "day");
    }
    return streak;
  };

  // 치어스 렌더링 함수
  const renderCheerContent = () => {
    const baseStyle = {
      position: "absolute" as const,
      left: 102,
      top: 139,
      width: 250,
      height: 80,
      fontSize: 11,
      color: "#9e9c98",
      fontFamily: "Pretendard Variable",
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
    setShowTimeModal(false);
    setShowTimerModal(true);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds(sec => sec + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowTimerModal(false);
    setShowCompleteModal(true);
    
    const addMinutes = Math.floor(timerSeconds / 60);
    if (addMinutes > 0) {
      const newRecords = practiceRecords.filter((r: PracticeRecord) => r.date !== todayStr);
      const prev = todayRecords.length > 0 ? todayRecords[0].practiceTime || 0 : 0;
      const newRecord: PracticeRecord = { date: todayStr, practiceTime: Number(prev) + addMinutes };
      newRecords.push(newRecord);
      setPracticeRecords(newRecords);
      localStorage.setItem("practiceRecords", JSON.stringify(newRecords));
    }
    setTimerSeconds(0);
  };

  const timerDisplay = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  return (
    <div style={{
      position: "relative",
      width: "375px",
      height: "812px", 
      background: "#ffffff",
      fontFamily: "Pretendard Variable, sans-serif",
      overflow: "hidden"
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
          fontFamily: "Pretendard Variable",
          fontWeight: 400,
          lineHeight: "140%",
          textAlign: "center"
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
        fontFamily: "Pretendard Variable",
        textAlign: "center",
        lineHeight: "20px"
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
        borderRadius: 24,
        border: "none",
        overflow: "hidden",
        background: avatar ? "transparent" : "#f9f9f9"
      }}>
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
            background: "#f9f9f9"
          }}>
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
        fontFamily: "Pretendard Variable",
        fontWeight: 400,
        lineHeight: "20px",
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {nickname}
      </div>

      {/* Cheer Content - 동적 렌더링 (기존 cheers.ts 사용) */}
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
          fontFamily: "Pretendard Variable",
          fontWeight: 400,
          lineHeight: "20px"
        }}>
          {getStreak()}일 째 피출
        </span>
      </div>

      {/* Stats Card 1 - 7px spacing */}
      <div style={{
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
        gap: 12
      }}>
        <img src={KeyboardIcon} alt="keyboard" width="24" height="24" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ 
            fontSize: 14, 
            color: "#9e9c98", 
            fontFamily: "Pretendard Variable", 
            lineHeight: "20px",
            textAlign: "left"
          }}>
            오늘의 피출 기록
          </span>
          <span style={{ 
            fontSize: 12, 
            color: "#2d2d2a", 
            fontFamily: "Pretendard Variable", 
            lineHeight: "16px",
            textAlign: "left"
          }}>
            {Math.floor(totalTodayMinutes / 60)}시간 {totalTodayMinutes % 60}분
          </span>
        </div>
        <img src={ExportIcon} alt="export" width="16" height="20" />
      </div>

      {/* Stats Card 2 - 7px spacing */}
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
            fontFamily: "Pretendard Variable", 
            lineHeight: "20px",
            textAlign: "left"
          }}>
            오늘 연습한 곡
          </span>
          <span style={{ 
            fontSize: 12, 
            color: "#2d2d2a", 
            fontFamily: "Pretendard Variable", 
            lineHeight: "16px",
            textAlign: "left"
          }}>
            {todayCheckedCount}/4 곡
          </span>
        </div>
      </div>

      {/* Stats Card 3 - 7px spacing */}
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
            fontFamily: "Pretendard Variable", 
            lineHeight: "20px",
            textAlign: "left"
          }}>
            총 연습 시간
          </span>
          <span style={{ 
            fontSize: 12, 
            color: "#2d2d2a", 
            fontFamily: "Pretendard Variable", 
            lineHeight: "16px",
            textAlign: "left"
          }}>
            {totalHours}시간
          </span>
        </div>
      </div>

      {/* Week Calendar - responsive */}
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
          const isWeekend = index === 5 || index === 6;
          
          return (
            <div
              key={index}
              style={{
                width: 43,
                height: 56,
                background: "#ffffff",
                border: practiced ? "0.5px solid #45b5aa" : "0.5px solid #9e9c98",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 8,
                paddingRight: 8
              }}
            >
              <span style={{
                fontSize: 20,
                color: practiced ? "#bb2649" : "#2d2d2a",
                fontFamily: "Pretendard Variable",
                lineHeight: "24px",
                textAlign: "center"
              }}>
                {date.format("D")}
              </span>
              <span style={{
                fontSize: 10,
                color: practiced ? "#6667ab" : isWeekend ? "#bb2649" : "#9e9c98",
                fontFamily: "Pretendard Variable",
                lineHeight: "16px",
                textAlign: "center"
              }}>
                {date.format("ddd").toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Start Button */}
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
          onClick={() => setShowTimeModal(true)}
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
          fontFamily: "Pretendard Variable",
          lineHeight: "32px",
          pointerEvents: "none"
        }}>
          드가자!
        </span>
      </div>

      {/* 타이머 모달들 */}
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
              borderRadius: 20,
              padding: 24,
              width: 320,
              maxWidth: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 24 }}>
              연습 시간 설정
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={startTimer}
                style={{
                  flex: 1,
                  padding: 16,
                  background: "#45b5aa",
                  color: "#fff",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 16,
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
                  padding: 16,
                  background: "#9e9c98",
                  color: "#fff",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 16,
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

      {/* 타이머 실행 모달 */}
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
              borderRadius: 20,
              padding: 24,
              width: 320,
              maxWidth: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 24 }}>
              연습 중
            </h3>
            <div style={{ textAlign: "center", fontSize: 48, color: "#45b5aa", marginBottom: 24, fontWeight: 700 }}>
              {timerDisplay}
            </div>
            <button
              onClick={stopTimer}
              style={{
                width: "100%",
                padding: 16,
                background: "#45b5aa",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              연습 완료
            </button>
          </div>
        </div>
      )}

      {/* 완료 모달 */}
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
              borderRadius: 20,
              padding: 24,
              width: 320,
              maxWidth: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 24 }}>
              연습 완료! 🎉
            </h3>
            <p style={{ fontSize: 14, color: "#9e9c98", textAlign: "center", marginBottom: 24 }}>
              {Math.floor(timerSeconds / 60)}분간 연습하셨습니다
            </p>
            <button
              onClick={() => setShowCompleteModal(false)}
              style={{
                width: "100%",
                padding: 16,
                background: "#45b5aa",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                fontSize: 16,
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

// 임시 치어스 추가 함수 (필요시 사용)
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
