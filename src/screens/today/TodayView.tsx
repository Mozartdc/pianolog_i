import Header from "../../components/Header";
import WeekCalendar from "../../components/WeekCalendar";
import PracticeItem from "../../components/PracticeItem";
import TrackDetailModal from "../../components/TrackDetailModal";
import TodayCalendarModal from "../TodayCalendarModal";
import SongPlusIcon from "../../assets/icons/songplus.svg?react";
import { getKoreanHolidays } from "../../utils/statsUtils";
import type { useTodayState } from "./useTodayState";
import { TodayAddTrackModal } from "./TodayAddTrackModal";

type TodayState = ReturnType<typeof useTodayState>;

type Props = {
  state: TodayState;
};

export function TodayView({ state }: Props) {
  const closeAddTrackModal = () => {
    state.setShowSongPlusModal(false);
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.height = "";

    setTimeout(() => {
      if (window.scrollY > 0) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      }
    }, 150);
  };

  const addTrackAndClose = (title: string) => {
    state.addTrack(title);
    closeAddTrackModal();
  };

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
        minHeight: "100dvh",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
        boxSizing: "border-box",
        fontFamily: "var(--FONT_FAMILY)",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          zIndex: 1000,
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <Header title="today" color="var(--VERY_PERI)" showBackButton={false} topMargin={5} />
      </div>

      <div
        style={{
          width: "100%",
          marginTop: "calc(60px + env(safe-area-inset-top))",
          paddingTop: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div style={{ width: "100%", marginBottom: 20, background: "var(--bg-primary)" }}>
          <WeekCalendar
            selectedDate={state.selectedDate}
            practiceRecords={state.practiceRecords}
            onDateClick={state.handleDateClick}
            getKoreanHolidays={getKoreanHolidays}
            themeColor="var(--VERY_PERI)"
            themePastelColor="var(--PASTEL_VERY_PERI)"
          />
        </div>

        {state.todayTrackRows.map((track) => {
          return (
            <PracticeItem
              key={track.id}
              title={track.title}
              subtitle={track.subtitle}
              checked={track.checked}
              count={track.count}
              onCheck={() => state.toggleCheck(state.selectedDate, track.id)}
              onInc={() => state.incPartial(state.selectedDate, track.id)}
              onDec={() => state.decPartial(state.selectedDate, track.id)}
              onEdit={(newTitle) => state.handleEdit(track.id, newTitle)}
              onDelete={() => state.handleDelete(track.id)}
              onTitleClick={() => state.handleTitleClick(track.id)}
              onCountClick={() => state.handleCountClick(track.id)}
            />
          );
        })}
      </div>

      <button
        onClick={() => {
          state.setShowSongPlusModal(true);
          document.body.style.overflow = "hidden";
          document.body.style.position = "fixed";
          document.body.style.width = "100%";
          document.body.style.height = "100%";
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

      <TodayAddTrackModal
        open={state.showSongPlusModal}
        onClose={closeAddTrackModal}
        onAdd={addTrackAndClose}
      />

      {state.showCalendarModal && (
        <TodayCalendarModal
          isOpen={state.showCalendarModal}
          onClose={() => {
            state.setShowCalendarModal(false);
            if (state.selectedTrackId !== null) {
              state.setShowTrackDetailModal(true);
            }
          }}
          trackId={state.selectedTrackId}
          onPracticeUpdate={state.handlePracticeUpdate}
        />
      )}

      <TrackDetailModal
        isOpen={state.showTrackDetailModal}
        trackId={state.selectedTrackId}
        onClose={() => state.setShowTrackDetailModal(false)}
        onOpenCalendar={state.handleOpenCalendarDetail}
      />
    </main>
  );
}
