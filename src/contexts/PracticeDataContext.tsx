import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import dayjs from 'dayjs';

// --- 모든 데이터 타입을 한 곳에서 정의 ---
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
  [date: string]: { [key: string]: number }; // ✅ trackId (number)와 'practice' (string)를 모두 키로 사용
};

// --- Context가 제공할 값들의 타입 정의 ---
interface PracticeDataContextType {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  practiceRecords: PracticeRecord[];
  setPracticeRecords: React.Dispatch<React.SetStateAction<PracticeRecord[]>>;
  practiceChecks: PracticeChecks;
  setPracticeChecks: React.Dispatch<React.SetStateAction<PracticeChecks>>;
  partialCounts: PartialCounts;
  setPartialCounts: React.Dispatch<React.SetStateAction<PartialCounts>>;
  addTrack: (title: string) => void;
  removeTrack: (id: number) => void;
  updateTrackTitle: (id: number, newTitle: string) => void;
  toggleCheck: (date: string, trackId: number) => void;
  // ✅ key의 타입을 number | string으로 변경
  incPartial: (date: string, key: number | string) => void;
  decPartial: (date: string, key: number | string) => void;
  markTrackComplete: (trackId: number, date: string) => void;
  unmarkTrackComplete: (trackId: number) => void;
}

const PracticeDataContext = createContext<PracticeDataContextType | undefined>(undefined);

export const PracticeDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>(() => JSON.parse(localStorage.getItem("tracks") || "[]"));
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(() => JSON.parse(localStorage.getItem("practiceRecords") || "[]"));
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>(() => JSON.parse(localStorage.getItem("practiceChecks") || "{}"));
  const [partialCounts, setPartialCounts] = useState<PartialCounts>(() => JSON.parse(localStorage.getItem("partialCounts") || "{}"));

  useEffect(() => { localStorage.setItem("tracks", JSON.stringify(tracks)); }, [tracks]);
  useEffect(() => { localStorage.setItem("practiceRecords", JSON.stringify(practiceRecords)); }, [practiceRecords]);
  useEffect(() => { localStorage.setItem("practiceChecks", JSON.stringify(practiceChecks)); }, [practiceChecks]);
  useEffect(() => { localStorage.setItem("partialCounts", JSON.stringify(partialCounts)); }, [partialCounts]);

  const addTrack = (title: string) => {
    if (!title.trim()) return;
    const newTrack: Track = { id: Date.now(), title: title.trim(), addedDate: dayjs().format("YYYY-MM-DD") };
    setTracks(prev => [...prev, newTrack]);
  };

  const removeTrack = (id: number) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };
  
  const updateTrackTitle = (id: number, newTitle: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  const toggleCheck = (date: string, trackId: number) => {
    setPracticeChecks(prev => {
      const dayChecks = prev[date] ? { ...prev[date] } : {};
      dayChecks[trackId] = !dayChecks[trackId];
      return { ...prev, [date]: dayChecks };
    });
  };

  // ✅ key 타입을 number | string으로 수정
  const incPartial = (date: string, key: number | string) => {
    setPartialCounts(prev => {
      const dayCounts = prev[date] || {};
      const newCount = (dayCounts[key] || 0) + 1;
      return { ...prev, [date]: { ...dayCounts, [key]: newCount } };
    });
  };

  // ✅ key 타입을 number | string으로 수정
  const decPartial = (date: string, key: number | string) => {
    setPartialCounts(prev => {
      const dayCounts = prev[date] || {};
      const newCount = Math.max((dayCounts[key] || 0) - 1, 0);
      return { ...prev, [date]: { ...dayCounts, [key]: newCount } };
    });
  };

  const markTrackComplete = (trackId: number, date: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, completedDate: date } : t));
  };
  
  const unmarkTrackComplete = (trackId: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, completedDate: undefined } : t));
  };

  // ✅ [추가] localStorage 변경을 감지하고 모든 상태를 동기화하는 로직
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      console.log('Storage event fired:', event.key);
      if (event.key === "practiceRecords" && event.newValue) {
        setPracticeRecords(JSON.parse(event.newValue));
      }
      if (event.key === "tracks" && event.newValue) {
        setTracks(JSON.parse(event.newValue));
      }
      if (event.key === "practiceChecks" && event.newValue) {
        setPracticeChecks(JSON.parse(event.newValue));
      }
      if (event.key === "partialCounts" && event.newValue) {
        setPartialCounts(JSON.parse(event.newValue));
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("storage", handleStorageChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // 이 useEffect는 앱이 시작될 때 딱 한 번만 실행됩니다.


  const value = {
    tracks, setTracks,
    practiceRecords, setPracticeRecords,
    practiceChecks, setPracticeChecks,
    partialCounts, setPartialCounts,
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

// --- Context를 쉽게 사용하기 위한 Custom Hook ---
export const usePracticeData = () => {
  const context = useContext(PracticeDataContext);
  if (context === undefined) {
    throw new Error('usePracticeData must be used within a PracticeDataProvider');
  }
  return context;
};