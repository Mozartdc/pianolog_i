// src/contexts/PracticeDataContext.tsx
import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { getStoredJson, setStoredJson } from '../utils/localStorage';
import { deleteRecordingBlob } from '../utils/recordingStorage';

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

export type TrackRecording = {
  id: string;
  trackId: number;
  archiveName: string;
  createdAt: string;
  durationMs: number;
  note?: string;
  sourceType: 'recorded' | 'imported';
  mimeType: string;
};

// New timer state V2
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

// Add new timer state and methods to context type
interface PracticeDataContextType {
  // Basic data management
  selectedDate: string;
  setSelectedDate: (dateStr: string) => void;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  practiceRecords: PracticeRecord[];
  setPracticeRecords: React.Dispatch<React.SetStateAction<PracticeRecord[]>>;
  practiceChecks: PracticeChecks;
  setPracticeChecks: React.Dispatch<React.SetStateAction<PracticeChecks>>;
  partialCounts: PartialCounts;
  setPartialCounts: React.Dispatch<React.SetStateAction<PartialCounts>>;
  trackRecordings: TrackRecording[];
  setTrackRecordings: React.Dispatch<React.SetStateAction<TrackRecording[]>>;
  updateTrackAddedDate: (id: number, dateStr: string) => void;

  
  // New timer state (V2)
  timerActive: boolean;          // Session in progress (including paused)
  timerSeconds: number;          // In seconds (legacy compatibility)
  timerMilliseconds: number;     // In milliseconds (precision)
  timerRunning: boolean;         // Whether ticking is active
  timerStartTime: number | null; // Start time
  timerMemo: string;
  timerSessionId: string;
  
  // New timer methods
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: (memo?: string) => void;
  updateTimerStartTime: (newStartTimeMs: number) => void;
  updateTimerMemo: (memo: string) => void;
  
  // Basic actions
  addTrack: (title: string) => void;
  removeTrack: (id: number) => void;
  updateTrackTitle: (id: number, newTitle: string) => void;
  toggleCheck: (date: string, trackId: number) => void;
  incPartial: (date: string, key: number | string) => void;
  decPartial: (date: string, key: number | string) => void;
  markTrackComplete: (trackId: number, date: string) => void;
  unmarkTrackComplete: (trackId: number) => void;
  addTrackRecording: (recording: TrackRecording) => void;
  updateTrackRecordingNote: (recordingId: string, note: string) => void;
  removeTrackRecording: (recordingId: string) => void;
}

const PracticeDataContext = createContext<PracticeDataContextType | undefined>(undefined);

// Timer bootstrap logic
const initializeTimerState = (): TimerStateV2 => {
  const timerV2 = getStoredJson<TimerStateV2 | null>('timerV2', null);
  const oldTimerState = getStoredJson<{ memo?: string } | null>('timerState', null);
  
  if (timerV2 && timerV2.version === 2) {
    console.log('🔄 타이머 V2 복원:', timerV2);
    return timerV2;
  } else if (oldTimerState) {
    console.log('🔄 구 타이머에서 memo만 마이그레이션:', oldTimerState);
    const memo = oldTimerState.memo || '';
    
    // Delete old keys
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
    
    setStoredJson('timerV2', newState);
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
    
    setStoredJson('timerV2', newState);
    return newState;
  }
};

