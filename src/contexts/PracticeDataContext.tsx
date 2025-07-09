// src/contexts/PracticeDataContext.tsx

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
  [date: string]: { [trackId: number]: number };
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
  toggleCheck: (date: string, trackId: number) => void;
  incPartial: (date: string, trackId: number) => void;
  decPartial: (date: string, trackId: number) => void;
}

// --- Context 생성 ---
const PracticeDataContext = createContext<PracticeDataContextType | undefined>(undefined);

// --- Provider 컴포넌트 생성 ---
export const PracticeDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // 모든 데이터 상태를 여기서 관리
  const [tracks, setTracks] = useState<Track[]>(() => JSON.parse(localStorage.getItem("tracks") || "[]"));
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(() => JSON.parse(localStorage.getItem("practiceRecords") || "[]"));
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>(() => JSON.parse(localStorage.getItem("practiceChecks") || "{}"));
  const [partialCounts, setPartialCounts] = useState<PartialCounts>(() => JSON.parse(localStorage.getItem("partialCounts") || "{}"));

  // 각 데이터가 변경될 때마다 localStorage에 저장
  useEffect(() => { localStorage.setItem("tracks", JSON.stringify(tracks)); }, [tracks]);
  useEffect(() => { localStorage.setItem("practiceRecords", JSON.stringify(practiceRecords)); }, [practiceRecords]);
  useEffect(() => { localStorage.setItem("practiceChecks", JSON.stringify(practiceChecks)); }, [practiceChecks]);
  useEffect(() => { localStorage.setItem("partialCounts", JSON.stringify(partialCounts)); }, [partialCounts]);

  // 데이터 수정 함수들
  const addTrack = (title: string) => {
    if (!title.trim()) return;
    const newTrack: Track = { id: Date.now(), title: title.trim(), addedDate: dayjs().format("YYYY-MM-DD") };
    setTracks(prev => [...prev, newTrack]);
  };

  const removeTrack = (id: number) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const toggleCheck = (date: string, trackId: number) => {
    setPracticeChecks(prev => {
      const dayChecks = prev[date] ? { ...prev[date] } : {};
      dayChecks[trackId] = !dayChecks[trackId];
      return { ...prev, [date]: dayChecks };
    });
  };

  const incPartial = (date: string, trackId: number) => {
    setPartialCounts(prev => {
      const dayCounts = prev[date] || {};
      const newCount = (dayCounts[trackId] || 0) + 1;
      return { ...prev, [date]: { ...dayCounts, [trackId]: newCount } };
    });
  };

  const decPartial = (date: string, trackId: number) => {
    setPartialCounts(prev => {
      const dayCounts = prev[date] || {};
      const newCount = Math.max((dayCounts[trackId] || 0) - 1, 0);
      return { ...prev, [date]: { ...dayCounts, [trackId]: newCount } };
    });
  };

  const markTrackComplete = (trackId: number, date: string) => {
  setTracks(prev =>
    prev.map(t =>
      t.id === trackId ? { ...t, completedDate: date } : t
    )
  );
};

const unmarkTrackComplete = (trackId: number) => {
  setTracks(prev =>
    prev.map(t =>
      t.id === trackId ? { ...t, completedDate: undefined } : t
    )
  );
};

  const value = {
    tracks, setTracks,
    practiceRecords, setPracticeRecords,
    practiceChecks, setPracticeChecks,
    partialCounts, setPartialCounts,
    addTrack, removeTrack,
    toggleCheck, incPartial, decPartial,
    markTrackComplete,
    unmarkTrackComplete,
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