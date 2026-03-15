"use client";
import React, { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";
import ConfettiAnimation from "../components/ConfettiAnimation";
import { usePracticeData } from "../contexts/PracticeDataContext";

// Icon imports
import SongNoteIcon from "../assets/icons/song_note.svg?react";
import CompleteIcon from "../assets/icons/complete.svg?react";
import DonotIcon from "../assets/icons/donot.svg?react";
import CalDownIcon from "../assets/icons/cal_down.svg?react";
import CalLeftIcon from "../assets/icons/cal_left.svg?react";
import CalRightIcon from "../assets/icons/cal_right.svg?react";
import CheckIcon from "../assets/icons/check.svg?react";
import UncheckIcon from "../assets/icons/uncheck.svg?react";
import StarIcon from "../assets/icons/star.svg?react";
import CloseIcon from "../assets/icons/close.svg?react";
import ScoreIcon from "../assets/icons/score.svg?react";

function toDateStr(date: Dayjs) {
  return date.format("YYYY-MM-DD");
}

interface TodayCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId?: number;
  onPracticeUpdate?: () => void;
}

const TodayCalendarModal: React.FC<TodayCalendarModalProps> = ({
  isOpen,
  onClose,
  trackId,
  onPracticeUpdate,
}) => {
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showUncompleteConfirm, setShowUncompleteConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Get data and functions from context (including ensureTrackAddedDate)
  const { 
    tracks, 
    practiceChecks, 
    toggleCheck, 
    markTrackComplete, 
    unmarkTrackComplete,
    updateTrackAddedDate  // New action to add
  } = usePracticeData();

  const track = trackId !== undefined ? (tracks.find((t) => t.id === trackId) ?? null) : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  const handleDayClick = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const todayStr = toDateStr(dayjs());
    if (dateStr > todayStr) return;

    // Simplified using context function - automatically syncs all pages!
    toggleCheck(dateStr, trackId!);
    
    // Delegate track added date correction to context
    if (track && track.addedDate > dateStr) {
      updateTrackAddedDate(trackId!, dateStr);
    }
    
    setSelectedDate(date);
    if (onPracticeUpdate) onPracticeUpdate();
  };

  const handleComplete = () => {
    if (isCompleted) {
      setShowUncompleteConfirm(true);
    } else {
      const today = toDateStr(dayjs());
      // Use context function
      markTrackComplete(trackId!, today);
      setShowCompleteConfirm(true);
      setShowConfetti(true); // Start confetti effect
    }
  };

  const handleUncomplete = () => {
    // Use context function
    unmarkTrackComplete(trackId!);
    setShowUncompleteConfirm(false);
    if (onPracticeUpdate) onPracticeUpdate();
    onClose();
  };

  const handleConfettiComplete = () => {
  setShowConfetti(false);
  setShowCompleteConfirm(false); // Close congrats modal only (keep main modal open)
};

  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));
  const handleYearChange = (year: number) => {
    setCurrentMonth(currentMonth.year(year));
    setShowYearPicker(false);
  };

  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfWeek = startOfMonth.startOf("week").add(1, "day");
    const endOfWeek = endOfMonth.endOf("week").add(1, "day");
    const days = [];
    let current = startOfWeek;
    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, "day")) {
      days.push(current);
      current = current.add(1, "day");
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getDayStatus = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const checked = !!(practiceChecks[dateStr] && practiceChecks[dateStr][trackId!]);
    const isFuture = date.isAfter(dayjs(), "day");
    const existed =
      track.addedDate <= dateStr &&
      (!track.completedDate || dateStr <= track.completedDate);
    const isCurrentMonth = date.month() === currentMonth.month();
    return { checked, isFuture, existed, isCurrentMonth };
  };

  const isCompleted = !!track.completedDate;
  const totalPracticeDays = Object.keys(practiceChecks).filter(
    (date) => practiceChecks[date] && practiceChecks[date][trackId!]
  ).length;

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  return (
    <>
      <ConfettiAnimation 
  isActive={showConfetti} 
  onComplete={handleConfettiComplete} // Changed to new function
/>
      
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--modal-backdrop)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          ...commonFontStyle,
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: "calc(100% - 32px)",
            maxWidth: "min(90vw, 420px)",
            height: "auto",
            maxHeight: "calc(100% - 64px)",
            background: "var(--bg-primary)",
            borderRadius: "var(--border-radius-small)",
            border: "var(--border-light)",
            boxSizing: "border-box",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflowY: "auto",
            boxShadow: "var(--modal-shadow)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Song title */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
            <SongNoteIcon style={{ color: "var(--VERY_PERI)" }} width="16" height="16" />
            <span
              style={{
                fontSize: 16,
                color: "var(--text-primary)",
                fontWeight: "normal",
                ...commonFontStyle,
              }}
            >
              {track.title}
            </span>
          </div>

          {/* Total practice days */}
          <div
            style={{
              fontSize: 16,
              color: "var(--text-primary)",
              fontWeight: "normal",
              marginBottom: 10,
              ...commonFontStyle,
            }}
          >
            총 {totalPracticeDays}일 연습
          </div>

          {/* Song completion checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "8px 12px",
              border: "var(--border-light)",
              borderRadius: 3,
              width: "100%",
              height: 33,
              margin: "0 auto 10px auto",
              cursor: "pointer",
            }}
            onClick={handleComplete}
          >
            <div
              style={{
                width: 14,
                height: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isCompleted ? "var(--VERY_PERI)" : "var(--text-secondary)"
              }}
            >
              {isCompleted ? <CheckIcon width="14" height="14" /> : <UncheckIcon width="14" height="14" />}
            </div>
            <span
              style={{
                fontSize: 14,
                color: "var(--text-primary)",
                fontWeight: "normal",
                ...commonFontStyle,
              }}
            >
              곡 완성
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--VIVA_MAGENTA)",
                marginLeft: "auto",
              }}
            >
              * 체크하면 내일 부터 연습 목록에서 사라집니다.
            </span>
          </div>

          {/* Calendar */}
          <div style={{ marginTop: 16 }}>
            {/* Calendar header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <button
                onClick={goToPrevMonth}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <CalLeftIcon width="14" height="8" />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                <span
                  style={{
                    fontSize: 16,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    ...commonFontStyle,
                  }}
                >
                  {currentMonth.format("YYYY년 MM월")}
                </span>
                <button
                  onClick={() => setShowYearPicker(!showYearPicker)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  <CalDownIcon width="9" height="6" />
                </button>

                {showYearPicker && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      background: "var(--bg-primary)",
                      border: "var(--border-light)",
                      borderRadius: 4,
                      padding: 8,
                      zIndex: 1001,
                      maxHeight: 150,
                      overflowY: "auto",
                      boxShadow: "var(--modal-shadow)"
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = dayjs().year() - 5 + i;
                      return (
                        <div
                          key={year}
                          onClick={() => handleYearChange(year)}
                          style={{
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: 14,
                            color: "var(--text-primary)",
                            ...commonFontStyle,
                          }}
                        >
                          {year}년
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={goToNextMonth}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <CalRightIcon width="14" height="8" />
              </button>
            </div>

            {/* Day of week header */}
            <div
              style={{
                display: "flex",
                height: 24,
                width: "100%",
                marginBottom: 10,
              }}
            >
              {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-primary)",
                    fontWeight: "normal",
                    ...commonFontStyle,
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: "100%",
              }}
            >
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  style={{
                    display: "flex",
                    height: 32,
                    width: "100%",
                  }}
                >
                  {week.map((date, dayIndex) => {
                    const { checked, isFuture, existed, isCurrentMonth } = getDayStatus(date);
                    const dateStr = toDateStr(date);
                    const isToday = dateStr === toDateStr(dayjs()); // Check if it's today

                    return (
                      <div
                        key={dayIndex}
                        style={{
                          flex: 1,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          cursor: isFuture || !isCurrentMonth ? "default" : "pointer",
                          opacity: !isCurrentMonth ? 0.3 : 1,
                        }}
                        onClick={() => !isFuture && isCurrentMonth && handleDayClick(date)}
                      >
                        {/* Modified: Make existed condition more inclusive */}
                        {(existed || (!isFuture && isCurrentMonth)) && (
                          checked
                            ? <CompleteIcon style={{
                                position: "absolute",
                                zIndex: 1,
                                width: 32,
                                height: 32,
                                color: "var(--VERY_PERI)",
                                opacity: 0.5
                              }} />
                            : <DonotIcon style={{
                                position: "absolute",
                                zIndex: 1,
                                width: 32,
                                height: 32,
                                color: "var(--text-secondary)",
                                opacity: 0.3
                              }} />
                        )}
                        
                        {/* Add circular indicator for today's date */}
                        {isToday && (
                          <div style={{
                            position: "absolute",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: "1px solid var(--VIVA_MAGENTA)",
                            zIndex: 3,
                            pointerEvents: "none"
                          }} />
                        )}
                        
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: isToday ? "bold" : "bold", // Make today's date bold
                            zIndex: 2,
                            position: "relative",
                            color: isToday 
                              ? "var(--VIVA_MAGENTA)"  // Today's date color
                              : dayIndex === 6 
                                ? "var(--VIVA_MAGENTA)" 
                                : "var(--text-primary)",
                            ...commonFontStyle,
                          }}
                        >
                          {date.date()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Close button */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
              width: "100%",
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: "auto",
                padding: "8px",
                background: "none",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--DARK_GRAY)",
              }}
            >
              <CloseIcon width="20" height="20" />
            </button>
          </div>
        </div>

        {/* Song completion confirmation modal */}
        {showCompleteConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--modal-backdrop-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              padding: '40px',
              borderRadius: 8,
              textAlign: 'center',
              boxShadow: 'var(--modal-shadow)'
            }}>
              <div style={{
                fontSize: 18,
                color: 'var(--VERY_PERI)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <StarIcon width="20" height="20" />
                <span>곡 완성 축하해요!</span>
              </div>
              <div style={{
                fontSize: 14,
                color: 'var(--text-secondary)'
              }}>
                내일부터 연습 목록에 보이지 않습니다.
              </div>
            </div>
          </div>
        )}

       {/* Song un-completion confirmation modal */}
{showUncompleteConfirm && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'var(--modal-backdrop-home)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    padding: "40px 16px", // Add left/right padding
  }}>
    {/* CHANGED: Increased internal padding for better look */}
    <div style={{
      background: 'var(--bg-primary)',
      padding: '24px', // Changed from 10px
      borderRadius: 12, // Softer look
      textAlign: 'center',
      boxShadow: 'var(--modal-shadow)',
      width: '100%',
      maxWidth: '320px' // Set modal max width
    }}>
      

      {/* CHANGED: Modified style to emphasize importance */}
      <div style={{
        fontSize: 18,
        fontWeight: 600, // Bold weight
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '28px', // Space between message and buttons
        lineHeight: 3.0, // Line height for the message itself
      }}>
        다시 연습하시겠습니까?
      </div>

      {/* Button area */}
