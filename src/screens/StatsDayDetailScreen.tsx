// /src/screens/StatsDayDetailScreen.tsx

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";

// ✅ 아이콘 import 변경
import CloseIcon from "../assets/icons/close.svg?react";
import CheckIcon from "../assets/icons/check.svg?react";
import UncheckIcon from "../assets/icons/uncheck.svg?react";

// 타입 정의
type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

type PracticeRecord = {
  date: string;
  practiceTime: number;
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

// ✅ Modal props 타입 정의
interface StatsDayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // 날짜를 prop으로 받음
}

// ✅ 컴포넌트 이름을 Modal로 변경하고 props를 받도록 수정
const StatsDayDetailModal: React.FC<StatsDayDetailModalProps> = ({
  isOpen,
  onClose,
  date,
}) => {
  // --- 상태 및 데이터 로직 ---
  const [trackList, setTrackList] = useState<Track[]>([]);
  const [dayRecords, setDayRecords] = useState<PracticeRecord[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 localStorage에서 데이터를 불러옴
      const allTracks: Track[] = JSON.parse(localStorage.getItem("tracks") || "[]");
      const allRecords: PracticeRecord[] = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
      const allChecks: PracticeChecks = JSON.parse(localStorage.getItem("practiceChecks") || "{}");
      
      setTrackList(allTracks);
      setDayRecords(allRecords.filter((r) => r.date === date));
      setPracticeChecks(allChecks);
    }
  }, [isOpen, date]);

  // ✅ 선택된 날짜에 연습 가능한 모든 곡 목록
  const availableTracks = trackList.filter(
    (track) =>
      dayjs(track.addedDate).isSame(date, "day") ||
      (dayjs(track.addedDate).isBefore(date, "day") &&
        (!track.completedDate || dayjs(track.completedDate).isSame(date, "day") || dayjs(track.completedDate).isAfter(date, "day")))
  );

  // 총 연습 시간 계산
  const totalMinutes = dayRecords.reduce((sum, r) => sum + (r.practiceTime || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeDisplay = totalMinutes > 0 ? `${hours > 0 ? `${hours}시간 ` : ""}${minutes}분` : "기록 없음";

  if (!isOpen) return null;

  // --- 렌더링 ---
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "calc(100% - 32px)", maxWidth: 324, background: "var(--bg-primary)",
          borderRadius: "var(--border-radius-small)", border: "var(--border-light)",
          padding: "16px", display: "flex", flexDirection: "column",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: "bold", color: "var(--text-primary)" }}>
            {dayjs(date).format("YYYY.MM.DD (ddd)")}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <CloseIcon style={{ color: "var(--text-secondary)" }} width="20" height="20" />
          </button>
        </div>

        {/* 총 연습 시간 */}
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>
          총 연습 시간: <span style={{ color: "var(--MIMOSA)", fontWeight: "bold" }}>{timeDisplay}</span>
        </div>

        {/* 곡 목록 */}
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12, overflowY: 'auto' }}>
          <span style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8, display: 'block' }}>연습한 곡</span>
          {availableTracks.length > 0 ? (
            availableTracks.map((track) => {
              const isChecked = !!(practiceChecks[date] && practiceChecks[date][track.id]);
              return (
                <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: isChecked ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {isChecked ? <CheckIcon style={{color: "var(--MIMOSA)"}} width="14" height="14" /> : <UncheckIcon width="14" height="14" />}
                  <span>{track.title}</span>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>연습 기록 없음</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsDayDetailModal;