"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";
import WeekCalendar from "../components/WeekCalendar";
import PracticeItem from "../components/PracticeItem";
import TodayCalendarModal from "./TodayCalendarModal";
import SongPlusIcon from "../assets/icons/songplus.svg";
import SongNoteIcon from "../assets/icons/song_note.svg";

type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

type PartialCounts = {
  [trackId: number]: number;
};

interface PracticeRecord {
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  id: string;
  memo?: string;
  track?: string;
}

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

function getToday(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function loadPracticeData(): PracticeRecord[] {
  try {
    const data = localStorage.getItem("practiceRecords");
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("practiceRecords 로딩 실패:", error);
    return [];
  }
}

function savePracticeData(data: PracticeRecord[]): void {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem("practiceRecords", JSON.stringify(data));
    }
  } catch (error) {
    console.error("practiceRecords 저장 실패:", error);
  }
}

export function Today() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("tracks");
    return saved ? JSON.parse(saved) : [];
  });

  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>(() => {
    const saved = localStorage.getItem("practiceChecks");
    return saved ? JSON.parse(saved) : {};
  });

  const [partialCounts, setPartialCounts] = useState<PartialCounts>(() => {
    const saved = localStorage.getItem("partialCounts");
    return saved ? JSON.parse(saved) : {};
  });

  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(loadPracticeData);

  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [showSongPlusModal, setShowSongPlusModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedRecords = localStorage.getItem("practiceRecords");
      if (savedRecords) {
        try {
          const parsed = JSON.parse(savedRecords);
          if (Array.isArray(parsed)) setPracticeRecords(parsed);
        } catch (error) { console.error("practiceRecords 동기화 실패:", error); }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      const currentRecords = localStorage.getItem("practiceRecords");
      if (currentRecords && currentRecords !== JSON.stringify(practiceRecords)) {
        try {
          const parsed = JSON.parse(currentRecords);
          if (Array.isArray(parsed)) setPracticeRecords(parsed);
        } catch (error) { console.error("practiceRecords 폴링 동기화 실패:", error); }
      }
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [practiceRecords]);

  useEffect(() => { localStorage.setItem("tracks", JSON.stringify(tracks)); }, [tracks]);
  useEffect(() => { localStorage.setItem("practiceChecks", JSON.stringify(practiceChecks)); }, [practiceChecks]);
  useEffect(() => { localStorage.setItem("partialCounts", JSON.stringify(partialCounts)); }, [partialCounts]);

  const addTrack = (title: string): void => {
    if (!title.trim()) return;
    const newTrack: Track = { id: Date.now(), title: title.trim(), addedDate: getToday() };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (id: number): void => {
    const track = tracks.find(t => t.id === id);
    setTracks(tracks.filter((t) => t.id !== id));
    setPartialCounts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setPracticeChecks((prev) => {
      const copy: PracticeChecks = {};
      for (const date in prev) {
        copy[date] = { ...prev[date] };
        delete copy[date][id];
      }
      return copy;
    });
    if (track) {
      const updated = practiceRecords.filter((r) => r.track !== track.title);
      setPracticeRecords(updated);
      savePracticeData(updated);
    }
  };

  const toggleCheck = (trackId: number): void => {
    setPracticeChecks((prev) => {
      const dayChecks = prev[selectedDate] ? { ...prev[selectedDate] } : {};
      dayChecks[trackId] = !dayChecks[trackId];
      return { ...prev, [selectedDate]: dayChecks };
    });
  };

  const incPartial = (trackId: number): void => { setPartialCounts((prev) => ({ ...prev, [trackId]: (prev[trackId] || 0) + 1 })); };
  const decPartial = (trackId: number): void => { setPartialCounts((prev) => ({ ...prev, [trackId]: Math.max((prev[trackId] || 0) - 1, 0) })); };
  const handleEdit = (id: number): void => { alert(`수정: ${id}`); };
  const handleDelete = (id: number): void => { if (confirm("정말 삭제하시겠습니까?")) removeTrack(id); };
  const handleTitleClick = (trackId: number): void => { setSelectedTrackId(trackId); setShowCalendarModal(true); };
  const handleCountClick = (trackId: number): void => { navigate(`/timer?trackId=${trackId}`); };
  const handleDateClick = (dateStr: string) => { setSelectedDate(dateStr); };
  const handlePracticeUpdate = () => {
    const savedChecks = localStorage.getItem("practiceChecks");
    if (savedChecks) setPracticeChecks(JSON.parse(savedChecks));
    const savedRecords = localStorage.getItem("practiceRecords");
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          setPracticeRecords(parsed);
          const newChecks: PracticeChecks = { ...practiceChecks };
          parsed.forEach((record: PracticeRecord) => {
            if (record.track) {
              const track = tracks.find(t => t.title === record.track);
              if (track) {
                if (!newChecks[record.date]) newChecks[record.date] = {};
                newChecks[record.date][track.id] = true;
              }
            }
          });
          setPracticeChecks(newChecks);
          localStorage.setItem("practiceChecks", JSON.stringify(newChecks));
        }
      } catch (error) { console.error("practiceRecords 동기화 실패:", error); }
    }
  };

  const visibleTracks = tracks.filter(
    (track) => track.addedDate <= selectedDate && (!track.completedDate || selectedDate <= track.completedDate)
  );

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 44,
      margin: "0 auto",
      width: "100%",
      maxWidth: "100%",
      background: "var(--bg-primary)",
      overflow: "hidden",
      minHeight: "100vh",
      paddingBottom: 120,
      fontFamily: "var(--FONT_FAMILY)"
    }}>
      <Header title="today" color="var(--VERY_PERI)" showBackButton={false} />
      <div style={{ width: "100%", maxWidth: "100%", margin: "15px auto 0 auto" }}>
        <WeekCalendar
          selectedDate={selectedDate}
          practiceRecords={practiceRecords}
          onDateClick={handleDateClick}
          getKoreanHolidays={getKoreanHolidays}
        />
      </div>
      <div style={{ width: "100%", marginTop: 27, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {visibleTracks.map((track) => {
          const isCheckedFromRecords = practiceRecords.some(r => r.date === selectedDate && r.track === track.title);
          const isCheckedFromChecks = !!(practiceChecks[selectedDate] && practiceChecks[selectedDate][track.id]);
          const isChecked = isCheckedFromRecords || isCheckedFromChecks;
          const partialCount = partialCounts[track.id] || 0;
          const daysSince = dayjs().diff(dayjs(track.addedDate), 'day') + 1;
          return (
            <PracticeItem
              key={track.id}
              title={track.title}
              subtitle={`오늘로 ${daysSince}일째`}
              checked={isChecked}
              count={partialCount}
              onCheck={() => toggleCheck(track.id)}
              onInc={() => incPartial(track.id)}
              onDec={() => decPartial(track.id)}
              onEdit={() => handleEdit(track.id)}
              onDelete={() => handleDelete(track.id)}
              onTitleClick={() => handleTitleClick(track.id)}
              onCountClick={() => handleCountClick(track.id)}
            />
          );
        })}
      </div>
      <button
        onClick={() => setShowSongPlusModal(true)}
        style={{
          position: "fixed",
          bottom: "103px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "45px",
          height: "45px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          zIndex: 999
        }}
      >
        <img src={SongPlusIcon} alt="add song" width="45" height="45" />
      </button>

      {showSongPlusModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            width: "calc(100% - 32px)",
            maxWidth: 324,
            background: "var(--bg-primary)",
            border: "var(--border-light)",
            borderRadius: "var(--border-radius-small)",
            boxSizing: "border-box",
            padding: 22,
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <img src={SongNoteIcon} alt="song note" width="16" height="16" />
              <span style={{ fontSize: 15, color: "var(--text-primary)", fontFamily: "var(--FONT_FAMILY)" }}>
                연습곡 추가
              </span>
            </div>
            <div style={{ width: "100%", height: "0.5px", background: "var(--text-secondary)", marginBottom: 15 }} />
            <input
              type="text"
              placeholder="여기에 곡명 입력"
              style={{
                width: "100%",
                height: 36,
                border: "var(--border-light)",
                borderRadius: "var(--border-radius-small)",
                padding: "0 12px",
                fontSize: 16,
                background: "var(--bg-secondary)", // ✅ 수정: 배경색 추가
                color: "var(--text-primary)",
                fontFamily: "var(--FONT_FAMILY)",
                marginBottom: 15,
                boxSizing: "border-box"
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTrack((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                  setShowSongPlusModal(false);
                }
              }}
            />
            <div style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "var(--FONT_FAMILY)", marginBottom: 33 }}>
              새로운 연습곡을 추가할 수 있습니다.
            </div>
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <button
                onClick={() => setShowSongPlusModal(false)}
                style={{
                  flex: 1, height: 43, background: "transparent", border: "none",
                  fontSize: 16, color: "var(--VERY_PERI)", cursor: "pointer",
                  fontFamily: "var(--FONT_FAMILY)"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="여기에 곡명 입력"]') as HTMLInputElement;
                  if (input) {
                    addTrack(input.value);
                    input.value = '';
                    setShowSongPlusModal(false);
                  }
                }}
                style={{
                  flex: 1, height: 43, background: "var(--VERY_PERI)", border: "none",
                  borderRadius: "var(--border-radius-small)", fontSize: 16,
                  color: "var(--button-primary-text)", // ✅ 수정: var(--WHITE) -> var(--button-primary-text)
                  cursor: "pointer", fontFamily: "var(--FONT_FAMILY)"
                }}
              >
                추가완료
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <TodayCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          trackId={selectedTrackId}
          onPracticeUpdate={handlePracticeUpdate}
        />
      )}
    </main>
  );
}

export default Today;