<div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
 {/* Cancel button */}
 <button
   onClick={() => setShowUncompleteConfirm(false)}
   style={{
     flex: 1,
     height: 25,
     borderRadius: "var(--border-radius-small)",
     border: "none",
     background: "transparent",
     fontSize: 16,
     fontWeight: 600,
     cursor: "pointer",
     transition: "opacity 0.2s ease",
     display: "flex",
     alignItems: "center",
     justifyContent: "center",
     ...commonFontStyle,
     color: "var(--text-secondary)",
   }}
 >
   cancel
 </button>

 {/* Re-register button */}
<button 
 onClick={handleUncomplete} 
 style={{
   flex: 1,
   height: 25,
   background: "transparent",
   border: "none",
   borderRadius: "var(--border-radius-small)",
   cursor: "pointer",
   display: "flex",
   alignItems: "center",
   justifyContent: "center",
   gap: 8,
   color: "var(--VIVA_MAGENTA)",
   ...commonFontStyle,
 }}
>
 <ScoreIcon width={16} height={16} style={{ color: "var(--VIVA_MAGENTA)" }} />
 <span style={{ fontSize: 16, fontWeight: 600, color: "var(--VIVA_MAGENTA)" }}>재등록</span>
</button>
</div>
    </div>
  </div>
)}
      </div>
    </>
  );
};

export default TodayCalendarModal;
