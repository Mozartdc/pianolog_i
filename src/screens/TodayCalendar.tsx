"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";
import WeekCalendar from "../components/WeekCalendar";  // ✅ DatePicker 대신 WeekCalendar 사용
import PracticeItem from "../components/PracticeItem";
import SongPlusIcon from "../assets/icons/songplus.svg";

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

function getToday(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getWeekStart(date: Dayjs): Dayjs {
  const dayOfWeek = date.day() === 0 ? 6 : date.day() - 1;
  return date.subtract(dayOfWeek, "day").startOf("day");
}

function loadPracticeData(): any[] {
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

// ✅ 수정: savePracticeData 함수 문법 오류 및 저장 문제 수정
function savePracticeData( any): void {
  try {
    if (Array.isArray('data')) {
      localStorage.setItem("practiceRecords", JSON.stringify('data'));
    }
  } catch (error) {
    console.error("practiceRecords 저장 실패:", error);
  }
}

export function Today() {
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

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentWeekStart, setCurrentWeekStart] = useState<Dayjs>(getWeekStart(dayjs()));
  const [showSongPlusModal, setShowSongPlusModal] = useState(false);

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    currentWeekStart.add(i, "day")
  );

  useEffect(() => {
    localStorage.setItem("tracks", JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem("practiceChecks", JSON.stringify(practiceChecks));
  }, [practiceChecks]);

  useEffect(() => {
    localStorage.setItem("partialCounts", JSON.stringify(partialCounts));
  }, [partialCounts]);

  const addTrack = (title: string): void => {
    if (!title.trim()) return;
    const today = getToday();
    const newTrack: Track = { id: Date.now(), title: title.trim(), addedDate: today };
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
      const prevRecords = loadPracticeData();
      const updated = prevRecords.filter((r: any) => r.track !== track.title);
      savePracticeData(updated);
    }
  };

  // ✅ 체크 에러 해결: 안전한 데이터 처리
  const toggleCheck = (trackId: number): void => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    
    setPracticeChecks((prev) => {
      const dayChecks = prev[dateStr] ? { ...prev[dateStr] } : {};
      const checked = !dayChecks[trackId];
      dayChecks[trackId] = checked;
      const updated = { ...prev, [dateStr]: dayChecks };

      // ✅ 안전한 practiceRecords 업데이트
      try {
        let practiceRecords = loadPracticeData();
        // ✅ 배열 검증 추가
        if (!Array.isArray(practiceRecords)) {
          practiceRecords = [];
        }
        
        const track = tracks.find(t => t.id === trackId);
        
        if (checked && track) {
          practiceRecords = [
            ...practiceRecords,
            { date: dateStr, track: track.title, repeatCount: 1 }
          ];
        } else if (!checked && track) {
          practiceRecords = practiceRecords.filter(
            (r: any) => !(r.date === dateStr && r.track === track.title)
          );
        }
        savePracticeData(practiceRecords);
      } catch (error) {
        console.error("localStorage 업데이트 실패:", error);
      }

      return updated;
    });
  };

  const incPartial = (trackId: number): void => {
    setPartialCounts((prev) => ({
      ...prev,
      [trackId]: (prev[trackId] || 0) + 1,
    }));
  };

  const decPartial = (trackId: number): void => {
    setPartialCounts((prev) => ({
      ...prev,
      [trackId]: Math.max((prev[trackId] || 0) - 1, 0),
    }));
  };

  const moveToPrevWeek = (): void => {
    setCurrentWeekStart(currentWeekStart.subtract(1, "week"));
  };

  const moveToNextWeek = (): void => {
    setCurrentWeekStart(currentWeekStart.add(1, "week"));
  };

  const handleEdit = (id: number): void => {
    alert(`수정: ${id}`);
  };

  const handleDelete = (id: number): void => {
    if (confirm("정말 삭제하시겠습니까?")) {
      removeTrack(id);
    }
  };

  const selectedDateStr = selectedDate.format("YYYY-MM-DD");
  const visibleTracks = tracks.filter(
    (track) =>
      track.addedDate <= selectedDateStr &&
      (!track.completedDate || selectedDateStr <= track.completedDate)
  );

  const isFuture = selectedDate.isAfter(dayjs(), "day");

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 44,
      margin: "0 auto",
      width: "100%",
      maxWidth: 480,
      background: "white",
      overflow: "hidden",
      minHeight: "100vh"
    }}>
      <Header 
        title="Today"
        showBackButton={false}
      />

      <div style={{ marginTop: 15 }}>
        <DatePicker 
          weekDays={weekDays}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onPrevWeek={moveToPrevWeek}
          onNextWeek={moveToNextWeek}
          practiceRecords={loadPracticeData()}
        />
      </div>

      <div style={{ 
        width: "100%", 
        marginTop: 27,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {visibleTracks.map((track) => {
          const isChecked = !!(practiceChecks[selectedDateStr] && practiceChecks[selectedDateStr][track.id]);
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
            />
          );
        })}
      </div>

      <button
        onClick={() => setShowSongPlusModal(true)}
        style={{
          marginTop: 64,
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "#6667AB",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(102, 103, 171, 0.3)"
        }}
        aria-label="Add new practice song"
      >
        <span style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>+</span>
      </button>

      {showSongPlusModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        }}>
          <div style={{
            background: "white",
            padding: 24,
            borderRadius: 8,
            maxWidth: 320,
            width: "100%",
            margin: "0 16px"
          }}>
            <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>연습 곡 추가</h2>
            <input
              type="text"
              placeholder="곡명을 입력하세요"
              style={{
                width: "100%",
                padding: 8,
                border: "1px solid #ccc",
                borderRadius: 4,
                marginBottom: 16,
                fontSize: 16
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTrack((e.target as HTMLInputElement).value);
                  setShowSongPlusModal(false);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setShowSongPlusModal(false)}
                style={{
                  flex: 1,
                  padding: 8,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  background: "white",
                  cursor: "pointer"
                }}
              >
                취소
              </button>
              <button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="곡명을 입력하세요"]') as HTMLInputElement;
                  if (input) {
                    addTrack(input.value);
                    setShowSongPlusModal(false);
                    input.value = '';
                  }
                }}
                style={{
                  flex: 1,
                  padding: 8,
                  background: "#6667AB",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Today;
