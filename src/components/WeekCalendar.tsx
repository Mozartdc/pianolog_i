import React, { useRef, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { motion, useAnimation } from "framer-motion";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const dragged = useRef(false);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  const CARD_WIDTH = 42;
  const GAP = 8;
  const TOTAL_CARD_WIDTH = CARD_WIDTH + GAP;

  // Track screen width (handle resize/rotation)
  const [screenWidth, setScreenWidth] = useState<number>(343);
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setScreenWidth(Math.round(entry.contentRect.width));
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Generate base date (today) ± 365 days. Memoized to prevent regeneration
  const generateContinuousDates = () => {
    const baseDate = dayjs();
    const dates: dayjs.Dayjs[] = [];
    for (let i = -365; i <= 365; i++) dates.push(baseDate.add(i, "day"));
    return dates;
  };
  const allDates = useMemo(() => generateContinuousDates(), []);

  const todayStr = dayjs().format("YYYY-MM-DD");
  const contentWidth = allDates.length * TOTAL_CARD_WIDTH;
  const maxLeft = Math.max(0, contentWidth - screenWidth);

  // Scroll to center when selected date changes
  useEffect(() => {
    const idx = allDates.findIndex((d) => d.format("YYYY-MM-DD") === selectedDate);
    if (idx < 0) return;
    const targetX = screenWidth / 2 - (idx * TOTAL_CARD_WIDTH + CARD_WIDTH / 2);
    controls.start({
      x: targetX,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    });
  }, [selectedDate, screenWidth, controls]);

  // Handle click (including local storage)
  const handleDateClick = (dateStr: string) => {
    localStorage.setItem("lastSelectedDate", dateStr);
    onDateClick(dateStr);
  };

  // Holiday cache by year
  const holidayCache = useRef(new Map<number, Set<string>>());
  const getHolidaySet = (y: number) => {
    if (!holidayCache.current.has(y)) {
      holidayCache.current.set(y, new Set(getKoreanHolidays(y)));
    }
    return holidayCache.current.get(y)!;
  };

  // Background color helper
  const getCardBackground = (isToday: boolean, isSelected: boolean): string => {
    if (isToday) return themePastelColor;
    if (isSelected) return "var(--info-bg)";
    return "var(--bg-primary)";
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Week calendar"
      style={{
        width: "calc(100% - 32px)",
        height: 56,
        margin: "15px auto 0 auto",
        overflow: "hidden",
        cursor: contentWidth > screenWidth ? "grab" : "default",
        fontFamily: "var(--FONT_FAMILY)",
      }}
    >
      <motion.div
        drag={contentWidth > screenWidth ? "x" : false}
        dragConstraints={{
          right: 0,
          left: -maxLeft,
        }}
        dragTransition={{
          power: 0.15,
          timeConstant: 250,
          modifyTarget: (target) => {
            const center = screenWidth / 2;
            const closestIndex = Math.round(
              (center - target - CARD_WIDTH / 2) / TOTAL_CARD_WIDTH
            );
            const newTarget = center - (closestIndex * TOTAL_CARD_WIDTH + CARD_WIDTH / 2);
            return newTarget;
          },
        }}
        onDragStart={() => {
          dragged.current = false;
        }}
        onDrag={(e, info) => {
          if (Math.abs(info.delta.x) > 3) dragged.current = true;
        }}
        // Flag is reset on pointerDown, not in onDragEnd
        animate={controls}
        initial={false}
        style={{
          display: "flex",
          alignItems: "center",
          width: contentWidth,
          justifyContent: contentWidth > screenWidth ? "flex-start" : "center",
        }}
        whileTap={{ cursor: contentWidth > screenWidth ? "grabbing" : "default" }}
      >
        {allDates.map((date, index) => {
          const dateStr = date.format("YYYY-MM-DD");
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isSunday = date.day() === 0;
          const isSaturday = date.day() === 6;
          const isHoliday = getHolidaySet(date.year()).has(dateStr);

          return (
            <div
              key={index}
              onPointerDown={() => {
                dragged.current = false;
              }}
              onClick={() => {
                if (!dragged.current) handleDateClick(dateStr);
              }}
              onKeyDown={(e) => {
                if (!dragged.current && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleDateClick(dateStr);
                }
              }}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              style={{
                width: CARD_WIDTH,
                height: 56,
                background: getCardBackground(isToday, isSelected),
                border:
                  isSelected && !isToday ? `0.8px solid ${themeColor}` : `0.8px solid transparent`,
                borderRadius: "var(--border-radius-large)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginRight: GAP,
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                transition: "var(--transition-fast)",
                userSelect: "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  color: "var(--text-primary)",
                  lineHeight: "22px",
                  textAlign: "center",
                  ...commonFontStyle,
                }}
              >
                {date.format("D")}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: isSunday || isHoliday
                    ? "var(--VIVA_MAGENTA)"
                    : isSaturday
                    ? "var(--VERY_PERI)"
                    : "var(--text-secondary)",
                  lineHeight: "14px",
                  textAlign: "center",
                  ...commonFontStyle,
                }}
              >
                {date.format("ddd").toLowerCase()}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default WeekCalendar;