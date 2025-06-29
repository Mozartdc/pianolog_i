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
  practiceRecords = [] // ✅ 기본값 빈 배열
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
      width: "100%",
      maxWidth: 344,
      margin: "0 auto",
      height: 56,
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "0 16px"
    }}>
      {weekDays.map((date, index) => {
        const dateStr = date.format("YYYY-MM-DD");
        
        // ✅ 안전한 practiceRecords 검사
        let practiced = false;
        try {
          practiced = Array.isArray(practiceRecords) 
            ? practiceRecords.some((r: any) => r && typeof r === 'object' && r.date === dateStr)
            : false;
        } catch (error) {
          console.error("practiced 검사 실패:", error);
          practiced = false;
        }
          
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
