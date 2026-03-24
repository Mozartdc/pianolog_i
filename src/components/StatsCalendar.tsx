// src/components/StatsCalendar.tsx
import React from "react";
import dayjs from "dayjs";
import CalLeftIcon from "../assets/icons/cal_left.svg?react";
import CalRightIcon from "../assets/icons/cal_right.svg?react";
import CalDownIcon from "../assets/icons/cal_down.svg?react";
import DoIcon from "../assets/icons/do.svg?react";
import { PracticeRecord, PracticeChecks, Track } from "../contexts/PracticeDataContext";
import { generateCalendarDays } from "../utils/statsUtils";

interface StatsCalendarProps {
  currentMonth: dayjs.Dayjs;
  setCurrentMonth: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  selectedDate: string;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  showMonthYearPicker: boolean;
  setShowMonthYearPicker: React.Dispatch<React.SetStateAction<boolean>>;
  practiceRecords: PracticeRecord[];
  practiceChecks: PracticeChecks;
  tracks: Track[];
  onYearChange: (year: number) => void;
  koreanHolidays: string[];
  commonFontStyle: React.CSSProperties;
}

export const StatsCalendar: React.FC<StatsCalendarProps> = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  showMonthYearPicker,
  setShowMonthYearPicker,
  practiceRecords,
  practiceChecks,
  tracks,
  onYearChange,
  koreanHolidays,
  commonFontStyle
}) => {
  const calendarDays = generateCalendarDays(currentMonth);
  const weeks: dayjs.Dayjs[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }
  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div style={{
      width: "100%", margin: "25px auto 0 auto", padding: "16px 0", 
      border: "1px solid rgba(0,0,0,0.12)", borderRadius: 5, background: "var(--bg-primary)", 
      boxSizing: "border-box"
    }}>
      {/* Calendar header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, padding: "0 16px",
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
            style={{ 
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer", 
              color: "var(--text-secondary)", background: "none", border: "none" 
            }}
          >
            <span style={{ fontSize: 16, ...commonFontStyle }}>
              {currentMonth.format("YYYY년 MM월")}
            </span>
            <CalDownIcon
              width="9" height="6"
              style={{
                transform: showMonthYearPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>

          {showMonthYearPicker && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, width: '120px',
              background: 'var(--PASTEL_MIMOSA)', border: 'var(--border-light)',
              borderRadius: '8px', boxShadow: 'var(--shadow-light)', zIndex: 100,
              marginTop: '8px', maxHeight: '200px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column'
            }}>
              {Array.from({ length: 30 }, (_, i) => {
                const year = dayjs().year() - 10 + i;
                return (
                  <div
                    key={year}
                    onClick={() => onYearChange(year)}
                    style={{
                      padding: "8px 12px", cursor: "pointer", fontSize: 14,
                      textAlign: 'center', color: 'var(--text-primary)', flexShrink: 0
                    }}
                  >
                    {year}년
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setCurrentMonth(currentMonth.subtract(1, 'month'));
              setShowMonthYearPicker(false);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
          >
            <CalLeftIcon width="14" height="8" />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(currentMonth.add(1, 'month'));
              setShowMonthYearPicker(false);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
          >
            <CalRightIcon width="14" height="8" />
          </button>
        </div>
      </div>
      
      <div style={{ 
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", 
        gap: "min(6px, 1.5vw)", marginBottom: 8, padding: "0 16px" 
      }}>
        {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
          <div key={index} style={{ 
            fontSize: 16, 
            color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)", 
            textAlign: "center", ...commonFontStyle 
          }}>
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} style={{ 
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)", 
          gap: "min(6px, 1.5vw)", marginBottom: 8, padding: "0 16px" 
        }}>
          {week.map((date, dayIndex) => {
            const dateStr = date.format("YYYY-MM-DD");
            const isCurrentMonth = date.month() === currentMonth.month();
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const isHoliday = koreanHolidays.includes(dateStr);
            const isFuture = date.isAfter(dayjs(), 'day');
            const practiced = practiceRecords.some(r => r.date === dateStr && r.practiceTime > 0) ||
              (practiceChecks[dateStr] && Object.values(practiceChecks[dateStr]).some(Boolean));
            return (
              <div key={dayIndex}
                onClick={() => { if(isCurrentMonth && !isFuture) { setSelectedDate(dateStr); } }}
                style={{
                  aspectRatio: "1", minWidth: 0, display: "flex", alignItems: "center", 
                  justifyContent: "center", position: "relative",
                  cursor: isCurrentMonth && !isFuture ? "pointer" : "pointer",
                  opacity: isCurrentMonth ? 1 : 0.3, boxSizing: "border-box"
                }}
              >
                {practiced && <DoIcon style={{ 
                  color: "var(--PASTEL_MIMOSA)", width: "100%", height: "100%", 
                  maxWidth: 32, maxHeight: 32, position: "absolute", zIndex: 1, opacity: 0.8 
                }} />}
                <span style={{
                  fontSize: "clamp(12px, 4vw, 16px)",
                  color: (dayIndex === 6 || isHoliday ? "var(--VIVA_MAGENTA)" : "var(--text-primary)"),
                  fontWeight: isToday ? 700 : 200, zIndex: 2, position: "relative",
                  border: isSelected ? "1px solid var(--BLACK)" : "none",
                  background: "transparent", borderRadius: "50%",
                  width: isToday || isSelected ? "100%" : "auto",
                  height: isToday || isSelected ? "100%" : "auto",
                  maxWidth: 32, maxHeight: 32, display: "flex", 
                  alignItems: "center", justifyContent: "center", ...commonFontStyle
                }}>
                  {date.date()}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      
    </div>
  );
};
