import React from "react";
import dayjs from "dayjs";

interface PracticeRecord {
  date: string;          // "YYYY-MM-DD"
  practiceTime: number;  // minutes
}

interface WeekCalendarProps {
  selectedDate: string;                                 // "YYYY-MM-DD"
  practiceRecords: PracticeRecord[];                    // not used here directly, reserved for badges/heatmap etc.
  onDateClick: (dateStr: string) => void;
  getKoreanHolidays: (year: number) => string[];        // returns array of "YYYY-MM-DD"
  themeColor?: string;                                  // e.g., "var(--TURQUOISE)"
  themePastelColor?: string;                            // e.g., "var(--PASTEL_TURQUOISE)"
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({
  selectedDate,
  practiceRecords,
  onDateClick,
  getKoreanHolidays,
  themeColor = "var(--TURQUOISE)",
  themePastelColor = "var(--PASTEL_TURQUOISE)",
}) => {
  const todayStr = dayjs().format("YYYY-MM-DD");
  const selected = dayjs(selectedDate);
  const dayLabel = selected.format("ddd").toLowerCase();
  const dateLabel = selected.format("YYYY. MM. DD");

  // Keep props as-is for call-site compatibility.
  void practiceRecords;
  void getKoreanHolidays;
  void themeColor;
  void themePastelColor;

  return (
    <div
      role="region"
      aria-label="Date picker"
      style={{
        width: "calc(100% - 32px)",
        minHeight: 56,
        margin: "15px auto 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <button
        type="button"
        onClick={() => onDateClick(todayStr)}
        style={{
          height: 36,
          padding: "0 12px",
        }}
      >
        오늘
      </button>

      <input
        type="date"
        value={selectedDate}
        max={todayStr}
        aria-label="날짜 선택"
        onChange={(e) => {
          const next = e.target.value;
          if (next) onDateClick(next);
        }}
        style={{
          height: 36,
          flex: 1,
          minWidth: 150,
        }}
      />

      <div
        style={{
          minWidth: 120,
          textAlign: "right",
          fontSize: 13,
          opacity: 0.75,
        }}
      >
        {dateLabel} ({dayLabel})
      </div>
    </div>
  );
};

export default WeekCalendar;
