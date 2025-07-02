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

// ✅ savePracticeData 함수 수정: 'data' 파라미터를 올바르게 받고 저장하도록 변경
function savePracticeData(data: any): void {
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

  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [showSongPlusModal, setShowSongPlusModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

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

  const toggleCheck = (trackId: number): void => {
    setPracticeChecks((prev) => {
      const dayChecks = prev[selectedDate] ? { ...prev[selectedDate] } : {};
      const checked = !dayChecks[trackId];
      dayChecks[trackId] = checked;
      const updated = { ...prev, [selectedDate]: dayChecks };

      try {
        let practiceRecords = loadPracticeData();
        if (!Array.isArray(practiceRecords)) {
          practiceRecords = [];
        }
        const track = tracks.find(t => t.id === trackId);
        if (checked && track) {
          practiceRecords = [
            ...practiceRecords,
            { date: selectedDate, track: track.title, repeatCount: 1 }
          ];
        } else if (!checked && track) {
          practiceRecords = practiceRecords.filter(
            (r: any) => !(r.date === selectedDate && r.track === track.title)
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

  const handleEdit = (id: number): void => {
    alert(`수정: ${id}`);
  };

  const handleDelete = (id: number): void => {
    if (confirm("정말 삭제하시겠습니까?")) {
      removeTrack(id);
    }
  };

  const handleTitleClick = (trackId: number): void => {
    setSelectedTrackId(trackId);
    setShowCalendarModal(true);
  };

  const handleCountClick = (trackId: number): void => {
    console.log("전자사과로 이동:", trackId);
    navigate(`/timer?trackId=${trackId}`);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const visibleTracks = tracks.filter(
    (track) =>
      track.addedDate <= selectedDate &&
      (!track.completedDate || selectedDate <= track.completedDate)
  );

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 44,
      margin: "0 auto",
      width: "100%",
      maxWidth: 375,
      background: "white",
      overflow: "hidden",
      minHeight: "100vh",
      paddingBottom: 120
    }}>
      <Header
        title="Today"
        color="#6667AB"
        showBackButton={false}
      />

      <div style={{
        width: "100%",
        maxWidth: 343,
        margin: "15px auto 0 auto"
      }}>
        <WeekCalendar
          selectedDate={selectedDate}
          practiceRecords={loadPracticeData()}
          onDateClick={handleDateClick}
          getKoreanHolidays={getKoreanHolidays}
        />
      </div>

      <div style={{
        width: "100%",
        marginTop: 27,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4
      }}>
        {visibleTracks.map((track) => {
          const isChecked = !!(practiceChecks[selectedDate] && practiceChecks[selectedDate][track.id]);
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
        onClick={() => {
          console.log("송 플러스 버튼 클릭!");
          setShowSongPlusModal(true);
        }}
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
            background: "white",
            padding: 24,
            borderRadius: 8,
            maxWidth: 320,
            width: "calc(100% - 32px)", /* 반응형 */
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

      {showCalendarModal && (
        <TodayCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          trackId={selectedTrackId || undefined}
          onPracticeUpdate={() => {
            const savedChecks = localStorage.getItem("practiceChecks");
            if (savedChecks) {
              setPracticeChecks(JSON.parse(savedChecks));
            }
          }}
        />
      )}
    </main>
  );
}

export default Today;