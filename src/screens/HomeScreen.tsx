import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getTodayCheer } from "../utils/cheers";
import { HomeStartTimerModal} from "./HomeStartTimerModal";
import { TimePickModal } from "./TimePickModal"; // 경로 수정: components 폴더
import { HomeStopModal } from "./HomeStopModal";
import { ExportCardModal } from "./ExportCardModal";
import Header from "../components/Header";
import ProfileSection from "../components/ProfileSection";
import StatsCard from "../components/StatsCard";
import WeekCalendar from "../components/WeekCalendar";
import './Home.css';

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
  practiceTime: number; // 총 연습 시간 (분 단위)
  startTime: number;   // 세션 시작 시간 (타임스탬프)
  endTime: number;     // 세션 종료 시간 (타임스탬프)
  id: string;           // 각 세션을 고유하게 식별할 ID (필수!)
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
  // 2025년 공휴일 추가
  if (year === 2025) {
    holidays.push(
      '2025-01-28', '2025-01-29', '2025-01-30', // 설날
      '2025-05-13', // 부처님오신날
      '2025-09-06', '2025-09-07', '2025-09-08'  // 추석
    );
  }
  return holidays;
};

// 특별 치어스 (필요 시 여기에 추가)
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
  
  // tracks 상태 추가 - 체크박스 정보 동기화를 위해
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

  // actualStartTime (실제 타이머 시작 시간), pausedDuration (일시정지 누적 시간)
  const [actualStartTime, setActualStartTime] = useState<number | null>(null);
  const [pausedDuration, setPausedDuration] = useState<number>(0); 

  // 데이터 로딩 (practiceRecords 타입 안전하게 처리 및 id 부여)
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem("practiceRecords");
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          // 기존 데이터에 id가 없다면 새로 부여 (업그레이드 용)
          const recordsWithIds = parsed.map((record: PracticeRecord) => ({
            ...record,
            id: record.id || dayjs(record.startTime || record.date).valueOf().toString() + Math.random().toString(36).substring(2, 8)
          }));
          setPracticeRecords(recordsWithIds);
        } else if (parsed && typeof parsed === 'object') {
          // 단일 객체인 경우 (하위 호환성)
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

      // tracks 데이터 로딩
      const savedTracks = localStorage.getItem("tracks");
      if (savedTracks) {
        setTracks(JSON.parse(savedTracks));
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
    
    setCheerData(getTodayCheerData());
  }, []);

  // 타이머 상태 복원 useEffect
  useEffect(() => {
    const restoreTimer = () => {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        try {
          const { isRunning, startTime, pausedTime = 0, pausedAt, sessionId } = JSON.parse(timerState);
          
          let currentPausedDuration = pausedTime;
          // 현재 일시정지 중이라면 일시정지 시간 계산
          if (!isRunning && pausedAt) {
            currentPausedDuration += (Date.now() - pausedAt);
          }
          
          const elapsedSeconds = Math.floor((Date.now() - startTime - currentPausedDuration) / 1000);
          
          setTimerSeconds(Math.max(0, elapsedSeconds)); // 표시될 시간
          setTimerActive(true);
          setTimerRunning(isRunning);
          setActualStartTime(startTime); // 실제 시작 시간 복원
          setPausedDuration(currentPausedDuration); // 누적 일시정지 시간 복원
          
          if (isRunning) {
            if (timerRef.current) clearInterval(timerRef.current); // 기존 인터벌 정리
            timerRef.current = window.setInterval(() => {
              // Date.now() 기반으로 타이머 초 업데이트
              setTimerSeconds(Math.floor((Date.now() - startTime - currentPausedDuration) / 1000));
            }, 1000);
          }
          
          console.log('타이머 복원됨:', { elapsedSeconds, isRunning, sessionId, startTime, currentPausedDuration });
        } catch (error) {
          console.error('타이머 복원 실패:', error);
          localStorage.removeItem('timerState');
          setTimerActive(false); // 오류 시 타이머 비활성화
        }
      }
    };
    
    restoreTimer();
  }, []); // 의존성 배열 비워 초기 렌더링 시 한 번만 실행

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
    }, 86400000); // 24시간마다 갱신
    return () => clearInterval(cheerInterval);
  }, []);

  // localStorage 변경 감지 (닉네임, 아바타)
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

  // 키보드 이벤트 처리 (Escape 키)
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
      // 컴포넌트 언마운트 시 모든 인터벌 정리
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

  // 핵심 해결책: 분모는 현재 tracks 개수로 계산!
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
      const denominator = tracks.length; // 핵심: 현재 tracks 개수로 분모 계산!
      
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
          if (streak > 365) break; // 무한 루프 방지
        }
      } else {
        day = day.subtract(1, "day");
        while (practiceRecords.some((r: PracticeRecord) => r.date === day.format("YYYY-MM-DD"))) {
          streak++;
          day = day.subtract(1, "day");
          if (streak > 365) break; // 무한 루프 방지
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

  // 타이머 기능들 (지속성 추가 및 정확성 개선)
  const startTimer = () => {
    const currentTimestamp = Date.now();
    const sessionId = dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8); // 고유 ID 생성

    localStorage.setItem('timerState', JSON.stringify({
      isRunning: true,
      startTime: currentTimestamp, // 실제 시작 시간 저장
      pausedTime: 0,
      sessionId: sessionId // 세션 ID 저장
    }));
    
    setTimerActive(true);
    setTimerRunning(true);
    setTimerSeconds(0); // 새로 시작할 땐 0초부터
    setActualStartTime(currentTimestamp); // 실제 시작 시간 설정
    setPausedDuration(0); // 일시정지 시간 초기화

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      // Date.now() 기반으로 초 업데이트
      setTimerSeconds(Math.floor((Date.now() - currentTimestamp - 0) / 1000));
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    
    const newPausedDuration = (pausedDuration || 0) + (Date.now() - (timerState.pausedAt || Date.now()));
    setPausedDuration(newPausedDuration); // 누적 일시정지 시간 업데이트

    localStorage.setItem('timerState', JSON.stringify({
      ...timerState,
      isRunning: false,
      pausedAt: Date.now(), // 현재 일시정지된 시각
      pausedTime: newPausedDuration // 누적된 일시정지 시간
    }));
  };

  const resumeTimer = () => {
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    
    const newPausedDuration = (pausedDuration || 0) + (Date.now() - (timerState.pausedAt || Date.now()));
    setPausedDuration(newPausedDuration); // 누적 일시정지 시간 업데이트

    localStorage.setItem('timerState', JSON.stringify({
      ...timerState,
      isRunning: true,
      pausedAt: undefined, // 일시정지 시각 초기화
      pausedTime: newPausedDuration // 누적된 일시정지 시간 저장
    }));
    
    setTimerRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      // Date.now() 기반으로 초 업데이트: actualStartTime과 newPausedDuration 활용
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

  // ✅ 핵심 수정: handleTimeSave 함수
  const handleTimeSave = (startInput: string, endInput: string) => {
    const today = dayjs();
    const startMoment = today.hour(Number(startInput.split(':')[0])).minute(Number(startInput.split(':')[1]));
    const endMoment = today.hour(Number(endInput.split(':')[0])).minute(Number(endInput.split(':')[1]));
    
    let newDurationSeconds = endMoment.diff(startMoment, 'second');
    
    // 만약 종료 시간이 시작 시간보다 이전이라면 다음 날로 간주하여 24시간을 더함
    if (newDurationSeconds < 0) {
      newDurationSeconds += 24 * 60 * 60; // 24시간 (86400초) 추가
    }

    if (newDurationSeconds <= 0) {
      alert("연습 시간은 1분 이상이어야 합니다.");
      return;
    }
    
    const recordStartTime = startMoment.valueOf(); // 타임스탬프
    const recordEndTime = endMoment.valueOf();     // 타임스탬프

    // 기존 timerState를 불러옴 (sessionId를 유지하기 위함)
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    const sessionId = timerState.sessionId || dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8); 

    const newRecord: PracticeRecord = {
      id: sessionId, 
      date: today.format("YYYY-MM-DD"),
      practiceTime: Math.floor(newDurationSeconds / 60), 
      startTime: recordStartTime,
      endTime: recordEndTime
    };

    let updatedRecords: PracticeRecord[];
    const existingRecordIndex = practiceRecords.findIndex(record => record.id === newRecord.id);

    if (existingRecordIndex > -1) {
      // 기존 레코드 업데이트 (타이머가 켜진 상태에서 수정 모드로 진입했을 경우)
      updatedRecords = [...practiceRecords];
      updatedRecords[existingRecordIndex] = newRecord;
    } else {
      // 새 레코드 추가 (아마도 직접 TimePickModal을 열어 새 기록을 만든 경우)
      updatedRecords = [...practiceRecords, newRecord];
    }
    
    setPracticeRecords(updatedRecords);
    localStorage.setItem("practiceRecords", JSON.stringify(updatedRecords));

    // ✅ 타이머 상태를 '저장' 후에도 유지하고 업데이트
    // 새로운 시작 시간 (실제 수정된 시작 시간)으로 actualStartTime 업데이트
    setActualStartTime(recordStartTime); 
    setTimerSeconds(newDurationSeconds); // 수정된 시간으로 타이머 초 업데이트

    // localStorage의 timerState도 업데이트 (sessionId는 그대로 유지)
    localStorage.setItem('timerState', JSON.stringify({
      isRunning: timerRunning, // 기존 타이머 실행 상태 유지
      startTime: recordStartTime, // 수정된 시작 시간으로 업데이트
      pausedTime: 0, // 수정 완료 후에는 일시정지 시간 초기화 (새로운 시작 시각 기준)
      sessionId: sessionId
    }));

    // 타이머 인터벌도 새롭게 시작 (또는 재개)
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerRunning) { // 타이머가 실행 중이었다면 계속 실행
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - recordStartTime - 0) / 1000)); // 새로운 시작 시간 기준
      }, 1000);
    } else { // 일시정지 상태였다면 일시정지 상태 유지
        // 여기서는 실제 타이머가 다시 시작될 때 pausedDuration이 계산될 것이므로 별도 처리 없음
    }
    
    setTimerActive(true); // 타이머 활성화 상태 유지
    setShowTimePickModal(false); // 모달 닫기
  };


  const handlePracticeComplete = () => {
    const addMinutes = Math.floor(timerSeconds / 60);
    
    if (addMinutes > 0) {
      const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
      const recordedStartTime = timerState.startTime; // startTimer에서 저장한 실제 시작 시간
      const recordedEndTime = Date.now(); // 현재 시간

      const newRecord: PracticeRecord = {
        id: timerState.sessionId, // 시작 시 부여했던 세션 ID 사용
        date: dayjs().format("YYYY-MM-DD"),
        practiceTime: addMinutes,
        startTime: recordedStartTime,
        endTime: recordedEndTime
      };

      // 기존 practiceRecords에 새 세션 추가
      const updatedRecords = [...practiceRecords, newRecord]; 

      setPracticeRecords(updatedRecords);
      localStorage.setItem("practiceRecords", JSON.stringify(updatedRecords));
    }
    
    // 타이머 관련 상태 초기화 (여기서는 완전히 종료)
    localStorage.removeItem('timerState');
    if (timerRef.current) clearInterval(timerRef.current); // 인터벌 정리
    setTimerActive(false);
    setTimerRunning(false);
    setTimerSeconds(0);
    setActualStartTime(null); // 실제 시작 시간 초기화
    setPausedDuration(0); // 일시정지 시간 초기화
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
      minHeight: "100vh", 
      background: "#ffffff",
      overflowX: "hidden", // 👈 좌우 스크롤을 방지합니다.
      overflowY: "auto", 
      margin: "0 auto",
      padding: "0", // 👈 최상위 div의 좌우 padding을 제거합니다.
      boxSizing: "border-box", 
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
        height: 20,
        fontSize: 14,
        color: "#2d2d2a",
        textAlign: "center",
        lineHeight: "20px",
        marginTop: "15px", 
        // 👇 이 내부 div에 좌우 패딩을 줍니다 (Header의 기본 패딩 16px에 맞춤)
        padding: "0 16px", 
        boxSizing: "border-box", // 패딩이 너비에 포함되도록
        ...commonFontStyle
      }}>
        {displayDate.format("YYYY. MM. DD ddd").toUpperCase()}
      </div>

      {/* Profile Section */}
      {/* ProfileSection 내부에 직접 padding을 적용해야 할 수도 있습니다. */}
      <ProfileSection 
        avatar={avatar}
        nickname={nickname}
        cheerData={cheerData}
      />

      {/* Total Achievement Card */}
      <div style={{
        width: "100%", 
        height: 60,
        background: "#c7e6df",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        // 👇 이 내부 div에 좌우 패딩을 줍니다. (Header의 기본 패딩 16px에 맞춤)
        paddingLeft: 16, 
        paddingRight: 16, // 기존 65에서 16으로 변경하여 오른쪽 여백 통일
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
        marginTop: "23px", 
        boxSizing: "border-box" ,
        margin: "23px auto 0 auto", // 중앙 정렬
        // maxWidth 375px 컨테이너에 맞게 조정 (16px * 2 = 32px)
        // 실제 width는 375 - 32 = 343px
        maxWidth: 375 - (16 * 2) // 내부 콘텐츠의 실제 최대 너비 계산
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
      {/* StatsCard 컴포넌트 내부에 직접 padding을 적용해야 할 수도 있습니다. */}
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
      {/* WeekCalendar 내부에 직접 padding을 적용해야 할 수도 있습니다. */}
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "43px auto 0 auto", 
          // 👇 이 요소에만 특정 패딩이 필요한 경우 여기에도 추가할 수 있습니다.
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
          currentDuration={timerSeconds} // TimePickModal에 현재 경과 시간 전달 (수정 시 초기값)
          actualStartTime={actualStartTime} // ✅ 추가: 실제 시작 시간을 TimePickModal에 전달
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