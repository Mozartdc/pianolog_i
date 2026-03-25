"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";
import WeekCalendar from "../components/WeekCalendar";
import PracticeItem from "../components/PracticeItem";
import TrackDetailModal from "../components/TrackDetailModal";
import TodayCalendarModal from "./TodayCalendarModal";
import SongPlusIcon from "../assets/icons/songplus.svg?react";
import SongNoteIcon from "../assets/icons/song_note.svg?react";
import { usePracticeData } from "../contexts/PracticeDataContext";
import { getKoreanHolidays } from "../utils/statsUtils";

export function Today() {
  const navigate = useNavigate();

  const {
    tracks,
    practiceRecords,
    practiceChecks,
    partialCounts,
    addTrack,
    removeTrack,
    updateTrackTitle,
    toggleCheck,
    incPartial,
    decPartial,
  } = usePracticeData();

  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [showSongPlusModal, setShowSongPlusModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showTrackDetailModal, setShowTrackDetailModal] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const handleEdit = (id: number, newTitle: string) => {
    updateTrackTitle(id, newTitle);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) removeTrack(id);
  };
  const handleTitleClick = (trackId: number) => {
    setSelectedTrackId(trackId);
    setShowTrackDetailModal(true);
  };
  const handleOpenCalendarDetail = (trackId: number) => {
    setSelectedTrackId(trackId);
    setShowTrackDetailModal(false);
    setShowCalendarModal(true);
  };
  const handleCountClick = (trackId: number) => {
    navigate(`/timer?trackId=${trackId}`);
  };
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handlePracticeUpdate = () => {
    // No longer needed since we're using Context
  };

  const visibleTracks = tracks.filter(
  (track) => {
    const addedBeforeOrOn = dayjs(track.addedDate).isSameOrBefore(selectedDate, "day");
    const notCompletedOrCompletedAfter = !track.completedDate || 
                                        dayjs(track.completedDate).isSameOrAfter(selectedDate, "day");
    
    // Also show tracks if there's a practice record on this date
    const hasPracticeOnDate = practiceChecks[selectedDate] && 
                             practiceChecks[selectedDate][track.id];
    
    return (addedBeforeOrOn && notCompletedOrCompletedAfter) || hasPracticeOnDate;
  }
);

return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 auto",
        width: "100%",
        maxWidth: "100%",
        background: "var(--bg-primary)",
        minHeight: "100vh",
        paddingBottom: 120,
        fontFamily: "var(--FONT_FAMILY)",
      }}
    >
      {/* Fixed header only */}
      <div style={{ 
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        zIndex: 1000,
        background: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-light)",
      }}>
        <Header
          title="today"
          color="var(--VERY_PERI)"
          showBackButton={false}
          topMargin={5}
        />
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          width: "100%",
          marginTop: 60,
          paddingTop: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Calendar placed at the top of content area */}
        <div style={{ 
          width: "100%",
          marginBottom: 20,
          background: "var(--bg-primary)"
        }}>
          <WeekCalendar
            selectedDate={selectedDate}
            practiceRecords={practiceRecords}
            onDateClick={handleDateClick}
            getKoreanHolidays={getKoreanHolidays}
            themeColor="var(--VERY_PERI)"
            themePastelColor="var(--PASTEL_VERY_PERI)"
          />
        </div>

        {visibleTracks.map((track) => {
          const isChecked =
            !!(practiceChecks[selectedDate] && practiceChecks[selectedDate][track.id]);
          const partialCount =
            (partialCounts[selectedDate] && partialCounts[selectedDate][track.id]) || 0;
          const daysSince = dayjs().diff(dayjs(track.addedDate), "day") + 1;
          return (
            <PracticeItem
              key={track.id}
              title={track.title}
              subtitle={`오늘로 ${daysSince}일째`}
              checked={isChecked}
              count={partialCount}
              onCheck={() => toggleCheck(selectedDate, track.id)}
              onInc={() => incPartial(selectedDate, track.id)}
              onDec={() => decPartial(selectedDate, track.id)}
              onEdit={(newTitle) => handleEdit(track.id, newTitle)}
              onDelete={() => handleDelete(track.id)}
              onTitleClick={() => handleTitleClick(track.id)}
              onCountClick={() => handleCountClick(track.id)}
            />
          );
        })}
      </div>

      <button
        onClick={() => {setShowSongPlusModal(true);
              // Completely block background scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
        }}
        style={{
          position: "fixed",
          bottom: "113px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "45px",
          height: "45px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          zIndex: 999,
        }}
      >
        <SongPlusIcon style={{ color: "var(--VERY_PERI)" }} width="45" height="45" />
      </button>

      {showSongPlusModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            zIndex: 1000,
            paddingTop: "20vh",
            height: "100vh", // Fixed height
            overflow: "hidden", // Prevent scrolling
          }}
        >
          <div
            style={{
              width: "calc(100% - 32px)",
              maxWidth: 324,
              background: "var(--bg-primary)",
              border: "var(--border-light)",
              borderRadius: "var(--border-radius-small)",
              boxSizing: "border-box",
              padding: 22,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              transform: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <SongNoteIcon style={{ color: "var(--VERY_PERI)" }} width="16" height="16" />
              <span
                style={{
                  fontSize: 15,
                  color: "var(--text-primary)",
                  fontFamily: "var(--FONT_FAMILY)",
                }}
              >
                연습곡 추가
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "0.5px",
                background: "var(--text-secondary)",
                marginBottom: 15,
              }}
            />
            <input
              type="text"
              placeholder="여기에 곡명 입력"
              style={{
                width: "100%",
                height: 36,
                border: "var(--border-light)",
                borderRadius: "var(--border-radius-small)",
                padding: "0 12px",
                fontSize: 14,
                background: "transparent",
                color: "var(--text-primary)",
                fontFamily: "var(--FONT_FAMILY)",
                marginBottom: 15,
                boxSizing: "border-box",
                outline: "none",
              }}