export const PracticeDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const todayDateStr = dayjs().format("YYYY-MM-DD");
  const initialSelectedDate =
    getStoredJson<string>("selectedDate", "") ||
    getStoredJson<string>("lastSelectedDate", "") ||
    todayDateStr;

  const [selectedDate, setSelectedDateState] = useState<string>(initialSelectedDate);

  // Existing states (no changes)
  const [tracks, setTracks] = useState<Track[]>(() => getStoredJson<Track[]>("tracks", []));
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(() => getStoredJson<PracticeRecord[]>("practiceRecords", []));
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>(() => getStoredJson<PracticeChecks>("practiceChecks", {}));
  const [partialCounts, setPartialCounts] = useState<PartialCounts>(() => getStoredJson<PartialCounts>("partialCounts", {}));
  const [trackRecordings, setTrackRecordings] = useState<TrackRecording[]>(() => getStoredJson<TrackRecording[]>("trackRecordings", []));

  // New timer states
  const [timerStateV2, setTimerStateV2] = useState<TimerStateV2>(() => initializeTimerState());
  const [timerMilliseconds, setTimerMilliseconds] = useState<number>(0);
  
  // Timer interval management
  const intervalRef = useRef<number | null>(null);
  
  // Computed values for legacy compatibility
  const timerActive = timerStateV2.isActive;
  const timerRunning = timerStateV2.isRunning;
  const timerSeconds = Math.floor(timerMilliseconds / 1000);
  const timerStartTime = timerStateV2.startTimeMs;
  const timerMemo = timerStateV2.memo;
  const timerSessionId = timerStateV2.sessionId;

  // Timer state save function
  const saveTimerState = useCallback((newState: TimerStateV2) => {
    const stateToSave = {
      ...newState,
      lastUpdatedMs: Date.now()
    };
    setTimerStateV2(stateToSave);
    setStoredJson('timerV2', stateToSave);
  }, []);

  const setSelectedDate = useCallback((dateStr: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
    setSelectedDateState(dateStr);
  }, []);

  // Timer tick management
  useEffect(() => {
    if (timerStateV2.isActive && timerStateV2.isRunning && timerStateV2.startTimeMs) {
      console.log('⏱️ 타이머 틱 시작');
      
      intervalRef.current = window.setInterval(() => {
        const startTimeMs = timerStateV2.startTimeMs;
        if (!startTimeMs) {
          console.warn('타이머 startTimeMs가 없어 틱을 중단합니다.');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimerMilliseconds(0);
          return;
        }

        const now = Date.now();
        const elapsed = now - startTimeMs - timerStateV2.pausedAccumMs;
        const elapsedMs = Math.max(0, elapsed);
        
        setTimerMilliseconds(elapsedMs);
      }, 100); // 100ms precision
      
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

  // Timer restoration logic on app start
  useEffect(() => {
    if (timerStateV2.isActive && timerStateV2.startTimeMs) {
      console.log('🔄 앱 시작시 타이머 복원');
      const now = Date.now();
      
      let currentPausedAccum = timerStateV2.pausedAccumMs;
      
      // If app was closed while paused, accumulate pause time
      if (!timerStateV2.isRunning && timerStateV2.pausedAtMs) {
        const additionalPausedTime = now - timerStateV2.pausedAtMs;
        currentPausedAccum += additionalPausedTime;
        
        console.log('⏸️ 일시정지 시간 추가 누적:', {
          기존누적: Math.floor(timerStateV2.pausedAccumMs / 1000) + '초',
          추가시간: Math.floor(additionalPausedTime / 1000) + '초',
          총누적: Math.floor(currentPausedAccum / 1000) + '초'
        });
        
        // Update state
        saveTimerState({
          ...timerStateV2,
          pausedAccumMs: currentPausedAccum,
          pausedAtMs: null
        });
      }
      
      // Calculate and set current elapsed time
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
  }, []); // Run only once on mount

  // New timer methods
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
    
    // If completing while paused, accumulate the final pause time
    if (!timerStateV2.isRunning && timerStateV2.pausedAtMs) {
      finalPausedAccum += now - timerStateV2.pausedAtMs;
    }
    
    const totalElapsed = now - timerStateV2.startTimeMs;
    const actualRunTime = totalElapsed - finalPausedAccum;
    const durationMinutes = Math.floor(actualRunTime / 60000);
    
    // Handle memo (use parameter if provided, otherwise use current state memo)
    const finalMemo = memo !== undefined ? memo : timerStateV2.memo;
    
    // Add practice record
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
    
    // Reset timer state
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
    
    // Recalculate elapsed time based on current time
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

  const updateTimerMemo = useCallback((memo: string) => {
    if (!timerStateV2.isActive) {
      console.log('⚠️ 비활성 세션 - 메모 수정 불가');
      return;
    }

    saveTimerState({
      ...timerStateV2,
      memo,
      lastUpdatedMs: Date.now()
    });
  }, [timerStateV2, saveTimerState]);

  // Debounced localStorage save function (for existing data)
  const debouncedSave = useCallback((key: string, value: any) => {
    const timeoutId = setTimeout(() => {
      setStoredJson(key, value);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Existing data localStorage sync (no changes)
  useEffect(() => {
    const cleanup = debouncedSave("selectedDate", selectedDate);
    return cleanup;
  }, [selectedDate, debouncedSave]);

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

  useEffect(() => {
    const cleanup = debouncedSave("trackRecordings", trackRecordings);
    return cleanup;
  }, [trackRecordings, debouncedSave]);

  // Existing actions (no changes)
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
    setTrackRecordings(prev => {
      const toDelete = prev.filter(recording => recording.trackId === id);
      toDelete.forEach((recording) => {
        void deleteRecordingBlob(recording.id).catch((error) => {
          console.error('녹음 파일 삭제 실패:', error);
        });
      });
      return prev.filter(recording => recording.trackId !== id);
    });
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

  const addTrackRecording = useCallback((recording: TrackRecording) => {
    setTrackRecordings(prev => [recording, ...prev].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()));
  }, []);

  const updateTrackRecordingNote = useCallback((recordingId: string, note: string) => {
    setTrackRecordings(prev =>
      prev.map(recording =>
        recording.id === recordingId
          ? { ...recording, note: note.trim() || undefined }
          : recording
      )
    );
  }, []);

  const removeTrackRecording = useCallback((recordingId: string) => {
    setTrackRecordings(prev => prev.filter(recording => recording.id !== recordingId));
    void deleteRecordingBlob(recordingId).catch((error) => {
      console.error('녹음 파일 삭제 실패:', error);
    });
  }, []);

  // Storage change listener (same as before, with timerV2 added)
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

      if (event.key === "trackRecordings" && event.newValue) {
        try {
          const newRecordings = JSON.parse(event.newValue);
          if (Array.isArray(newRecordings)) {
            console.log('🎙️ trackRecordings 외부 업데이트:', newRecordings.length + '개');
            setTrackRecordings(newRecordings);
          }
        } catch (e) {
          console.error('❌ trackRecordings 파싱 실패:', e);
        }
      }
      
      // New timerV2 sync
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
    selectedDate,
    setSelectedDate,
    tracks, setTracks,
    practiceRecords, setPracticeRecords,
    practiceChecks, setPracticeChecks,
    partialCounts, setPartialCounts,
    trackRecordings, setTrackRecordings,
    updateTrackAddedDate,

    
    // New timer state
    timerActive, timerSeconds, timerMilliseconds, timerRunning, timerStartTime, timerMemo, timerSessionId,
    
    // New timer methods
    startSession, pauseSession, resumeSession, completeSession, updateTimerStartTime, updateTimerMemo,
    
    addTrack, removeTrack, updateTrackTitle,
    toggleCheck, incPartial, decPartial,
    markTrackComplete, unmarkTrackComplete,
    addTrackRecording, updateTrackRecordingNote, removeTrackRecording
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
