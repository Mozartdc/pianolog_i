// src/contexts/PracticeDataContext.tsx
import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useCallback, useRef } from 'react';
import dayjs from 'dayjs';

// Basic data types
export type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

export interface PracticeRecord {
  id: string;
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  memo?: string;
  track?: string;
}

export type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

export type PartialCounts = {
  [date: string]: { [key: string]: number };
};

// ✅ 새로운 타이머 상태 V2
interface TimerStateV2 {
  version: 2;
  startTimeMs: number | null;
  pausedAccumMs: number;
  pausedAtMs: number | null;
  isActive: boolean;
  isRunning: boolean;
  memo: string;
  sessionId: string;
  lastUpdatedMs: number;
}

// ✅ Context 타입에 새로운 타이머 상태 및 메서드 추가
interface PracticeDataContextType {
  // Basic data management
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  practiceRecords: PracticeRecord[];
  setPracticeRecords: React.Dispatch<React.SetStateAction<PracticeRecord[]>>;
  practiceChecks: PracticeChecks;
  setPracticeChecks: React.Dispatch<React.SetStateAction<PracticeChecks>>;
  partialCounts: PartialCounts;
  setPartialCounts: React.Dispatch<React.SetStateAction<PartialCounts>>;
  updateTrackAddedDate: (id: number, dateStr: string) => void;

  
  // ✅ 새로운 타이머 상태 (V2)
  timerActive: boolean;          // 세션 진행 중 (일시정지 포함)
  timerSeconds: number;          // 초 단위 (기존 호환)
  timerMilliseconds: number;     // 밀리초 단위 (정밀도)
  timerRunning: boolean;         // 틱 진행 여부
  timerStartTime: number | null; // ← 이 줄 추가
  
  // ✅ 새로운 타이머 메서드들
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: (memo?: string) => void;
  updateTimerStartTime: (newStartTimeMs: number) => void;
  
  // ✅ 기존 호환을 위한 setter들 (HomeScreen에서 사용 중)
  setTimerActive: (active: boolean) => void;
  setTimerSeconds: (seconds: number) => void;
  setTimerRunning: (running: boolean) => void;
  
  // Basic actions
  addTrack: (title: string) => void;
  removeTrack: (id: number) => void;
  updateTrackTitle: (id: number, newTitle: string) => void;
  toggleCheck: (date: string, trackId: number) => void;
  incPartial: (date: string, key: number | string) => void;
  decPartial: (date: string, key: number | string) => void;
  markTrackComplete: (trackId: number, date: string) => void;
  unmarkTrackComplete: (trackId: number) => void;
}

const PracticeDataContext = createContext<PracticeDataContextType | undefined>(undefined);

// ✅ 안전한 localStorage 유틸리티 함수들
const safeLocalStorageGet = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    const parsed = item ? JSON.parse(item) : defaultValue;
    console.log(`📖 localStorage 읽기 [${key}]:`, { 
      raw: item?.substring(0, 100) + (item && item.length > 100 ? '...' : ''),
      parsed: Array.isArray(parsed) ? `배열 ${parsed.length}개` : typeof parsed,
      success: true 
    });
    return parsed;
  } catch (e) {
    console.error(`❌ localStorage 읽기 실패 [${key}]:`, e);
    return defaultValue;
  }
};

const safeLocalStorageSet = (key: string, value: any) => {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > 5 * 1024 * 1024) {
      console.warn(`⚠️ 데이터 크기 초과 [${key}]: ${Math.floor(serialized.length / 1024)}KB`);
      return false;
    }
    localStorage.setItem(key, serialized);
    console.log(`💾 localStorage 저장 [${key}]:`, { 
      size: `${Math.floor(serialized.length / 1024)}KB`,
      type: Array.isArray(value) ? `배열 ${value.length}개` : typeof value,
      success: true 
    });
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('❌ localStorage 용량 초과');
    } else {
      console.error(`❌ localStorage 저장 실패 [${key}]:`, e);
    }
    return false;
  }
};

