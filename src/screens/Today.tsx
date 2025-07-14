"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";
import WeekCalendar from "../components/WeekCalendar";
import PracticeItem from "../components/PracticeItem";
import TodayCalendarModal from "./TodayCalendarModal";
import SongPlusIcon from "../assets/icons/songplus.svg?react";
import SongNoteIcon from "../assets/icons/song_note.svg?react";
import { usePracticeData, Track } from "../contexts/PracticeDataContext";

const getKoreanHolidays = (year: number): string[] => {
  const holidays = [
    `${year}-01-01`, `${year}-03-01`, `${year}-05-05`, `${year}-06-06`,
    `${year}-08-15`, `${year}-10-03`, `${year}-10-09`, `${year}-12-25`,
  ];
  if (year === 2025) {
    holidays.push('2025-01-28', '2025-01-29', '2025-01-30', '2025-05-13', '2025-09-06', '2025-09-07', '2025-09-08');
  }
  return holidays;
};

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
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const handleEdit = (id: number, newTitle: string) => {
    updateTrackTitle(id, newTitle);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) removeTrack(id);
  };
  const handleTitleClick = (trackId: number) => {
    setSelectedTrackId(trackId);
    setShowCalendarModal(true);
  };
  const handleCountClick = (trackId: number) => {
    navigate(`/timer?trackId=${trackId}`);
  };
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handlePracticeUpdate = () => {
    // Context 사용으로 더 이상 필요 없음
  };

  const visibleTracks = tracks.filter(
    (track) =>
      dayjs(track.addedDate).isSameOrBefore(selectedDate, "day") &&
      (!track.completedDate || dayjs(track.completedDate).isSameOrAfter(selectedDate, "day"))
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
      {/* 헤더만 고정 */}
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

      {/* 스크롤되는 콘텐츠 영역 */}
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
        {/* 캘린더를 콘텐츠 영역 맨 위에 배치 */}
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
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
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
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <SongNoteIcon style={{ color: "var(--TURQUOISE)" }} width="16" height="16" />
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
                fontSize: 16,
                background: "var(--bg-secondary)",
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
                onClick={() => setShowSongPlusModal(false)}
                style={{
                  flex: 1,
                  height: 43,
                  background: "transparent",
                  border: "none",
                  fontSize: 16,
                  color: "var(--VERY_PERI)",
                  cursor: "pointer",
                  fontFamily: "var(--FONT_FAMILY)",
                }}
              >
                Cancel
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
                  }
                }}
                style={{
                  flex: 1,
                  height: 43,
                  background: "var(--VERY_PERI)",
                  border: "none",
                  borderRadius: "var(--border-radius-small)",
                  fontSize: 16,
                  color: "var(--button-primary-text)",
                  cursor: "pointer",
                  fontFamily: "var(--FONT_FAMILY)",
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
