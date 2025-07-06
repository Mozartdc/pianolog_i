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

// PracticeRecord 타입 추가
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

// savePracticeData 함수 수정: 'data' 파라미터를 올바르게 받아서 저장하도록 변경
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

  // practiceRecords 상태 추가
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(() => {
    return loadPracticeData();
  });

  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [showSongPlusModal, setShowSongPlusModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  // 디버깅을 위한 콘솔 로그
  useEffect(() => {
    console.log("현재 practiceRecords:", practiceRecords);
    console.log("현재 practiceChecks:", practiceChecks);
    console.log("선택된 날짜:", selectedDate);
  }, [practiceRecords, practiceChecks, selectedDate]);

  // practiceRecords localStorage 동기화
  useEffect(() => {
    // localStorage 변경 감지 (다른 탭/컴포넌트에서 변경 시)
    const handleStorageChange = () => {
      const savedRecords = localStorage.getItem("practiceRecords");
      if (savedRecords) {
        try {
          const parsed = JSON.parse(savedRecords);
          if (Array.isArray(parsed)) {
            setPracticeRecords(parsed);
          }
        } catch (error) {
          console.error("practiceRecords 동기화 실패:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 같은 탭 내에서 변경 감지 (폴링 방식)
    const interval = setInterval(() => {
      const currentRecords = localStorage.getItem("practiceRecords");
      if (currentRecords && currentRecords !== JSON.stringify(practiceRecords)) {
        try {
          const parsed = JSON.parse(currentRecords);
          if (Array.isArray(parsed)) {
            setPracticeRecords(parsed);
            console.log("practiceRecords 동기화됨:", parsed.length, "개 기록");
          }
        } catch (error) {
          console.error("practiceRecords 폴링 동기화 실패:", error);
        }
      }
    }, 1000); // 1초마다 체크

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [practiceRecords]);

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
      // practiceRecords 상태도 업데이트
      const updated = practiceRecords.filter((r: PracticeRecord) => r.track !== track.title);
      setPracticeRecords(updated);
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
        const track = tracks.find(t => t.id === trackId);
        if (checked && track) {
          // 새로운 연습 기록 추가
          const newRecord: PracticeRecord = {
            id: `${selectedDate}-${trackId}-${Date.now()}`,
            date: selectedDate,
            practiceTime: 0,
            track: track.title,
            startTime: new Date(selectedDate + "T09:00:00").getTime(),
            endTime: new Date(selectedDate + "T09:00:00").getTime(),
            memo: `${track.title} 연습 완료`
          };
          const updatedRecords = [...practiceRecords, newRecord];
          setPracticeRecords(updatedRecords);
          savePracticeData(updatedRecords);
        } else if (!checked && track) {
          // 연습 기록 제거
          const updatedRecords = practiceRecords.filter(
            (r: PracticeRecord) => !(r.date === selectedDate && r.track === track.title)
          );
          setPracticeRecords(updatedRecords);
          savePracticeData(updatedRecords);
        }
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

  // onPracticeUpdate 콜백 개선
  const handlePracticeUpdate = () => {
    // practiceChecks 동기화
    const savedChecks = localStorage.getItem("practiceChecks");
    if (savedChecks) {
      setPracticeChecks(JSON.parse(savedChecks));
    }
    
    // practiceRecords 동기화
    const savedRecords = localStorage.getItem("practiceRecords");
    if (savedRecords) {
      try {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          setPracticeRecords(parsed);
          console.log("TodayCalendarModal에서 업데이트된 practiceRecords 동기화됨:", parsed.length, "개 기록");
          
          // practiceRecords 기반으로 practiceChecks도 업데이트
          const newChecks: PracticeChecks = { ...practiceChecks };
          parsed.forEach((record: PracticeRecord) => {
            if (record.track) {
              const track = tracks.find(t => t.title === record.track);
              if (track) {
                if (!newChecks[record.date]) {
                  newChecks[record.date] = {};
                }
                newChecks[record.date][track.id] = true;
              }
            }
          });
          setPracticeChecks(newChecks);
          localStorage.setItem("practiceChecks", JSON.stringify(newChecks));
        }
      } catch (error) {
        console.error("practiceRecords 동기화 실패:", error);
      }
    }
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
      maxWidth: "100%",
      background: "var(--bg-primary)", // CSS 변수 적용
      overflow: "hidden",
      minHeight: "100vh",
      paddingBottom: 120,
      fontFamily: "var(--FONT_FAMILY)" // CSS 변수 적용
    }}>
      <Header
        title="today"
        color="var(--VERY_PERI)" // CSS 변수 적용
        showBackButton={false}
      />

      <div style={{
        width: "100%",
        maxWidth: "100%",
        margin: "15px auto 0 auto"
      }}>
        <WeekCalendar
          selectedDate={selectedDate}
          practiceRecords={practiceRecords} // 상태로 관리되는 practiceRecords 사용
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
          // practiceRecords에서 체크 상태 계산
          const isCheckedFromRecords = practiceRecords.some(
            (record) => record.date === selectedDate && record.track === track.title
          );
          
          // practiceChecks와 practiceRecords 둘 다 확인
          const isCheckedFromChecks = !!(practiceChecks[selectedDate] && practiceChecks[selectedDate][track.id]);
          
          // 둘 중 하나라도 true면 체크된 것으로 표시
          const isChecked = isCheckedFromRecords || isCheckedFromChecks;
          
          const partialCount = partialCounts[track.id] || 0;
          const daysSince = dayjs().diff(dayjs(track.addedDate), 'day') + 1;

          return (
            <PracticeItem
              key={track.id}
              title={track.title}
              subtitle={`오늘로 ${daysSince}일째`}
              checked={isChecked} // 개선된 체크 상태
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
        <span style={{
          fontSize: 15,
          color: "var(--text-primary)",
          fontFamily: "var(--FONT_FAMILY)"
        }}>
          연습곡 추가
        </span>
      </div>

      <div style={{
        width: "100%",
        height: "0.5px",
        background: "var(--text-secondary)",
        marginBottom: 15
      }} />

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
          color: "var(--text-primary)",
          fontFamily: "var(--FONT_FAMILY)",
          marginBottom: 15,
          boxSizing: "border-box"
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            addTrack((e.target as HTMLInputElement).value);
            setShowSongPlusModal(false);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />

      <div style={{
        fontSize: 14,
        color: "var(--text-secondary)",
        fontFamily: "var(--FONT_FAMILY)",
        marginBottom: 33
      }}>
        새로운 연습곡을 추가할 수 있습니다.
      </div>

      <div style={{
        display: "flex",
        gap: 8,
        width: "100%"
      }}>
        <button
          onClick={() => setShowSongPlusModal(false)}
          style={{
            flex: 1,
            height: 43,
            background: "transparent",
            border: "none",
            fontSize: 16,
            color: "var(--VERY_PERI)",
            cursor: "pointer",
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
              setShowSongPlusModal(false);
              input.value = '';
            }
          }}
          style={{
            flex: 1,
            height: 43,
            background: "var(--VERY_PERI)",
            border: "none",
            borderRadius: "var(--border-radius-small)",
            fontSize: 16,
            color: "var(--WHITE)",
            cursor: "pointer",
            fontFamily: "var(--FONT_FAMILY)"
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
          trackId={selectedTrackId || undefined}
          onPracticeUpdate={handlePracticeUpdate} // 개선된 콜백
        />
      )}
    </main>
  );
}

export default Today;