// ✅ 타이머 부트스트랩 로직
const initializeTimerState = (): TimerStateV2 => {
  const timerV2 = safeLocalStorageGet('timerV2', null);
  const oldTimerState = safeLocalStorageGet('timerState', null);
  
  if (timerV2 && timerV2.version === 2) {
    console.log('🔄 타이머 V2 복원:', timerV2);
    return timerV2;
  } else if (oldTimerState) {
    console.log('🔄 구 타이머에서 memo만 마이그레이션:', oldTimerState);
    const memo = oldTimerState.memo || '';
    
    // 구 키 삭제
    localStorage.removeItem('timerState');
    localStorage.removeItem('pauseStartTime');
    
    const newState: TimerStateV2 = {
      version: 2,
      startTimeMs: null,
      pausedAccumMs: 0,
      pausedAtMs: null,
      isActive: false,
      isRunning: false,
      memo,
      sessionId: '',
      lastUpdatedMs: Date.now()
    };
    
    safeLocalStorageSet('timerV2', newState);
    console.log('✅ 마이그레이션 완료, 구 키 삭제');
    return newState;
  } else {
    console.log('🆕 새로운 타이머 상태 생성');
    const newState: TimerStateV2 = {
      version: 2,
      startTimeMs: null,
      pausedAccumMs: 0,
      pausedAtMs: null,
      isActive: false,
      isRunning: false,
      memo: '',
      sessionId: '',
      lastUpdatedMs: Date.now()
    };
    
    safeLocalStorageSet('timerV2', newState);
    return newState;
  }
};