onKeyPress={(e) => {
  if (e.key === "Enter") {
    addTrack((e.target as HTMLInputElement).value);
    (e.target as HTMLInputElement).value = "";
    setShowSongPlusModal(false);
    // After adding track with Enter, scroll to top
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }
}}

            />
            <div
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                fontFamily: "var(--FONT_FAMILY)",
                marginBottom: 33,
              }}
            >
              새로운 연습곡을 추가할 수 있습니다.
            </div>
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
<button
  onClick={() => {
    setShowSongPlusModal(false);
    // Restore styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    
    setTimeout(() => {
      if (window.scrollY > 0) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    }, 150);
  }}
  style={{
    flex: 1,
    height: 43,
    background: "transparent",
    border: "none",
    fontSize: 16,
    color: "var(--DARK_GRAY)",
    cursor: "pointer",
    fontFamily: "var(--FONT_FAMILY)",
  }}
>
  cancel
</button>


<button
  onClick={() => {
    const input = document.querySelector(
      'input[placeholder="여기에 곡명 입력"]'
    ) as HTMLInputElement;
    if (input) {
      addTrack(input.value);
      input.value = "";
      setShowSongPlusModal(false);
      
      // Restore styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      setTimeout(() => {
        if (window.scrollY > 0) {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }
      }, 150);
    }
  }}
  style={{
    flex: 1,
    height: 43,
    background: "transparent", // Remove background
    border: "none",
    borderRadius: "var(--border-radius-small)",
    fontSize: 16,
    color: "var(--VERY_PERI)", // Use original button background color for text
    cursor: "pointer",
    fontFamily: "var(--FONT_FAMILY)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  }}
>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
  곡 추가
</button>


            </div>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <TodayCalendarModal
          isOpen={showCalendarModal}
          onClose={() => {
            setShowCalendarModal(false);
            if (selectedTrackId !== null) {
              setShowTrackDetailModal(true);
            }
          }}
          trackId={selectedTrackId}
          onPracticeUpdate={handlePracticeUpdate}
        />
      )}

      <TrackDetailModal
        isOpen={showTrackDetailModal}
        trackId={selectedTrackId}
        onClose={() => setShowTrackDetailModal(false)}
        onOpenCalendar={handleOpenCalendarDetail}
      />
    </main>
  );
}

export default Today;
