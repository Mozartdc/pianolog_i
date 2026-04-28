import SongNoteIcon from "../../assets/icons/song_note.svg?react";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
};

export function TodayAddTrackModal({ open, onClose, onAdd }: Props) {
  if (!open) return null;

  return (
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
        height: "100vh",
        overflow: "hidden",
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
              const value = (e.target as HTMLInputElement).value;
              onAdd(value);
              (e.target as HTMLInputElement).value = "";
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
            onClick={onClose}
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
                onAdd(input.value);
                input.value = "";
              }
            }}
            style={{
              flex: 1,
              height: 43,
              background: "transparent",
              border: "none",
              borderRadius: "var(--border-radius-small)",
              fontSize: 16,
              color: "var(--VERY_PERI)",
              cursor: "pointer",
              fontFamily: "var(--FONT_FAMILY)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              width="18"
              height="18"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
            곡 추가
          </button>
        </div>
      </div>
    </div>
  );
}
