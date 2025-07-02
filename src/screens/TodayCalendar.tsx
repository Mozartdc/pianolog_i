"use client";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";
import WeekCalendar from "../components/WeekCalendar";
import PracticeItem from "../components/PracticeItem";

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

function savePracticeData( any): void {
  try {
    if (Array.isArray('data')) {
      localStorage.setItem("practiceRecords", JSON.stringify(data));
    }
  } catch (error) {
    console.error("practiceRecords 저장 실패:", error);
  }
}

export function TodayCalendar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get("trackId");
  
  const [selectedDate, setSelectedDate] = useState(getToday());
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

  // 특정 곡만 필터링 (trackId가 있는 경우)
  const selectedTrack = trackId ? tracks.find(t => t.id === Number(trackId)) : null;
  const visibleTracks = selectedTrack ? [selectedTrack] : tracks;

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
        const track = tracks.find((t) => t.id === trackId);
        if (checked && track) {
          practiceRecords = [
            ...practiceRecords,
            { date: selectedDate, track: track.title, repeatCount: 1 },
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
    const track = tracks.find(t => t.id === id);
    if (track) {
      const newTitle = prompt("곡명 수정", track.title);
      if (newTitle !== null && newTitle.trim() !== "") {
        setTracks(prev => prev.map(t => 
          t.id === id ? { ...t, title: newTitle.trim() } : t
        ));
      }
    }
  };

  const handleDelete = (id: number): void => {
    if (confirm("정말 삭제하시겠습니까?")) {
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
    }
  };

  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem("tracks", JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem("practiceChecks", JSON.stringify(practiceChecks));
  }, [practiceChecks]);

  useEffect(() => {
    localStorage.setItem("partialCounts", JSON.stringify(partialCounts));
  }, [partialCounts]);

  return (
    <main style={{ maxWidth: 375, margin: "0 auto", paddingBottom: 100 }}>
      <Header 
        title={selectedTrack ? `${selectedTrack.title} 캘린더` : "투데이 캘린더"} 
        topMargin={20}
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      <WeekCalendar
        selectedDate={selectedDate}
        practiceRecords={loadPracticeData()}
        onDateClick={setSelectedDate}
        getKoreanHolidays={(year) => {
          const holidays = [
            `${year}-01-01`,
            `${year}-03-01`,
            `${year}-05-05`,
            `${year}-06-06`,
            `${year}-08-15`,
            `${year}-10-03`,
            `${year}-10-09`,
            `${year}-12-25`,
          ];
          if (year === 2025) {
            holidays.push(
              "2025-01-28",
              "2025-01-29",
              "2025-01-30",
              "2025-05-13",
              "2025-09-06",
              "2025-09-07",
              "2025-09-08"
            );
          }
          return holidays;
        }}
      />

      <div style={{ padding: "0 16px" }}>
        {visibleTracks.map((track) => {
          const isChecked = !!(practiceChecks[selectedDate] && practiceChecks[selectedDate][track.id]);
          const partialCount = partialCounts[track.id] || 0;
          const daysSince = dayjs().diff(dayjs(track.addedDate), "day") + 1;

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
              onCountClick={() => navigate(`/timer?trackId=${track.id}`)}
            />
          );
        })}
      </div>
    </main>
  );
}

export default TodayCalendar;
