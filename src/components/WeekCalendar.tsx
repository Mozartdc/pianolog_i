import React from "react";
import dayjs from "dayjs";

interface PracticeRecord {
  date: string;
  practiceTime: number;
}

interface WeekCalendarProps {
  selectedDate: string;
  practiceRecords: PracticeRecord[];
  onDateClick: (dateStr: string) => void;
  getKoreanHolidays: (year: number) => string[];
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({
  selectedDate,
  practiceRecords,
  onDateClick,
  getKoreanHolidays
}) => {
  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const today = dayjs();
  const todayStr = today.format("YYYY-MM-DD");
  const displayDate = dayjs(selectedDate);
  const weekStart = displayDate.subtract(displayDate.day() === 0 ? 6 : displayDate.day() - 1, "day");
  const weekDays = Array.from({ length: 7 }).map((_, i) => weekStart.add(i, "day"));

  return (
    <div style={{
      width: "100%",
      maxWidth: 343,
      height: 56,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      margin: "15px auto 0 auto",
      paddingLeft: 0,
      paddingRight: 0
    }}>
      {weekDays.map((date, index) => {
        const dateStr = date.format("YYYY-MM-DD");
        const practiced = Array.isArray(practiceRecords) 
          ? practiceRecords.some((r: PracticeRecord) => r && r.date === dateStr)
          : false;
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === todayStr;
        const isSunday = date.day() === 0;
        const isSaturday = date.day() === 6;
        const koreanHolidays = getKoreanHolidays(date.year());
        const isHoliday = koreanHolidays.includes(dateStr);
        
        return (
          <div
            key={index}
            onClick={() => onDateClick(dateStr)}
            style={{
              flex: 1,
              height: 56,
              background: isToday ? "#c7e6df" : isSelected ? "#f0f0f0" : "#ffffff",
              border: practiced ? "0.5px solid #45b5aa" : "0.5px solid #9e9c98",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginRight: index < 6 ? 8 : 0
            }}
          >
            <span style={{
              fontSize: 20,
              color: "#2d2d2a",
              lineHeight: "24px",
              textAlign: "center",
              ...commonFontStyle
            }}>
              {date.format("D")}
            </span>
            <span style={{
              fontSize: 10,
              color: isSunday || isHoliday ? "#bb2649" : isSaturday ? "#0066cc" : "#9e9c98",
              lineHeight: "16px",
              textAlign: "center",
              ...commonFontStyle
            }}>
              {date.format("ddd").toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default WeekCalendar;