export const PracticeDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // ✅ 기존 상태들 (변경 없음)
  const [tracks, setTracks] = useState<Track[]>(() => safeLocalStorageGet("tracks", []));
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(() => safeLocalStorageGet("practiceRecords", []));
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>(() => safeLocalStorageGet("practiceChecks", {}));
  const [partialCounts, setPartialCounts] = useState<PartialCounts>(() => safeLocalStorageGet("partialCounts", {}));

  // ✅ 새로운 타이머 상태들
  const [timerStateV2, setTimerStateV2] = useState<TimerStateV2>(() => initializeTimerState());
  const [timerMilliseconds, setTimerMilliseconds] = useState<number>(0);
  
  // ✅ 타이머 인터벌 관리
  const intervalRef = useRef<number | null>(null);
  
  // ✅ 기존 호환을 위한 computed 값들
  const timerActive = timerStateV2.isActive;
  const timerRunning = timerStateV2.isRunning;
  const timerSeconds = Math.floor(timerMilliseconds / 1000);
  const timerStartTime = timerStateV2.startTimeMs; // ← 이 줄 추가

  // ✅ 타이머 상태 저장 함수
  const saveTimerState = useCallback((newState: TimerStateV2) => {
    const stateToSave = {
      ...newState,
      lastUpdatedMs: Date.now()
    };
    setTimerStateV2(stateToSave);
    safeLocalStorageSet('timerV2', stateToSave);
  }, []);

  // ✅ 타이머 틱 관리
  useEffect(() => {
    if (timerStateV2.isActive && timerStateV2.isRunning && timerStateV2.startTimeMs) {
      console.log('⏱️ 타이머 틱 시작');
      
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = now - timerStateV2.startTimeMs! - timerStateV2.pausedAccumMs;
        const elapsedMs = Math.max(0, elapsed);
        
        setTimerMilliseconds(elapsedMs);
      }, 100); // 100ms 정밀도
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [timerStateV2.isActive, timerStateV2.isRunning, timerStateV2.startTimeMs, timerStateV2.pausedAccumMs]);

  // ✅ 앱 시작시 타이머 복원 로직
  useEffect(() => {
    if (timerStateV2.isActive && timerStateV2.startTimeMs) {
      console.log('🔄 앱 시작시 타이머 복원');
      const now = Date.now();
      
      let currentPausedAccum = timerStateV2.pausedAccumMs;
      
      // 일시정지 상태에서 앱이 종료되었다면 일시정지 시간 누적
      if (!timerStateV2.isRunning && timerStateV2.pausedAtMs) {
        const additionalPausedTime = now - timerStateV2.pausedAtMs;
        currentPausedAccum += additionalPausedTime;
        
        console.log('⏸️ 일시정지 시간 추가 누적:', {
          기존누적: Math.floor(timerStateV2.pausedAccumMs / 1000) + '초',
          추가시간: Math.floor(additionalPausedTime / 1000) + '초',
          총누적: Math.floor(currentPausedAccum / 1000) + '초'
        });
        
        // 상태 업데이트
        saveTimerState({
          ...timerStateV2,
          pausedAccumMs: currentPausedAccum,
          pausedAtMs: null
        });
      }
      
      // 현재 경과 시간 계산 및 설정
      const totalElapsed = now - timerStateV2.startTimeMs;
      const actualRunTime = totalElapsed - currentPausedAccum;
      const elapsedMs = Math.max(0, actualRunTime);
      
      setTimerMilliseconds(elapsedMs);
      
      console.log('📊 타이머 복원 완료:', {
        세션시작: new Date(timerStateV2.startTimeMs).toLocaleTimeString(),
        현재시간: new Date(now).toLocaleTimeString(),
        총경과: Math.floor(totalElapsed / 1000) + '초',
        일시정지누적: Math.floor(currentPausedAccum / 1000) + '초',
        실제실행: Math.floor(actualRunTime / 1000) + '초',
        실행중: timerStateV2.isRunning
      });
    }
  }, []); // 최초 한 번만 실행

  // ✅ 새로운 타이머 메서드들
  const startSession = useCallback(() => {
    const now = Date.now();
    const sessionId = crypto.randomUUID?.() || `${dayjs().valueOf()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const newState: TimerStateV2 = {
      version: 2,
      startTimeMs: now,
      pausedAccumMs: 0,
      pausedAtMs: null,
      isActive: true,
      isRunning: true,
      memo: '',
      sessionId,
      lastUpdatedMs: now
    };
    
    saveTimerState(newState);
    setTimerMilliseconds(0);
    
    console.log('▶️ 세션 시작:', {
      sessionId,
      시작시간: new Date(now).toLocaleTimeString()
    });
  }, [saveTimerState]);

  const pauseSession = useCallback(() => {
    if (!timerStateV2.isRunning || !timerStateV2.isActive) {
      console.log('⚠️ 일시정지 불가: 실행 중이 아님');
      return;
    }
    
    const now = Date.now();
    const newState: TimerStateV2 = {
      ...timerStateV2,
      isRunning: false,
      pausedAtMs: now,
      lastUpdatedMs: now
    };
    
    saveTimerState(newState);
    
    console.log('⏸️ 세션 일시정지:', {
      일시정지시간: new Date(now).toLocaleTimeString(),
      현재표시시간: Math.floor(timerMilliseconds / 1000) + '초'
    });
  }, [timerStateV2, timerMilliseconds, saveTimerState]);

  const resumeSession = useCallback(() => {
    if (timerStateV2.isRunning || !timerStateV2.isActive || !timerStateV2.pausedAtMs) {
      console.log('⚠️ 재시작 불가: 일시정지 상태가 아님');
      return;
    }
    
    const now = Date.now();
    const pauseDuration = now - timerStateV2.pausedAtMs;
    const newPausedAccum = timerStateV2.pausedAccumMs + pauseDuration;
    
    const newState: TimerStateV2 = {
      ...timerStateV2,
      isRunning: true,
      pausedAccumMs: newPausedAccum,
      pausedAtMs: null,
      lastUpdatedMs: now
    };
    
    saveTimerState(newState);
    
    console.log('▶️ 세션 재시작:', {
      일시정지기간: Math.floor(pauseDuration / 1000) + '초',
      누적일시정지: Math.floor(newPausedAccum / 1000) + '초',
      재시작시간: new Date(now).toLocaleTimeString()
    });
  }, [timerStateV2, saveTimerState]);

  const completeSession = useCallback((memo?: string) => {
    if (!timerStateV2.isActive || !timerStateV2.startTimeMs) {
      console.log('⚠️ 완료 불가: 활성 세션이 없음');
      return;
    }
    
    const now = Date.now();
    let finalPausedAccum = timerStateV2.pausedAccumMs;
    
    // 일시정지 상태에서 완료하는 경우 마지막 일시정지 시간도 누적
    if (!timerStateV2.isRunning && timerStateV2.pausedAtMs) {
      finalPausedAccum += now - timerStateV2.pausedAtMs;
    }
    
    const totalElapsed = now - timerStateV2.startTimeMs;
    const actualRunTime = totalElapsed - finalPausedAccum;
    const durationMinutes = Math.floor(actualRunTime / 60000);
    
    // 메모 처리 (파라미터가 없으면 현재 상태의 메모 사용)
    const finalMemo = memo !== undefined ? memo : timerStateV2.memo;
    
    // 연습 기록 추가
    if (durationMinutes > 0) {
      const newRecord: PracticeRecord = {
        id: timerStateV2.sessionId,
        date: dayjs(timerStateV2.startTimeMs).format('YYYY-MM-DD'),
        practiceTime: durationMinutes,
        startTime: timerStateV2.startTimeMs,
        endTime: now,
        memo: finalMemo
      };
      
      setPracticeRecords(prev => {
        const existingIndex = prev.findIndex(r => r.id === newRecord.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newRecord;
          return updated;
        } else {
          return [...prev, newRecord];
        }
      });
      
      console.log('📝 연습 기록 추가:', {
        기간: durationMinutes + '분',
        메모: finalMemo || '(없음)',
        실제실행시간: Math.floor(actualRunTime / 1000) + '초',
        총경과시간: Math.floor(totalElapsed / 1000) + '초',
        일시정지누적: Math.floor(finalPausedAccum / 1000) + '초'
      });
    }
    
    // 타이머 상태 리셋
    const resetState: TimerStateV2 = {
      version: 2,
      startTimeMs: null,
      pausedAccumMs: 0,
      pausedAtMs: null,
      isActive: false,
      isRunning: false,
      memo: '',
      sessionId: '',
      lastUpdatedMs: now
    };
    
    saveTimerState(resetState);
    setTimerMilliseconds(0);
    
    console.log('🏁 세션 완료 및 리셋');
  }, [timerStateV2, setPracticeRecords, saveTimerState]);
  const updateTimerStartTime = useCallback((newStartTimeMs: number) => {
    if (!timerStateV2.isActive) {
      console.log('⚠️ 비활성 세션 - 시작시간 수정 불가');
      return;
    }
    
    const newState: TimerStateV2 = {
      ...timerStateV2,
      startTimeMs: newStartTimeMs,
      lastUpdatedMs: Date.now()
    };
    
    saveTimerState(newState);
    
    // 현재 시간 기준으로 경과시간 재계산
    const now = Date.now();
    const totalElapsed = now - newStartTimeMs;
    const actualRunTime = totalElapsed - timerStateV2.pausedAccumMs;
    const elapsedMs = Math.max(0, actualRunTime);
    
    setTimerMilliseconds(elapsedMs);
    
    console.log('🔄 타이머 시작시간 수정 완료:', {
      새시작시간: new Date(newStartTimeMs).toLocaleTimeString(),
      현재표시시간: Math.floor(elapsedMs / 1000) + '초'
    });
  }, [timerStateV2, saveTimerState]);

  // ✅ 기존 호환을 위한 setter들 (HomeScreen이 아직 사용 중)
  const setTimerActive = useCallback((active: boolean) => {
    console.log('🔧 호환: setTimerActive', active);
    // 필요시 구현, 현재는 새 메서드 사용 권장
  }, []);

  const setTimerSecondsCompat = useCallback((seconds: number) => {
    console.log('🔧 호환: setTimerSeconds', seconds);
    // timerMilliseconds를 통해 자동 계산되므로 직접 설정 불필요
  }, []);

  const setTimerRunning = useCallback((running: boolean) => {
    console.log('🔧 호환: setTimerRunning', running);
    // pauseSession/resumeSession 사용 권장
  }, []);

  // ✅ 디바운스된 localStorage 저장 함수 (기존 데이터용)
  const debouncedSave = useCallback((key: string, value: any) => {
    const timeoutId = setTimeout(() => {
      safeLocalStorageSet(key, value);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // ✅ 기존 데이터 localStorage 동기화 (변경 없음)
  useEffect(() => {
    const cleanup = debouncedSave("tracks", tracks);
    return cleanup;
  }, [tracks, debouncedSave]);

  useEffect(() => {
    const cleanup = debouncedSave("practiceRecords", practiceRecords);
    return cleanup;
  }, [practiceRecords, debouncedSave]);

  useEffect(() => {
    const cleanup = debouncedSave("practiceChecks", practiceChecks);
    return cleanup;
  }, [practiceChecks, debouncedSave]);

  useEffect(() => {
    const cleanup = debouncedSave("partialCounts", partialCounts);
    return cleanup;
  }, [partialCounts, debouncedSave]);

  // ✅ 기존 액션들 (변경 없음)
  const addTrack = useCallback((title: string) => {
    if (!title.trim()) return;
    const newTrack: Track = { 
      id: Date.now(), 
      title: title.trim(), 
      addedDate: dayjs().format("YYYY-MM-DD") 
    };
    console.log('➕ 트랙 추가:', newTrack);
    setTracks(prev => [...prev, newTrack]);
  }, []);

  const removeTrack = useCallback((id: number) => {
    console.log('🗑️ 트랙 삭제:', id);
    setTracks(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const updateTrackTitle = useCallback((id: number, newTitle: string) => {
    console.log('✏️ 트랙 제목 수정:', { id, newTitle });
    setTracks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  }, []);

  const toggleCheck = useCallback((date: string, trackId: number) => {
    console.log('✅ 체크 토글:', { date, trackId });
    setPracticeChecks(prev => {
      const dayChecks = prev[date] ? { ...prev[date] } : {};
      dayChecks[trackId] = !dayChecks[trackId];
      return { ...prev, [date]: dayChecks };
    });
  }, []);

  const updateTrackAddedDate = useCallback((id: number, dateStr: string) => {
  setTracks(prev => prev.map(t =>
    (t.id === id && t.addedDate > dateStr) ? { ...t, addedDate: dateStr } : t
  ));
}, []);


  const incPartial = useCallback((date: string, key: number | string) => {
    setPartialCounts(prev => {
      const dayCounts = prev[date] || {};
      const newCount = (dayCounts[key] || 0) + 1;
      return { ...prev, [date]: { ...dayCounts, [key]: newCount } };
    });
  }, []);

  const decPartial = useCallback((date: string, key: number | string) => {
    setPartialCounts(prev => {
      const dayCounts = prev[date] || {};
      const newCount = Math.max((dayCounts[key] || 0) - 1, 0);
      return { ...prev, [date]: { ...dayCounts, [key]: newCount } };
    });
  }, []);

  const markTrackComplete = useCallback((trackId: number, date: string) => {
    console.log('🎯 트랙 완료 표시:', { trackId, date });
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, completedDate: date } : t));
  }, []);
  
  const unmarkTrackComplete = useCallback((trackId: number) => {
    console.log('↩️ 트랙 완료 해제:', trackId);
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, completedDate: undefined } : t));
  }, []);

  // ✅ Storage change listener (기존과 동일, timerV2 추가)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      console.log('🔄 Storage 이벤트:', { key: event.key, hasNewValue: !!event.newValue });
      
      if (event.key === "practiceRecords" && event.newValue) {
        try {
          const newRecords = JSON.parse(event.newValue);
          if (Array.isArray(newRecords)) {
            console.log('📊 practiceRecords 외부 업데이트:', newRecords.length + '개');
            setPracticeRecords(newRecords);
          }
        } catch (e) {
          console.error('❌ practiceRecords 파싱 실패:', e);
        }
      }
      
      if (event.key === "tracks" && event.newValue) {
        try {
          const newTracks = JSON.parse(event.newValue);
          if (Array.isArray(newTracks)) {
            console.log('🎵 tracks 외부 업데이트:', newTracks.length + '개');
            setTracks(newTracks);
          }
        } catch (e) {
          console.error('❌ tracks 파싱 실패:', e);
        }
      }
      
      if (event.key === "practiceChecks" && event.newValue) {
        try {
          const newChecks = JSON.parse(event.newValue);
          if (typeof newChecks === 'object') {
            console.log('✅ practiceChecks 외부 업데이트');
            setPracticeChecks(newChecks);
          }
        } catch (e) {
          console.error('❌ practiceChecks 파싱 실패:', e);
        }
      }
      
      if (event.key === "partialCounts" && event.newValue) {
        try {
          const newCounts = JSON.parse(event.newValue);
          if (typeof newCounts === 'object') {
            console.log('🔢 partialCounts 외부 업데이트');
            setPartialCounts(newCounts);
          }
        } catch (e) {
          console.error('❌ partialCounts 파싱 실패:', e);
        }
      }
      
      // ✅ 새로운 timerV2 동기화
      if (event.key === "timerV2" && event.newValue) {
        try {
          const newTimerState = JSON.parse(event.newValue);
          if (newTimerState && newTimerState.version === 2) {
            console.log('⏱️ timerV2 외부 업데이트');
            setTimerStateV2(newTimerState);
          }
        } catch (e) {
          console.error('❌ timerV2 파싱 실패:', e);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const value = {
    tracks, setTracks,
    practiceRecords, setPracticeRecords,
    practiceChecks, setPracticeChecks,
    partialCounts, setPartialCounts,
    updateTrackAddedDate,

    
    // ✅ 새로운 타이머 상태
    timerActive, timerSeconds, timerMilliseconds, timerRunning, timerStartTime, // ← timerStartTime 추가
    
    // ✅ 새로운 타이머 메서드
    startSession, pauseSession, resumeSession, completeSession, updateTimerStartTime,
    
    // ✅ 기존 호환 setter들
    setTimerActive, setTimerSeconds: setTimerSecondsCompat, setTimerRunning,
    
    addTrack, removeTrack, updateTrackTitle,
    toggleCheck, incPartial, decPartial,
    markTrackComplete, unmarkTrackComplete
  };

  return (
    <PracticeDataContext.Provider value={value}>
      {children}
    </PracticeDataContext.Provider>
  );
};

export const usePracticeData = () => {
  const context = useContext(PracticeDataContext);
  if (context === undefined) {
    throw new Error('usePracticeData must be used within a PracticeDataProvider');
  }
  return context;
};