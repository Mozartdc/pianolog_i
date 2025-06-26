"use client";
import { Dayjs } from "dayjs";

interface DatePickerProps {
  weekDays: Dayjs[];
  selectedDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  practiceRecords?: any[];
}

function DatePicker({
  weekDays,
  selectedDate,
  onDateSelect,
  practiceRecords = []
}: DatePickerProps) {
  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedDateStr = selectedDate.format("YYYY-MM-DD");

  return (
    <div style={{
      position: "absolute",
      left: 16,
      top: 100,
      width: 344,
      height: 56,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      {weekDays.map((date, index) => {
        const dateStr = date.format("YYYY-MM-DD");
        const practiced = practiceRecords.some((r: any) => r.date === dateStr);
        const isSelected = dateStr === selectedDateStr;
        const isToday = dateStr === todayStr;
        const isSunday = date.day() === 0;
        const isSaturday = date.day() === 6;
        
        return (
          <div
            key={index}
            onClick={() => onDateSelect(date)}
            style={{
              width: 43,
              height: 56,
              background: isToday ? "#c7e6df" : isSelected ? "#f0f0f0" : "#ffffff",
              border: practiced ? "0.5px solid #45b5aa" : "0.5px solid #9e9c98",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 8,
              paddingRight: 8,
              cursor: "pointer"
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
              color: isSunday ? "#bb2649" : isSaturday ? "#0066cc" : "#9e9c98",
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
}

export default DatePicker;
